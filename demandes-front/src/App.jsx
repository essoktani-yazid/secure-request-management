import React, { useEffect, useState } from 'react';
import keycloak from './keycloak.js';
import { appelerApi, appelerApiSansToken } from './api.js';
import {
  Shield,
  ShieldCheck,
  User,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Clock,
  LogOut,
  RefreshCw,
  Key,
  FileText,
  AlertCircle,
  ExternalLink,
  X,
  SlidersHorizontal,
  ChevronRight,
  Fingerprint
} from 'lucide-react';

export default function App() {
  const [objet, setObjet] = useState('');
  const [mesDemandes, setMesDemandes] = useState([]);
  const [toutes, setToutes] = useState([]);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [adminFilter, setAdminFilter] = useState('ALL');
  const [apiProfilData, setApiProfilData] = useState(null);
  const [publicApiMessage, setPublicApiMessage] = useState(null);

  const roles = keycloak.tokenParsed?.realm_access?.roles || [];
  const isAdmin = roles.includes('ADMIN');
  const isUser = roles.includes('USER');
  const username = keycloak.tokenParsed?.preferred_username || 'Utilisateur';
  const email = keycloak.tokenParsed?.email || `${username}@formation.ma`;
  const subjectId = keycloak.subject || keycloak.tokenParsed?.sub || '';

  // Notification helper
  const notify = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Chargement des données
  async function charger() {
    setLoading(true);
    try {
      const data = await appelerApi('/api/demandes');
      setMesDemandes(data);

      if (isAdmin) {
        const adminData = await appelerApi('/api/admin/demandes');
        setToutes(adminData);
      }
    } catch (e) {
      notify('error', 'Erreur de synchronisation : ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  // Charger le profil (Fonctionnalité 16.2)
  async function chargerProfil() {
    try {
      const data = await appelerApi('/api/profil');
      setApiProfilData(data);
    } catch (e) {
      console.error('Erreur chargement profil API:', e);
    }
  }

  // Tester l'API publique
  async function testerApiPublique() {
    try {
      const res = await appelerApiSansToken('/api/public');
      setPublicApiMessage(res.message);
      notify('success', `API Publique : "${res.message}" (200 OK sans token)`);
    } catch (e) {
      notify('error', 'Erreur API publique : ' + e.message);
    }
  }

  useEffect(() => {
    charger();
    chargerProfil();
  }, []);

  // Créer une demande
  async function creer(e) {
    e.preventDefault();
    if (!objet.trim()) return;

    try {
      await appelerApi('/api/demandes', {
        method: 'POST',
        body: JSON.stringify({ objet: objet.trim() })
      });
      setObjet('');
      setIsAddModalOpen(false);
      notify('success', 'Demande soumise avec succès.');
      await charger();
    } catch (e) {
      notify('error', 'Erreur lors de la création : ' + e.message);
    }
  }

  // Valider une demande (ADMIN)
  async function valider(id) {
    try {
      await appelerApi(`/api/admin/demandes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ statut: 'VALIDEE' })
      });
      notify('success', `Demande #${id} validée avec succès.`);
      await charger();
    } catch (e) {
      notify('error', 'Erreur lors de la validation : ' + e.message);
    }
  }

  // Refuser une demande (ADMIN - Fonctionnalité 16.1)
  async function refuser(id) {
    try {
      await appelerApi(`/api/admin/demandes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ statut: 'REFUSEE' })
      });
      notify('success', `Demande #${id} refusée.`);
      await charger();
    } catch (e) {
      notify('error', 'Erreur lors du refus : ' + e.message);
    }
  }

  // Déconnexion
  function deconnexion() {
    keycloak.logout({
      redirectUri: 'http://localhost:5173/'
    });
  }

  // Statistiques calculées
  const mesEnAttente = mesDemandes.filter((d) => d.statut === 'EN_ATTENTE').length;
  const mesValidees = mesDemandes.filter((d) => d.statut === 'VALIDEE').length;
  const mesRefusees = mesDemandes.filter((d) => d.statut === 'REFUSEE').length;

  const adminFiltrees = toutes.filter((d) => {
    if (adminFilter === 'ALL') return true;
    return d.statut === adminFilter;
  });

  return (
    <div className="min-h-screen w-full flex flex-col m-0 p-0 bg-slate-50 text-slate-900 font-sans">
      {/* 1. Header Pleine Largeur Sticky */}
      <header className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="w-full px-4 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo & Titre de l'atelier */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-slate-900">DEMANDES & SÉCURITÉ</span>
                <span className="text-slate-300">/</span>
                <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                  OAuth 2.0 + OIDC
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                React PKCE (S256) • Spring Boot Resource Server • Keycloak
              </p>
            </div>
          </div>

          {/* Profil Utilisateur & Actions */}
          <div className="flex items-center gap-3">
            {/* Chip Profil */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 shadow-xs">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                  {username.slice(0, 2)}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-400/30" />
              </div>
              <div className="text-left hidden md:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-900 capitalize">{username}</span>
                  {isAdmin ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                      Admin
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-semibold">
                      Utilisateur
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 font-mono leading-none block mt-0.5 truncate max-w-[130px]">
                  {email}
                </span>
              </div>
            </div>

            {/* Bouton Inspecteur OIDC */}
            <button
              onClick={() => setIsInspectorOpen(true)}
              title="Inspecter le jeton JWT et les claims"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition active:scale-95 border border-slate-200"
            >
              <Key className="w-3.5 h-3.5 text-teal-600" />
              <span>Jeton JWT</span>
            </button>

            {/* Déconnexion */}
            <button
              onClick={deconnexion}
              title="Se déconnecter de Keycloak"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition active:scale-95 border border-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Notifications Toast Flottantes */}
      {message && (
        <div className="fixed top-20 right-6 z-50 animate-message-in">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium ${
              message.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {message.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            )}
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Contenu Principal en Pleine Largeur avec Bento Grid */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Ligne d'Information Protocole & Bannière */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Gestion Sécurisée des Demandes Applicatives
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Authentification déléguée à <span className="font-semibold text-slate-700">Keycloak</span> via OpenID Connect (PKCE S256). Contrôle d'accès RBAC validé par <span className="font-semibold text-slate-700">Spring Security</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={testerApiPublique}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Tester API Publique</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nouvelle Demande</span>
            </button>
          </div>
        </div>

        {/* 2. Cartes Bento Grid : Métriques KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Total Demandes */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Mes Demandes</span>
              <FileText className="w-4 h-4 text-teal-600" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-mono font-bold text-slate-900 tracking-tight">
                {mesDemandes.length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Créées par {username}</p>
            </div>
          </div>

          {/* En attente */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-700">En Attente</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-mono font-bold text-amber-600 tracking-tight">
                {mesEnAttente}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">En cours d'examen</p>
            </div>
          </div>

          {/* Validées */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-700">Validées</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-mono font-bold text-emerald-600 tracking-tight">
                {mesValidees}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Approuvées par l'admin</p>
            </div>
          </div>

          {/* Refusées */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-rose-700">Refusées</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-mono font-bold text-rose-600 tracking-tight">
                {mesRefusees}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Non accordées</p>
            </div>
          </div>
        </div>

        {/* 3. Section Principale : Mes Demandes (Accessible à tous les utilisateurs) */}
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-sm tracking-tight">Mes Demandes Personnelles</h2>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {mesDemandes.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Filtrées automatiquement côté backend par le claim <code className="font-mono text-teal-700 bg-teal-50 px-1 rounded">sub</code> du JWT
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={charger}
                disabled={loading}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition active:scale-95 border border-slate-200"
                title="Actualiser la liste"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition shadow-xs active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Créer</span>
              </button>
            </div>
          </div>

          {/* Liste des Demandes */}
          {mesDemandes.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Aucune demande enregistrée</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Vous n'avez pas encore soumis de demande. Cliquez sur "Créer" pour envoyer votre première requête à l'administration.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-medium hover:bg-teal-700 transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Créer une demande
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-5">ID</th>
                    <th className="py-3 px-5">Objet de la Demande</th>
                    <th className="py-3 px-5">Statut</th>
                    <th className="py-3 px-5">Propriétaire (sub)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {mesDemandes.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-5 font-mono font-bold text-slate-900">
                        #{d.id}
                      </td>
                      <td className="py-3 px-5 font-medium text-slate-800">
                        {d.objet}
                      </td>
                      <td className="py-3 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            d.statut === 'VALIDEE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : d.statut === 'REFUSEE'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              d.statut === 'VALIDEE'
                                ? 'bg-emerald-500'
                                : d.statut === 'REFUSEE'
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                            }`}
                          />
                          {d.statut === 'VALIDEE'
                            ? 'Validée'
                            : d.statut === 'REFUSEE'
                            ? 'Refusée'
                            : 'En attente'}
                        </span>
                      </td>
                      <td className="py-3 px-5 font-mono text-[11px] text-slate-400 truncate max-w-[200px]" title={d.owner}>
                        {d.owner}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 4. Section Administrateur (Conditionnelle : isAdmin uniquement) */}
        {isAdmin && (
          <section className="bg-white rounded-2xl border border-purple-200 shadow-xs overflow-hidden">
            {/* Header Admin */}
            <div className="p-5 border-b border-purple-100 bg-purple-50/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-purple-100 text-purple-700 flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="font-bold text-slate-900 text-sm tracking-tight">
                    Administration — Toutes les Demandes
                  </h2>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                    {toutes.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Accès restreint au rôle <code className="font-mono text-purple-700 bg-purple-50 px-1 rounded font-semibold">ADMIN</code> (API: <code className="font-mono text-xs">/api/admin/demandes</code>)
                </p>
              </div>

              {/* Filtres par statut */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                {['ALL', 'EN_ATTENTE', 'VALIDEE', 'REFUSEE'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setAdminFilter(f)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${
                      adminFilter === f
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {f === 'ALL'
                      ? 'Toutes'
                      : f === 'EN_ATTENTE'
                      ? 'En Attente'
                      : f === 'VALIDEE'
                      ? 'Validées'
                      : 'Refusées'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tableau d'Administration */}
            {adminFiltrees.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                Aucune demande dans cette catégorie.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-5">ID</th>
                      <th className="py-3 px-5">Objet</th>
                      <th className="py-3 px-5">Propriétaire (sub)</th>
                      <th className="py-3 px-5">Statut Actuel</th>
                      <th className="py-3 px-5 text-right">Actions de Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {adminFiltrees.map((d) => (
                      <tr key={d.id} className="hover:bg-purple-50/20 transition-colors">
                        <td className="py-3 px-5 font-mono font-bold text-slate-900">
                          #{d.id}
                        </td>
                        <td className="py-3 px-5 font-medium text-slate-800">
                          {d.objet}
                        </td>
                        <td className="py-3 px-5 font-mono text-[11px] text-slate-500 truncate max-w-[180px]" title={d.owner}>
                          {d.owner}
                        </td>
                        <td className="py-3 px-5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                              d.statut === 'VALIDEE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : d.statut === 'REFUSEE'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                d.statut === 'VALIDEE'
                                  ? 'bg-emerald-500'
                                  : d.statut === 'REFUSEE'
                                  ? 'bg-rose-500'
                                  : 'bg-amber-500'
                              }`}
                            />
                            {d.statut === 'VALIDEE'
                              ? 'Validée'
                              : d.statut === 'REFUSEE'
                              ? 'Refusée'
                              : 'En attente'}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right space-x-1.5">
                          {/* Bouton Valider */}
                          {d.statut !== 'VALIDEE' && (
                            <button
                              onClick={() => valider(d.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition active:scale-95 shadow-xs"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Valider</span>
                            </button>
                          )}
                          {/* Bouton Refuser (Fonctionnalité 16.1) */}
                          {d.statut !== 'REFUSEE' && (
                            <button
                              onClick={() => refuser(d.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition active:scale-95 shadow-xs"
                            >
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Refuser</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      {/* 5. Modale Popup : Nouvelle Demande (Clean Frosted Glass) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-modal-in">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Créer une Nouvelle Demande</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={creer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Objet / Motif de la demande *
                </label>
                <input
                  type="text"
                  value={objet}
                  onChange={(e) => setObjet(e.target.value)}
                  placeholder="Ex : Demande de congés exceptionnels, Matériel IT..."
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-sm bg-white text-slate-900 transition"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Votre identifiant unique sera automatiquement associé côté serveur à partir du jeton JWT.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-semibold transition shadow-sm"
                >
                  Soumettre la demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Tiroir Coulissant (Slide-Over Drawer) : Inspecteur OIDC & Profil */}
      {isInspectorOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-[2px] animate-fade-in">
          <div className="w-full sm:w-[480px] h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-drawer-in">
            {/* Header Tiroir */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">Inspecteur OIDC & Claims JWT</h3>
              </div>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenu Tiroir */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
              {/* Profil API Endpoint (Fonctionnalité 16.2) */}
              <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-teal-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-teal-700" /> Données /api/profil (Backend)
                  </span>
                  <span className="text-[10px] font-mono bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-bold">
                    GET 200 OK
                  </span>
                </div>
                {apiProfilData ? (
                  <div className="space-y-1 font-mono text-[11px] text-teal-950">
                    <p><span className="text-teal-700">id :</span> {apiProfilData.id}</p>
                    <p><span className="text-teal-700">username :</span> {apiProfilData.username}</p>
                    <p><span className="text-teal-700">email :</span> {apiProfilData.email || 'non renseigné'}</p>
                    <p><span className="text-teal-700">roles :</span> {apiProfilData.roles?.join(', ')}</p>
                  </div>
                ) : (
                  <p className="text-teal-700 italic">Chargement des données du profil...</p>
                )}
              </div>

              {/* Claims Clés du JWT (Section 15) */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs tracking-tight uppercase text-slate-500">
                  Claims Décodés du Jeton (Section 15)
                </h4>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-800">sub</span>
                      <span className="text-[10px] text-slate-400">Identifiant Unique</span>
                    </div>
                    <p className="font-mono text-[11px] text-slate-600 mt-1 break-all">{subjectId}</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-800">iss</span>
                      <span className="text-[10px] text-slate-400">Émetteur (Realm)</span>
                    </div>
                    <p className="font-mono text-[11px] text-slate-600 mt-1 break-all">
                      {keycloak.tokenParsed?.iss}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-mono font-bold text-slate-800 block">exp</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {keycloak.tokenParsed?.exp
                          ? new Date(keycloak.tokenParsed.exp * 1000).toLocaleTimeString()
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-mono font-bold text-slate-800 block">iat</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {keycloak.tokenParsed?.iat
                          ? new Date(keycloak.tokenParsed.iat * 1000).toLocaleTimeString()
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-800">realm_access.roles</span>
                      <span className="text-[10px] text-slate-400">Rôles Realm</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {roles.map((r) => (
                        <span key={r} className="font-mono text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-800">scope</span>
                      <span className="text-[10px] text-slate-400">Portée OAuth2</span>
                    </div>
                    <p className="font-mono text-[11px] text-slate-600 mt-1">{keycloak.tokenParsed?.scope || 'openid'}</p>
                  </div>
                </div>
              </div>

              {/* Jeton brut (Encodé) */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs tracking-tight uppercase text-slate-500 mb-1.5">
                  En-tête HTTP d'Autorisation
                </h4>
                <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[10px] break-all max-h-36 overflow-y-auto selection:bg-emerald-600 selection:text-white">
                  Authorization: Bearer {keycloak.token}
                </div>
              </div>
            </div>

            {/* Footer Tiroir */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">PKCE Challenge: SHA-256</span>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Bouton d'Action Flottant (FAB) Épuré (Micro-expansion au survol) */}
      <button
        onClick={() => setIsInspectorOpen(true)}
        title="Ouvrir l'inspecteur OIDC & Jeton JWT"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg hover:shadow-teal-600/30 active:scale-95 transition-all duration-300 group border border-teal-500/30"
      >
        <Fingerprint className="w-5 h-5 flex-shrink-0" />
        <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 text-xs font-semibold">
          Inspecteur OIDC & JWT
        </span>
      </button>
    </div>
  );
}

