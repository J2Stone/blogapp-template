# Authentication mit dem BFF-Pattern

Der Browser speichert nie ein Token. Er bekommt ein HTTP-Only-Cookie, das JavaScript nicht lesen
kann; die Tokens liegen serverseitig im BFF (Azure Functions), der als Confidential Client den
OAuth-Flow gegen Keycloak ausführt und API-Calls mit Bearer Token weiterreicht.

```
Browser (Angular SPA)
  ↕ HTTP-Only Cookie (__session.0, __session.1, …)
BFF (Azure Functions, bff/)
  ↕ Authorization Code Flow + PKCE (S256), Bearer Token serverseitig
Keycloak
  ↕
Blog Backend API
```

Was das Pattern leistet: eingeschleustes JavaScript kann das Token nicht auslesen und damit nicht
exfiltrieren. Was es **nicht** leistet: Missbrauch der Session. Ein Skript auf der Seite kann
`fetch('/api/entries', { method: 'POST', credentials: 'include' })` aufrufen, und der Browser hängt
das Cookie an. Gegen XSS selbst hilft nur, keine XSS-Lücke zu haben.

## Login-Flow

1. Klick auf „Login" → `/login` → Button navigiert (kein `fetch`!) zu
   `GET /api/auth/login?returnUrl=/add-blog`
2. Der BFF erzeugt `code_verifier` + `code_challenge` (S256), versiegelt beides zusammen mit `state`
   und `returnUrl` im kurzlebigen `__pkce`-Cookie → 302 zur Login-Seite von Keycloak
3. Der User meldet sich **bei Keycloak** an – die App hat kein Passwortfeld → 302 zurück auf
   `GET /api/auth/callback?code=…&state=…`
4. Der BFF vergleicht `state`, tauscht den Code serverseitig gegen die Tokens (mit Client Secret
   **und** `code_verifier`), setzt die `__session.*`-Cookies und leitet auf `returnUrl` weiter

Ein `fetch()` auf `/api/auth/login` funktioniert nicht: der Browser muss dem Redirect zu Keycloak
selbst folgen und danach das `__pkce`-Cookie zum Callback zurücktragen.

## Endpoints

| Endpoint                      | Methode          | Beschreibung                                                                                                                                             |
| ----------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/auth/login?returnUrl=…` | GET              | Navigation. 302 auf Keycloak, setzt `__pkce`. Kein CSRF-Header möglich, es wird nichts mutiert                                                           |
| `/api/auth/callback`          | GET              | Nur von Keycloak aufgerufen. Tauscht den Code, setzt `__session.*`, 302 auf `returnUrl`. Fehler: 302 auf `/login?error=access_denied\|expired\|failed`   |
| `/api/auth/me`                | GET              | `{ isAuthenticated, user }`. Refresht abgelaufene Tokens transparent                                                                                     |
| `/api/auth/logout`            | POST             | CSRF-geschützt. Löscht die Session, antwortet mit `{ logoutUrl }` – dorthin muss das Frontend navigieren, sonst bleibt die Keycloak-SSO-Session bestehen |
| `/api/entries`                | GET/POST         | Proxy. GET öffentlich, POST nur mit Session                                                                                                              |
| `/api/entries/{id}`           | GET/PATCH/DELETE | Proxy, schreibend nur mit Session                                                                                                                        |

Einen `auth/refresh`-Endpoint gibt es bewusst nicht: der Refresh passiert innerhalb von `/auth/me`
und im Proxy, bevor die eigentliche Arbeit läuft.

## Lokal starten

```bash
cd bff && npm install          # einmalig
cp bff/local.settings.json.example bff/local.settings.json
# Keycloak-Werte eintragen (Dozent), SESSION_SECRET: openssl rand -base64 32

npm start                      # startet Frontend (4200) und BFF (7071) zusammen
```

`ALLOWED_ORIGIN` muss exakt `http://localhost:4200` sein, ohne Schrägstrich am Ende: daraus baut der
BFF die `redirect_uri`, und die muss byteweise zu der in Keycloak registrierten passen.

Frontend und BFF laufen über `proxy.conf.json` auf **derselben Origin**. Das ist kein Komfort:

- `http://localhost:4200` → `http://localhost:7071` wäre cross-site, der Browser würde das
  `SameSite=Lax`-Session-Cookie verwerfen. Der Login „gelingt" und jeder Folge-Request ist anonym.
- `Secure`-Cookies werden über plain http verworfen, deshalb leitet `session.ts` das Flag aus
  `ALLOWED_ORIGIN` ab.

## Keycloak-Client

| Einstellung                     | Wert                                      |
| ------------------------------- | ----------------------------------------- |
| Client authentication           | **On** (confidential)                     |
| Standard flow                   | **On**                                    |
| Direct access grants            | **Off** – schliesst den ROPC-Pfad         |
| PKCE Code Challenge Method      | **S256**                                  |
| Valid redirect URIs             | `http://localhost:4200/api/auth/callback` |
| Valid post logout redirect URIs | `http://localhost:4200/`                  |

## Verifizieren

```bash
# 302 auf Keycloak mit code_challenge_method=S256, plus Set-Cookie: __pkce
curl -s -o /dev/null -D - "http://localhost:4200/api/auth/login?returnUrl=/add-blog" \
  | grep -iE "^location:|^set-cookie:"

# anonym: {"isAuthenticated":false,"user":null}
curl -s http://localhost:7071/api/auth/me

# Fehlerpfade des Callbacks sind Redirects, niemals JSON
curl -s -o /dev/null -D - "http://localhost:4200/api/auth/callback?error=access_denied" | grep -i location
```

Danach echt einloggen und ins Function-Log schauen: **ein Callback, der in wenigen Millisekunden
fertig ist, hat nichts getauscht** – ein echter Token-Exchange dauert 100–500 ms. Anschliessend
prüfen, dass der Browser `__session.0` (und ggf. `.1`) hält, `/auth/me` den User meldet, und dass
Ausloggen und wieder Einloggen erneut nach dem Passwort fragt.

## Frontend

| Datei                                  | Rolle                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `src/app/shared/auth.store.ts`         | Signal-State, `checkSession()`, `logout()`, `ready`-Promise            |
| `src/app/shared/auth.guard.ts`         | `CanMatchFn`, wartet auf `ready`, prüft Rolle `user`                   |
| `src/app/shared/cookie.interceptor.ts` | `withCredentials` + `X-Requested-With` für alle BFF-Requests           |
| `src/app/feature/login/`               | Login-Seite ohne Formular, liest `returnUrl` und `error` per `input()` |
| `src/app/feature/add-blog/`            | Geschützte Route (`canMatch: [authGuard]`)                             |

Der Store hat bewusst **keine** `login(username, password)`-Methode: der Login ist eine Navigation,
kein Request. Das Passwort wird auf der Keycloak-Seite getippt.

`canMatch` statt `canActivate`: die Prüfung läuft, bevor die Route matcht, der Lazy-Chunk der
geschützten Seite wird also gar nicht erst heruntergeladen.

## Produktion

Das Deployment (`.github/workflows/azure-deploy.yml`) legt das Frontend auf eine
Azure-Storage-Static-Website, und ein Storage Account kann keine Azure Functions hosten – dort gibt
es kein `/api`. Deshalb setzt `src/environments/environment.ts`:

- `apiUrl` direkt aufs Backend (öffentliche Leseaufrufe funktionieren weiter)
- `authEnabled: false` – `checkSession()` fragt gar nicht erst, der Login-Button ist ausgeblendet,
  und der Guard schickt auf `/`, statt eine Anmeldung anzubieten, die in einen 404 laufen würde

Damit der Login auch deployed funktioniert, müsste das Frontend auf Azure Static Web Apps ziehen
(hostet Functions unter `/api`, same-origin bleibt erhalten) oder der BFF als eigene Function App
laufen – dann wäre `/api` cross-origin und bräuchte `SameSite=None`, echtes CORS und eine andere
`redirect_uri`.
