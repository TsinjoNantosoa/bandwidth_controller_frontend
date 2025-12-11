import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ActiveDevices from './pages/ActiveDevices'
import BandwidthRules from './pages/BandwidthRules'
import BandwidthScheduler from './pages/BandwidthScheduler'
import TrafficHistory from './pages/TrafficHistory'
import FirewallRules from './pages/FirewallRules'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import About from './pages/About'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/devices" element={<ActiveDevices />} />
                  <Route path="/bandwidth" element={<BandwidthRules />} />
                  <Route path="/scheduler" element={<BandwidthScheduler />} />
                  <Route path="/history" element={<TrafficHistory />} />
                  <Route path="/firewall" element={<FirewallRules />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/about" element={<About />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
