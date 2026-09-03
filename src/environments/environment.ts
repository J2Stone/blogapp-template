export const environment = {
  production: true,
  // Das Deployment liegt auf einer Azure-Storage-Static-Website, die keine Azure
  // Functions hosten kann – dort gibt es kein /api. Lesende Zugriffe gehen deshalb
  // direkt ans Backend, und authEnabled schaltet den Login-Flow wirklich ab, statt
  // einen Button anzubieten, der in einen 404 laeuft.
  apiUrl: 'https://d-cap-blog-backend---v2.whitepond-b96fee4b.westeurope.azurecontainerapps.io',
  bffUrl: '/api',
  authEnabled: false,
};
