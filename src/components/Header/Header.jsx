import React, { useState } from 'react'
import { RefreshCw, Bell, Menu, X } from 'lucide-react'
import './Header.css'

const Header = ({ isGatewayActive, onMenuToggle }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleRefresh = () => {
    window.location.reload()
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
    if (onMenuToggle) {
      onMenuToggle()
    }
  }

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <button className="menu-toggle" onClick={toggleMobileMenu}>
            <Menu size={24} />
          </button>
          
          <div className="page-info">
            <h1 className="page-title">Network Dashboard</h1>
            <p className="page-subtitle">Monitor and control gateway bandwidth allocation</p>
          </div>
        </div>

        <div className="header-actions">
          <div className={`status-indicator ${isGatewayActive ? 'active' : 'inactive'}`}>
            <span className="status-dot"></span>
            <span className="status-text">Gateway {isGatewayActive ? 'Active' : 'Inactive'}</span>
          </div>

          <button className="icon-button" onClick={handleRefresh} title="Refresh">
            <RefreshCw size={20} />
            <span>Refresh</span>
          </button>

          <button className="icon-button notification-button" title="Notifications">
            <Bell size={20} />
            <span className="notification-badge">3</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
