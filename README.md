# BlogappTemplate

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/app/browser/` directory (the output path is configured as `dist/app` in `angular.json`). By default, the production build optimizes your application for performance and speed.

## Deployment to Azure Storage (Static Website)

The app is hosted as a static website on an Azure Storage Account (`$web` container).

### One-time setup in the Azure Portal

1. **Create a Storage Account** (Standard, LRS, a permitted region such as `polandcentral`).
2. Open the account → **Static website** (under _Data management_) → **Enabled**.
   - **Index document name:** `index.html`
   - **Error document path:** `index.html` (required for Angular client-side routing — every unknown path falls back to `index.html`)
   - **Save**. The primary endpoint looks like `https://<account>.z16.web.core.windows.net`.

> Note: `staticwebapp.config.json` is only honoured by Azure **Static Web Apps**, not by Storage static-website hosting. Routing falls back via the **Error document path** instead.

### Manual deploy with the Azure CLI

```bash
ng build
az login

# Optional: clear stale (hashed) files first so $web matches the build exactly
az storage blob delete-batch --account-name <account> --source '$web'

az storage blob upload-batch \
  --account-name <account> \
  --source dist/app/browser \
  --destination '$web' \
  --overwrite
```

### Automatic deploy via GitHub Actions

`.github/workflows/azure-deploy.yml` builds and uploads to `$web` on every push to `main`.
Add these repository secrets (Settings → Secrets and variables → Actions):

- `STORAGE_ACCOUNT_NAME` — the storage account name
- `STORAGE_ACCOUNT_KEY` — an access key (Storage account → _Access keys_)

## Authentication (BFF-Pattern)

Login und Logout laufen über einen Backend-for-Frontend in `bff/` (Azure Functions, Keycloak,
Authorization Code Flow + PKCE). Der Browser hält nie ein Token, nur ein HTTP-Only-Cookie.

```bash
cd bff && npm install                              # einmalig
cp bff/local.settings.json.example bff/local.settings.json   # Keycloak-Werte eintragen
npm start                                          # Frontend (4200) + BFF (7071) zusammen
```

Details, Endpoints, Keycloak-Client-Einstellungen und Troubleshooting: [docs/bff-auth.md](docs/bff-auth.md).

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
