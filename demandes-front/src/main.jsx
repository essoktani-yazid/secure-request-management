import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import keycloak from './keycloak.js';
import './index.css';

keycloak.init({
  onLoad: 'login-required',
  pkceMethod: 'S256',
  checkLoginIframe: false
}).then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}).catch((error) => {
  console.error('Erreur de connexion Keycloak', error);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div class="max-w-md w-full bg-white rounded-2xl border border-rose-200 shadow-xl p-8 text-center space-y-4">
          <div class="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h2 class="text-lg font-bold text-slate-900">Connexion Keycloak Impossible</h2>
          <p class="text-sm text-slate-600 leading-relaxed">
            Le serveur d'identité Keycloak n'est pas joignable sur <code class="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-teal-700">http://localhost:8080</code>.
          </p>
          <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left font-mono text-xs text-slate-700">
            docker compose up -d
          </div>
          <button onclick="window.location.reload()" class="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition shadow-sm">
            Réessayer la connexion
          </button>
        </div>
      </div>
    `;
  }
});

