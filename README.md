# BandwidthCtrl - Gateway Manager Dashboard

Application React moderne pour la gestion et le contrôle de la bande passante du réseau Gateway.

![Dashboard Preview](./preview.png)

## 🚀 Fonctionnalités

### Dashboard Principal
- **Statistiques en temps réel**
  - Vitesse de téléchargement (Download Speed)
  - Vitesse d'envoi (Upload Speed)
  - Appareils actifs
  - Trafic total quotidien

- **Graphiques interactifs**
  - Graphique d'utilisation de la bande passante sur 24h
  - Distribution du trafic par type (Streaming, Gaming, Browsing, etc.)

### Gestion des Appareils
- Liste détaillée des appareils connectés
- Informations par appareil :
  - Nom et description
  - Adresse IP
  - Vitesses de téléchargement/envoi en temps réel
  - Limites de bande passante
  - Pourcentage d'utilisation

### Actions Rapides
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
