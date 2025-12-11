import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Bell, Menu, X, LogOut, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './Header.css'

const Header = ({ isGatewayActive, onMenuToggle }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
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

          <div className="user-menu-container">
            <button 
              className="user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              title={user?.username || 'User'}
            >
              <User size={20} />
              <span className="user-name">{user?.username || 'User'}</span>
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-info">
                  <div className="user-avatar">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="dropdown-username">{user?.username}</div>
                    <div className="dropdown-role">{user?.role || 'user'}</div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout-item" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
