# 💡 Exemples de Modifications - Code Prêt à Copier

## 🎯 Modifications les Plus Courantes

### 1. Ajouter un Nouvel Appareil

**Fichier:** `src/pages/ActiveDevices.jsx`

**Trouvez la section `useState` et ajoutez :**

```javascript
{
  id: 5,
  name: 'MacBook Pro',
  description: "Sarah's Laptop",
  ip: '192.168.1.110',
  download: 12.5,
  upload: 3.2,
  limit: 100,
  type: 'desktop',
  icon: Monitor,
  color: '#3b82f6'
}
```

---

### 2. Modifier les Statistiques du Dashboard

**Fichier:** `src/pages/Dashboard.jsx`

**Trouvez cette section et modifiez les valeurs :**

```javascript
const [stats, setStats] = useState({
  downloadSpeed: 55.8,        // Changez à votre valeur
  uploadSpeed: 18.3,          // Changez à votre valeur
  activeDevices: 32,          // Changez à votre valeur
  devicesWithLimits: 25,      // Changez à votre valeur
  totalTraffic: 500,          // Changez à votre valeur
  trafficChange: 35           // Changez à votre valeur
})
```

---

### 3. Ajouter des Données au Graphique

**Fichier:** `src/pages/Dashboard.jsx`

**Trouvez `bandwidthData` et ajoutez des points :**

```javascript
const bandwidthData = [
  { time: '00:00', download: 15, upload: 8 },
  { time: '01:00', download: 13, upload: 7 },
  { time: '02:00', download: 12, upload: 6 },
  // Ajoutez autant de points que vous voulez
  { time: '23:00', download: 25, upload: 12 },
]
```

---

### 4. Changer la Distribution du Trafic

**Fichier:** `src/pages/Dashboard.jsx`

**Trouvez `trafficDistribution` et modifiez :**

```javascript
const trafficDistribution = [
  { name: 'Streaming', value: 50, color: '#3b82f6' },
  { name: 'Gaming', value: 20, color: '#a855f7' },
  { name: 'Browsing', value: 15, color: '#06b6d4' },
  { name: 'Downloads', value: 10, color: '#10b981' },
  { name: 'Other', value: 5, color: '#f59e0b' },
]
```

---

### 5. Ajouter une Nouvelle Page dans la Navigation

**Fichier 1:** `src/components/Sidebar/Sidebar.jsx`

**Ajoutez dans `menuItems` :**

```javascript
import { Clock } from 'lucide-react'  // Ajouter l'import

const menuItems = [
  // ... autres items
  { path: '/schedule', icon: Clock, label: 'Schedule', section: 'main' },
]
```

**Fichier 2:** `src/App.jsx`

**Ajoutez la route :**

```javascript
import Schedule from './pages/Schedule'  // Créer ce fichier d'abord

<Routes>
  {/* ... autres routes */}
  <Route path="/schedule" element={<Schedule />} />
</Routes>
```

**Fichier 3:** Créez `src/pages/Schedule.jsx`

```javascript
import React from 'react'

const Schedule = () => {
  return (
    <div className="page">
      <h2>Schedule Rules</h2>
      <p>Configure time-based bandwidth rules.</p>
    </div>
  )
}

export default Schedule
```

---

### 6. Changer le Titre de l'Application

**Fichier 1:** `index.html`

```html
<title>Mon Super Dashboard</title>
```

**Fichier 2:** `src/components/Sidebar/Sidebar.jsx`

```jsx
<div className="logo-text">
  <h1>MonAppli</h1>
  <span>Mon Sous-titre</span>
</div>
```

---

### 7. Modifier les Couleurs du Thème

**Fichier:** `src/index.css`

```css
:root {
  /* Couleurs de fond */
  --bg-primary: #0a0e14;      /* Plus sombre */
  --bg-secondary: #1a1f2e;
  --bg-card: #1e2634;
  
  /* Couleurs d'accent */
  --blue: #4a9eff;            /* Bleu plus clair */
  --purple: #b865ff;          /* Violet plus clair */
  --cyan: #17c7ea;            /* Cyan plus vif */
  --green: #20d397;           /* Vert plus vif */
  --orange: #ffb347;          /* Orange plus doux */
  --red: #ff5555;             /* Rouge plus vif */
}
```

---

### 8. Ajouter une Action Quick Action

**Fichier:** `src/pages/ActiveDevices.jsx`

**Trouvez la section Quick Actions et ajoutez :**

```jsx
<div className="action-card orange">
  <div className="action-icon">
    <AlertTriangle size={24} />
  </div>
  <div className="action-content">
    <div className="action-title">Suspend Device</div>
    <div className="action-description">Temporarily block access</div>
  </div>
</div>
```

**N'oubliez pas l'import :**
```javascript
import { /*... autres icons */, AlertTriangle } from 'lucide-react'
```

---

### 9. Modifier le Profil Utilisateur

**Fichier:** `src/components/Sidebar/Sidebar.jsx`

**Trouvez `.sidebar-footer` et modifiez :**

```jsx
<div className="user-profile">
  <div className="user-avatar">JD</div>
  <div className="user-info">
    <div className="user-name">John Doe</div>
    <div className="user-email">john@example.com</div>
  </div>
</div>
```

---

### 10. Changer le Port du Serveur

**Fichier:** `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,           // Changez le port ici
    open: true,           // Ouvre automatiquement le navigateur
    host: true            // Expose sur le réseau local
  }
})
```

---

### 11. Ajouter une Notification

**Fichier:** `src/components/Header/Header.jsx`

**Modifiez le compteur de notifications :**

```jsx
<span className="notification-badge">7</span>  {/* Changez le nombre */}
```

---

### 12. Personnaliser un Type d'Appareil

**Fichier:** `src/pages/ActiveDevices.jsx`

**Pour ajouter un nouveau type d'appareil (ex: Imprimante) :**

```javascript
import { Printer } from 'lucide-react'  // Import

{
  id: 6,
  name: 'HP LaserJet',
  description: 'Office Printer',
  ip: '192.168.1.150',
  download: 0.5,
  upload: 0.2,
  limit: 5,
  type: 'printer',
  icon: Printer,           // Utilisez la nouvelle icône
  color: '#f59e0b'         // Couleur orange
}
```

---

### 13. Ajouter des Données Temps Réel (Simulation)

**Fichier:** `src/pages/Dashboard.jsx`

**Ajoutez après les `useState` :**

```javascript
useEffect(() => {
  const interval = setInterval(() => {
    setStats(prevStats => ({
      ...prevStats,
      downloadSpeed: (Math.random() * 20 + 40).toFixed(1),
      uploadSpeed: (Math.random() * 5 + 10).toFixed(1),
    }))
  }, 3000)  // Mise à jour toutes les 3 secondes

  return () => clearInterval(interval)
}, [])
```

---

### 14. Changer les Seuils des Barres de Progression

**Fichier:** `src/pages/ActiveDevices.jsx`

**Trouvez la fonction `getUsageColor` et modifiez :**

```javascript
const getUsageColor = (percentage) => {
  if (percentage >= 90) return 'var(--red)'      // Rouge si > 90%
  if (percentage >= 70) return 'var(--orange)'   // Orange si > 70%
  if (percentage >= 50) return 'var(--cyan)'     // Cyan si > 50%
  return 'var(--green)'                          // Vert sinon
}
```

---

### 15. Ajouter une Animation Personnalisée

**Fichier:** `src/index.css`

**Ajoutez dans la section animations :**

```css
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.bounce-animation {
  animation: bounce 2s infinite;
}
```

**Utilisez-la dans un composant :**
```jsx
<div className="bounce-animation">
  <Download size={24} />
</div>
```

---

### 16. Ajouter un Badge de Status

**Fichier:** N'importe quel fichier de page

```jsx
<div className="status-badge online">
  <span className="status-dot"></span>
  Online
</div>
```

**CSS correspondant (ajoutez dans le fichier .css) :**
```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.online {
  background-color: rgba(16, 185, 129, 0.2);
  color: var(--green);
}

.status-badge .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}
```

---

### 17. Créer un Modal Simple

**Nouveau composant:** `src/components/Modal/Modal.jsx`

```jsx
import React from 'react'
import { X } from 'lucide-react'
import './Modal.css'

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
```

**CSS:** `src/components/Modal/Modal.css`

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
}

.modal-body {
  padding: 20px;
}
```

**Utilisation :**
```jsx
const [isModalOpen, setIsModalOpen] = useState(false)

<Modal 
  isOpen={isModalOpen} 
  onClose={() => setIsModalOpen(false)}
  title="Ajouter un Appareil"
>
  <p>Contenu du modal ici...</p>
</Modal>
```

---

## 🎓 Conseils de Personnalisation

### Pour Modifier des Styles Rapidement

1. Cherchez la classe CSS dans les DevTools du navigateur (F12)
2. Trouvez le fichier CSS correspondant
3. Modifiez les valeurs
4. Le hot-reload Vite met à jour automatiquement !

### Pour Ajouter des Icônes

Visitez : https://lucide.dev/icons
Copiez le nom de l'icône, puis :

```javascript
import { NomDeLIcone } from 'lucide-react'

<NomDeLIcone size={24} />
```

### Pour Debugger

Utilisez les React DevTools et ajoutez des `console.log()` :

```javascript
console.log('Valeur actuelle:', maVariable)
```

---

**💡 Astuce :** Gardez ce fichier ouvert pendant que vous développez !
