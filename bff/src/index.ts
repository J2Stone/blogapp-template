// Jede Function-Datei muss hier importiert werden, damit die Registrierung per
// app.http() ueberhaupt ausgefuehrt wird. package.json zeigt mit "main" auf die
// kompilierte Fassung dieser Datei.
import './functions/auth-login.js';
import './functions/auth-callback.js';
import './functions/auth-logout.js';
import './functions/auth-me.js';
import './functions/proxy-entries.js';
import './functions/proxy-entry-by-id.js';
