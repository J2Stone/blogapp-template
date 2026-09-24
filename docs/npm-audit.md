# npm audit – Findings

Stand: 24.09.2026, Branch `feat-responsive-design-and-security`.

## Zusammenfassung

| Paket          | Vorher: alle                    | Vorher: nur Produktion (`--omit=dev`) | **Nach `npm audit fix`**            |
| -------------- | ------------------------------- | ------------------------------------- | ----------------------------------- |
| Frontend (`/`) | 21 (2 low, 9 moderate, 10 high) | 3 moderate (Angular)                  | **0**                               |
| BFF (`/bff`)   | 2 high                          | 0                                     | 2 high (bewusst offen, siehe unten) |

Die Unterscheidung ist entscheidend: Nur Produktions-Dependencies landen im Browser-Bundle
bzw. laufen im deployten BFF. Dev-Dependencies laufen nur lokal beim Bauen, Testen und Linten.

## Produktion: Angular 22.0.8 (moderate)

| Advisory                                                                                                                         | Betrifft                                      | Betroffen?                                                      |
| -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------- |
| [GHSA-hh8m-fm6v-7cvg](https://github.com/advisories/GHSA-hh8m-fm6v-7cvg) – Sanitization-Bypass über Host-Bindings von Direktiven | `@angular/core`, `@angular/compiler` < 22.1.0 | Nein – das Projekt nutzt weder `host:` noch `@HostBinding`.     |
| [GHSA-p297-fm68-3q8c](https://github.com/advisories/GHSA-p297-fm68-3q8c) – Information Leak über `HttpTransferCache`             | `@angular/common` 22.0.0 – 22.1.0             | Nein – betrifft nur SSR; das Projekt rendert rein clientseitig. |

**Massnahme (erledigt):** Trotzdem auf Angular ≥ 22.1 aktualisiert (`npm audit fix`, kein Breaking Change),
damit eine spätere Host-Binding oder SSR nicht still verwundbar wird.

## Dev-Dependencies (nicht im Bundle)

Alle übrigen 18 Findings im Frontend stecken in Build-, Test- und Lint-Tooling. Beispiele:

| Paket                                                  | Schwere       | Kommt über                      | Einschätzung                                             |
| ------------------------------------------------------ | ------------- | ------------------------------- | -------------------------------------------------------- |
| `postcss`, `nanoid`                                    | high          | `@angular/build`                | Liest nur eigene Styles beim Build – kein fremder Input. |
| `undici`                                               | high          | `jsdom` (Tests), `@angular/cli` | Nur in Tests bzw. CLI-Downloads.                         |
| `ip-address`, `qs`, `hono`                             | high/moderate | `@angular/cli` → MCP-Server     | Nur relevant, wenn `ng mcp` als Server läuft.            |
| `js-yaml`                                              | high          | `@commitlint/cli`               | Parst nur die eigene Config.                             |
| `vitest`, `esbuild`, `immutable`, `browserslist` u. a. | low–high      | Test-/Build-Tooling             | Lokal, kein Angreifer-Input.                             |

**Massnahme (erledigt):** `npm audit fix` hat alle ohne Breaking Change behoben.

## BFF: `extract-zip` (high)

Kommt über `azure-functions-core-tools` (Dev-Dependency, lokale Functions-Runtime) und wird nur
beim Installieren der Core Tools genutzt. `npm audit fix --force` würde auf Core Tools v3
downgraden und damit das v4-Programmiermodell brechen – **bewusst nicht behoben**, bis die Core
Tools selbst eine gepatchte Version ausliefern.

## Wiederholen

```bash
npm audit --omit=dev              # was in Produktion landet
npm audit --omit=dev --prefix bff
npm audit                         # inkl. Tooling
```
