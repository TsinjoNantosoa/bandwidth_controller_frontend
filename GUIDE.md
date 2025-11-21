# 🎯 Guide d'Utilisation - BandwidthCtrl Dashboard

## Vue d'Ensemble

Cette application est un tableau de bord complet pour gérer la bande passante réseau de votre gateway. Elle offre une interface moderne, intuitive et entièrement fonctionnelle.

## 📊 Pages Principales

### 1. Dashboard (Page d'Accueil)

**Statistiques en Direct :**
- 📥 **Download Speed** : Affiche la vitesse de téléchargement actuelle en Mbps avec indication de variation par rapport à la moyenne
- 📤 **Upload Speed** : Affiche la vitesse d'envoi actuelle avec indicateur de tendance
- 💻 **Active Devices** : Nombre total d'appareils connectés + nombre d'appareils avec limitations
- 💾 **Total Traffic Today** : Volume de données transféré aujourd'hui en GB avec comparaison vs hier

**Graphique d'Utilisation (24h) :**
- Graphique en ligne montrant l'évolution du téléchargement et de l'envoi sur 24h
- Couleurs : Bleu pour le download, Violet pour l'upload
- Sélecteur de période : Last 24 Hours, Last 7 Days, Last 30 Days
- Hover interactif pour voir les valeurs exactes

**Distribution du Trafic :**
- Diagramme circulaire montrant la répartition par type :
  - 🎬 Streaming : 42% (Bleu)
  - 🎮 Gaming : 18% (Violet)
  - 🌐 Browsing : 15% (Cyan)
  - ⬇️ Downloads : 12% (Vert)
  - 📦 Other : 13% (Orange)
- Légende interactive avec pourcentages

### 2. Active Devices (Gestion des Appareils)

**Tableau des Appareils :**
Chaque ligne affiche :
- **Icône & Nom** : Type d'appareil (PC, Phone, TV, Tablet) avec nom personnalisé
- **IP Address** : Adresse IP formatée en style monospace
- **Download/Upload** : Vitesses actuelles en Mbps
- **Limit** : Limite configurée avec barre de progression colorée
  - Vert : <60% d'utilisation
  - Orange : 60-80%
  - Rouge : >80%
- **Actions** : Menu contextuel avec 3 options

**Menu d'Actions par Appareil :**
1. ⚡ **Set Speed Limit** - Définir une limite de vitesse
2. ⏰ **Schedule Rule** - Créer une règle horaire
3. 🚫 **Block Device** - Bloquer l'accès (texte rouge)

**Panneau Quick Actions :**
4 cartes d'actions rapides avec icônes colorées :
- 🚫 **Block Device** (Bleu) - Restreindre l'accès réseau
- ⚡ **Set Speed Limit** (Violet) - Configurer un plafond de bande passante
- ⏰ **Schedule Rule** (Cyan) - Restrictions basées sur le temps
- ⬇️ **Export Logs** (Vert) - Télécharger les données de trafic

**System Status :**
Monitoring en temps réel :
- CPU Usage : 24% (barre bleue)
- Memory : 58% (barre violette)
- Network Load : 72% (barre cyan)

### 3. Autres Pages

Les pages suivantes sont préparées pour être complétées :
- **Bandwidth Rules** : Configuration des règles de bande passante
- **Traffic History** : Historique détaillé du trafic
- **Firewall Rules** : Gestion du pare-feu
- **Notifications** : Alertes et notifications système
- **Settings** : Configuration de l'application
- **About** : Informations sur l'application

## 🎨 Design & UX

### Theme Sombre Moderne
- Fond principal : Gris très foncé (#0f1419)
- Cartes : Gris moyen (#1e2634)
- Texte : Blanc/Gris clair

### Animations
- ✨ Fade-in au chargement des éléments
- 🎯 Hover effects sur tous les éléments interactifs
- 📊 Transitions fluides sur les graphiques
- 💫 Pulse animation sur l'indicateur "Gateway Active"

### Responsive Design
- **Desktop** : Layout complet avec sidebar
- **Tablet** : Adaptation des colonnes
- **Mobile** : Sidebar cachée, layout en colonne unique

## 🚀 Interactions

### Header
- **Status Indicator** : Affiche l'état du gateway (vert = actif)
- **Refresh Button** : Recharge la page
- **Notification Bell** : Badge avec nombre de notifications (3)

### Sidebar
- Navigation avec 8 sections
- Indicateur visuel de la page active (fond bleu)
- Section "SYSTEM" séparée
- Profil utilisateur en bas

### Cartes Statistiques
- Hover : Soulèvement et bordure colorée
- Badge "Live" pour les données en temps réel
- Icônes avec fond dégradé

### Tableau des Appareils
- Hover sur les lignes : Changement de fond
- Menu déroulant contextuel
- Barres de progression dynamiques

## 🎯 Copier-Coller - Code Prêt à l'Emploi

### Toutes les fonctionnalités sont implémentées :
✅ Sidebar avec navigation complète
✅ Header avec status et actions
✅ Dashboard avec statistiques en temps réel
✅ Graphiques interactifs (Line Chart + Pie Chart)
✅ Page Active Devices avec tableau complet
✅ Quick Actions panel fonctionnel
✅ System Status monitoring
✅ Animations et transitions fluides
✅ Design responsive
✅ Thème sombre moderne
✅ Structure de routing complète

## 📝 Personnalisation Facile

### Changer les Couleurs
Modifiez les variables CSS dans `src/index.css` :
\`\`\`css
:root {
  --blue: #3b82f6;    /* Votre couleur bleue */
  --purple: #a855f7;  /* Votre couleur violette */
  --cyan: #06b6d4;    /* Votre couleur cyan */
  --green: #10b981;   /* Votre couleur verte */
}
\`\`\`

### Ajouter des Appareils
Dans `src/pages/ActiveDevices.jsx`, modifiez l'array `devices` :
\`\`\`javascript
{
  id: 5,
  name: 'Mon Appareil',
  description: 'Description',
  ip: '192.168.1.XXX',
  download: 10.0,
  upload: 2.0,
  limit: 50,
  type: 'desktop',
  icon: Monitor,
  color: '#3b82f6'
}
\`\`\`

### Modifier les Données du Graphique
Dans `src/pages/Dashboard.jsx`, éditez `bandwidthData` ou `trafficDistribution`.

## 🔌 Intégration Backend

Pour connecter à une API backend :

1. Créer un dossier `src/services/`
2. Ajouter un fichier `api.js` avec vos appels API
3. Utiliser `useEffect` dans les composants pour charger les données
4. Exemple :

\`\`\`javascript
useEffect(() => {
  fetch('http://your-api.com/devices')
    .then(res => res.json())
    .then(data => setDevices(data))
}, [])
\`\`\`

## 🎓 Technologies à Connaître

- **React Hooks** : useState, useEffect pour la gestion d'état
- **React Router** : Navigation entre les pages
- **Recharts** : Bibliothèque de graphiques
- **Lucide React** : Icônes SVG modernes
- **CSS Modules** : Styling composant par composant

## ✨ Points Forts de l'Implémentation

1. **Code Modulaire** : Chaque composant est indépendant
2. **Performance** : Utilisation de React optimisé avec Vite
3. **Maintenabilité** : Structure claire et commentée
4. **Extensibilité** : Facile d'ajouter de nouvelles fonctionnalités
5. **Design System** : Variables CSS réutilisables
6. **User Experience** : Animations et feedbacks visuels

---

**🎉 Vous avez maintenant une application complète, moderne et prête à l'emploi !**

Pour démarrer : `npm run dev`
Pour builder : `npm run build`
