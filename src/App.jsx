import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import ActiveDevices from './pages/ActiveDevices'
import BandwidthRules from './pages/BandwidthRules'
import TrafficHistory from './pages/TrafficHistory'
import FirewallRules from './pages/FirewallRules'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import About from './pages/About'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/devices" element={<ActiveDevices />} />
          <Route path="/bandwidth" element={<BandwidthRules />} />
          <Route path="/history" element={<TrafficHistory />} />
          <Route path="/firewall" element={<FirewallRules />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
