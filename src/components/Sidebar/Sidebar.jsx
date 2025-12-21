import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Monitor, 
  Gauge,
  Calendar,
  History, 
  Shield, 
  Bell, 
  Settings, 
  Info,
  Wifi
} from 'lucide-react'
import './Sidebar.css'

const Sidebar = ({ isOpen, onClose }) => {
  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', section: 'main' },
    { path: '/devices', icon: Monitor, label: 'Active Devices', section: 'main' },
    { path: '/bandwidth', icon: Gauge, label: 'Bandwidth Rules', section: 'main' },
    { path: '/scheduler', icon: Calendar, label: 'Scheduler', section: 'main' },
    { path: '/history', icon: History, label: 'Traffic History', section: 'main' },
    /* { path: '/firewall', icon: Shield, label: 'Firewall Rules', section: 'main' }, */
/*     { path: '/notifications', icon: Bell, label: 'Notifications', section: 'main' }, */
/*     { path: '/settings', icon: Settings, label: 'Settings', section: 'system' },
    { path: '/about', icon: Info, label: 'About', section: 'system' }, */
  ]

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">
            <Wifi size={28} />
          </div>
          <div className="logo-text">
            <h1>BandwidthCtrl</h1>
            <span>Gateway Manager</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {menuItems.filter(item => item.section === 'main').map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              end={item.path === '/'}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="nav-section">
          {/* <div className="nav-section-title">SYSTEM</div> */}
          {menuItems.filter(item => item.section === 'system').map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

    </aside>
  )
}

export default Sidebar
