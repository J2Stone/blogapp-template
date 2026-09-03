export const environment = {
  production: false,
  // ng serve proxyt /api an den BFF (siehe proxy.conf.json). Same-origin ist hier
  // Voraussetzung, nicht Komfort: ueber http://localhost:7071 waere jeder Aufruf
  // cross-site und der Browser wuerde das SameSite=Lax-Session-Cookie verwerfen.
  apiUrl: '/api',
  bffUrl: '/api',
  authEnabled: true,
};
