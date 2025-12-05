# 🌐 BandwidthCtrl - Gateway Manager Dashboard

> Application React moderne pour la gestion et le contrôle de la bande passante du réseau Gateway

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.2-646CFF.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Responsive](https://img.shields.io/badge/Responsive-100%25-success.svg)]()

## � Aperçu

Une interface moderne et intuitive pour gérer votre bande passante réseau avec des graphiques en temps réel et une gestion complète des appareils connectés.

## �🚀 Fonctionnalités

### 📊 Dashboard Principal
- **Statistiques en temps réel**
  - Vitesse de téléchargement (Download Speed)
  - Vitesse d'envoi (Upload Speed)
  - Appareils actifs
  - Trafic total quotidien

- **Graphiques interactifs**
  - Graphique d'utilisation de la bande passante sur 24h
  - Distribution du trafic par type (Streaming, Gaming, Browsing, etc.)

### 💻 Gestion des Appareils
- Liste détaillée des appareils connectés
- Informations par appareil :
  - Nom et description
  - Adresse IP
  - Vitesses de téléchargement/envoi en temps réel
  - Limites de bande passante
  - Pourcentage d'utilisation

### ⚡ Actions Rapides
- **Block Device** - Restreindre l'accès réseau
- **Set Speed Limit** - Configurer un plafond de bande passante
- **Schedule Rule** - Restrictions basées sur le temps
- **Export Logs** - Télécharger les données de trafic

### Monitoring Système
- Utilisation du CPU
- Utilisation de la mémoire
- Charge réseau

## 🎨 Technologies Utilisées

- **React 18** - Framework UI
- **React Router** - Navigation
- **Recharts** - Graphiques et visualisations
- **Lucide React** - Icônes modernes
- **Vite** - Build tool et dev server
- **CSS3** - Styling avec variables CSS et animations

## 📦 Installation

1. Cloner le repository :
\`\`\`bash
git clone <your-repo-url>
cd bandwidth_frontend
\`\`\`

2. Installer les dépendances :
\`\`\`bash
npm install
\`\`\`

3. Lancer le serveur de développement :
\`\`\`bash
npm run dev
\`\`\`

4. Ouvrir votre navigateur à l'adresse : `http://localhost:5173`

## 🏗️ Build pour Production

\`\`\`bash
npm run build
\`\`\`

Les fichiers optimisés seront générés dans le dossier `dist/`.

Pour prévisualiser le build de production :
\`\`\`bash
npm run preview
\`\`\`

## 📁 Structure du Projet

\`\`\`
bandwidth_frontend/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Layout.jsx
│   │   │   └── Layout.css
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.jsx
│   │   │   └── Sidebar.css
│   │   └── Header/
│   │       ├── Header.jsx
│   │       └── Header.css
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Dashboard.css
│   │   ├── ActiveDevices.jsx
│   │   ├── ActiveDevices.css
│   │   ├── BandwidthRules.jsx
│   │   ├── TrafficHistory.jsx
│   │   ├── FirewallRules.jsx
│   │   ├── Notifications.jsx
│   │   ├── Settings.jsx
│   │   └── About.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── README.md
\`\`\`

## 🎨 Palette de Couleurs

Le design utilise un thème sombre avec des accents colorés :

- **Bleu** (#3b82f6) - Téléchargement, actions principales
- **Violet** (#a855f7) - Envoi, actions secondaires
- **Cyan** (#06b6d4) - Appareils, informations
- **Vert** (#10b981) - Succès, trafic positif
- **Orange** (#f59e0b) - Avertissements
- **Rouge** (#ef4444) - Erreurs, actions dangereuses

## 🔧 Configuration

### Variables CSS
Toutes les couleurs et styles sont définis dans `src/index.css` en utilisant des variables CSS :

\`\`\`css
:root {
  --bg-primary: #0f1419;
  --bg-secondary: #1a1f2e;
  --bg-card: #1e2634;
  --blue: #3b82f6;
  --purple: #a855f7;
  --cyan: #06b6d4;
  --green: #10b981;
  /* ... */
}
\`\`\`

## 📱 Responsive Design

L'application est entièrement responsive et s'adapte à :
- Desktop (>1200px)
- Tablette (768px - 1200px)
- Mobile (<768px)

## 🚀 Fonctionnalités à Venir

- [ ] Authentification utilisateur
- [ ] API backend pour données réelles
- [ ] Notifications push en temps réel
- [ ] Thème clair/sombre configurable
- [ ] Export de rapports PDF
- [ ] Historique détaillé par appareil
- [ ] Règles de bande passante avancées
- [ ] Configuration du pare-feu

## 📝 Licence

MIT License - Libre d'utilisation pour vos projets

## 👨‍💻 Développement

Pour contribuer au projet :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📧 Support

Pour toute question ou problème, n'hésitez pas à ouvrir une issue sur GitHub.

---

**Développé avec ❤️ en utilisant React et Vite**

## **Integration Backend (QoS)**

- **But**: ce dossier frontend a été connecté au backend QoS (service Go) afin de permettre la configuration et la gestion des règles de bande passante depuis l'interface.

- **Fichiers ajoutés / modifiés**:
  - `src/services/api.js` : wrapper des appels HTTP vers le backend (`/qos/*`).
  - `src/pages/BandwidthRules.jsx` : interface pour initialiser HTB, appliquer des limites simples, et réinitialiser les règles — fait appel aux fonctions du service API.
  - `vite.config.js` : proxy de développement pour rediriger `/qos` et `/swagger` vers `http://localhost:8080` (évite les problèmes CORS en dev).

- **Endpoints backend utilisés** (exemples) :
  - `POST /qos/setup` — initialiser la structure HTB
  - `POST /qos/htb/global/limit` — mettre à jour la limite HTB globale
  - `POST /qos/simple/limit` — appliquer une limitation simple (TBF)
  - `POST /qos/reset` — réinitialiser toutes les règles

- **Comment tester la communication (local)** :
  1. Démarrez le backend QoS (doit être lancé sur `http://localhost:8080`) — le backend doit être exécuté par votre collègue ou vous-même. Exemple :
     ```bash
     cd /path/to/bandwidth_controller_backend
     sudo ./qos-app wlp2s0 wlp2s0
     ```
     > Attention : le backend exécute `tc` et requiert des droits root. Les commandes `tc` peuvent échouer selon le pilote/interface (erreurs `Exclusivity flag on`).

  2. Lancez le frontend :
     ```bash
     cd /home/sandaniaina/Documents/projet/bandwidth_frontend
     npm install
     npm run dev
     ```

  3. Ouvrez `http://localhost:5174/` et allez sur **Bandwidth Rules**. Cliquez sur **Initialize HTB Structure** ou ajoutez une règle. Ouvrez DevTools → Network pour vérifier la requête `POST` vers `/qos/setup`.

  4. Test via curl (passé par le proxy Vite) :
     ```bash
     curl -v -X POST http://localhost:5174/qos/setup \
       -H 'Content-Type: application/json' \
       -d '{"lan_interface":"wlp2s0","wan_interface":"wlp2s0","total_bandwidth":"100mbit"}'
     ```

- **Production / déploiement** : ne pas compter sur le proxy Vite. Configurez l'URL du backend via une variable d'environnement lors du build :
  - Remplacer la valeur de `API_BASE_URL` dans `src/services/api.js` par `import.meta.env.VITE_API_URL || ''` puis set `VITE_API_URL` en production.

- **Observation importante** : si le backend renvoie une erreur liée à `tc` (ex: `Exclusivity flag on`), cela signifie que la modification de qdisc est bloquée par le système/driver — ce problème doit être résolu côté machine exécutant le backend (changement d'interface, arrêt d'un service concurrent, ou utilisation d'une interface filaire pour les tests).

---


