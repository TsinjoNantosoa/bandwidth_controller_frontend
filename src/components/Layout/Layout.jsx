import React, { useState, useEffect } from 'react'
import Sidebar from '../Sidebar/Sidebar'
import Header from '../Header/Header'
import './Layout.css'

const Layout = ({ children }) => {
  const [isGatewayActive, setIsGatewayActive] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  // Fermer la sidebar lors du changement de page
  useEffect(() => {
    closeSidebar()
  }, [children])

  // Fermer la sidebar si on clique en dehors (mobile)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isSidebarOpen && window.innerWidth <= 1024) {
        const sidebar = document.querySelector('.sidebar')
        const menuToggle = document.querySelector('.menu-toggle')
        
        if (sidebar && !sidebar.contains(e.target) && !menuToggle?.contains(e.target)) {
          closeSidebar()
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSidebarOpen])

  return (
    <div className="layout">
      {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="main-content">
        <Header isGatewayActive={isGatewayActive} onMenuToggle={toggleSidebar} />
        <div className="content-wrapper">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout
