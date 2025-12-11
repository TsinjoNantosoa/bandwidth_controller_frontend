import React, { useState, useEffect } from 'react'
import { Download, Upload, Monitor, HardDrive, TrendingUp, TrendingDown, Smartphone, Tv, Tablet, Plus, MoreVertical, Ban, Gauge, Clock, Wifi, WifiOff } from 'lucide-react'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import useQoSWebSocket from '../hooks/useQoSWebSocket'
import GlobalBandwidthModal from '../components/GlobalBandwidthModal'
import ScheduleRuleModal from '../components/ScheduleRuleModal'
import './Dashboard.css'

const Dashboard = () => {
  // WebSocket pour les stats en temps réel
  const { globalStats, ipStats, connectionStatus, reconnect } = useQoSWebSocket()
  
  const [stats, setStats] = useState({
    downloadSpeed: 0,
    uploadSpeed: 0,
    activeDevices: 0,
    devicesWithLimits: 0,
    totalTraffic: 0,
    trafficChange: 0
  })

  // Mettre à jour les stats depuis le WebSocket
  useEffect(() => {
    if (globalStats) {
      setStats(prev => ({
        ...prev,
        downloadSpeed: globalStats.wanDownloadRate,  // Internet → Client = WAN RX (download utilisateur)
        uploadSpeed: globalStats.lanDownloadRate,     // Client → Internet = LAN RX (upload utilisateur)
        activeDevices: globalStats.totalActiveIPs,
        devicesWithLimits: globalStats.totalLimitedIPs
      }))
    }
  }, [globalStats])

  // Données pour le graphique de bande passante
  const bandwidthData = [
    { time: '00:00', download: 15, upload: 8 },
    { time: '02:00', download: 12, upload: 6 },
    { time: '04:00', download: 10, upload: 5 },
    { time: '06:00', download: 18, upload: 9 },
    { time: '08:00', download: 35, upload: 15 },
    { time: '10:00', download: 42, upload: 18 },
    { time: '12:00', download: 50, upload: 22 },
    { time: '14:00', download: 48, upload: 20 },
    { time: '16:00', download: 45, upload: 19 },
    { time: '18:00', download: 42, upload: 18 },
    { time: '20:00', download: 38, upload: 16 },
    { time: '22:00', download: 32, upload: 14 },
  ]

  // Données pour le diagramme circulaire
  const trafficDistribution = [
    { name: 'Streaming', value: 42, color: '#3b82f6' },
    { name: 'Gaming', value: 18, color: '#a855f7' },
    { name: 'Browsing', value: 15, color: '#06b6d4' },
    { name: 'Downloads', value: 12, color: '#10b981' },
    { name: 'Other', value: 13, color: '#f59e0b' },
  ]

  // Données pour les appareils actifs
  const [devices, setDevices] = useState([
    {
      id: 1,
      name: 'Desktop-PC',
      description: "John's Computer",
      ip: '192.168.1.101',
      download: 8.4,
      upload: 2.1,
      limit: 50,
      type: 'desktop',
      icon: Monitor,
      color: '#3b82f6'
    },
    {
      id: 2,
      name: 'iPhone 14',
      description: "Sarah's Phone",
      ip: '192.168.1.102',
      download: 5.2,
      upload: 1.8,
      limit: 20,
      type: 'mobile',
      icon: Smartphone,
      color: '#a855f7'
    },
    {
      id: 3,
      name: 'Smart TV',
      description: 'Living Room',
      ip: '192.168.1.105',
      download: 15.7,
      upload: 0.5,
      limit: 30,
      type: 'tv',
      icon: Tv,
      color: '#f59e0b'
    },
    {
      id: 4,
      name: 'iPad Pro',
      description: 'Kids Device',
      ip: '192.168.1.108',
      download: 3.1,
      upload: 0.8,
      limit: 10,
      type: 'tablet',
      icon: Tablet,
      color: '#10b981'
    }
  ])

  const [showActions, setShowActions] = useState(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showGlobalBandwidthModal, setShowGlobalBandwidthModal] = useState(false)
  const [showIPLimitModal, setShowIPLimitModal] = useState(false)
  const [selectedIP, setSelectedIP] = useState(null)
  const [speedLimit, setSpeedLimit] = useState('10mbit')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  const getUsagePercentage = (download, limit) => {
    return Math.min((download / limit) * 100, 100)
  }

  const getUsageColor = (percentage) => {
    if (percentage >= 80) return 'var(--red)'
    if (percentage >= 60) return 'var(--orange)'
    return 'var(--green)'
  }

  const handleScheduleSuccess = (message) => {
    setSuccess(message)
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleGlobalBandwidthSuccess = (message) => {
    setSuccess(message)
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleSetIPLimit = (ip) => {
    setSelectedIP(ip)
    setSpeedLimit('10mbit')
    setShowIPLimitModal(true)
    setShowActions(null)
    setError(null)
    setSuccess(null)
  }

  const handleSubmitIPLimit = async (e) => {
    e.preventDefault()
    if (!selectedIP || !speedLimit) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const api = await import('../services/api')
      await api.setIPLimit(selectedIP, speedLimit)
      setSuccess(`Speed limit ${speedLimit} applied to ${selectedIP}`)
      setShowIPLimitModal(false)
    } catch (err) {
      setError(`Failed to set IP limit: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard">
      {/* Connection Status Indicator */}
      <div style={{ 
        position: 'fixed', 
        top: '80px', 
        right: '20px', 
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: '8px',
        background: connectionStatus === 'connected' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${connectionStatus === 'connected' ? 'var(--green)' : 'var(--red)'}`,
        color: connectionStatus === 'connected' ? 'var(--green)' : 'var(--red)',
        fontSize: '12px',
        fontWeight: '500'
      }}>
        {connectionStatus === 'connected' ? (
          <>
            <Wifi size={16} />
            <span>Live</span>
          </>
        ) : (
          <>
            <WifiOff size={16} />
            <span>Disconnected</span>
            <button 
              onClick={reconnect}
              style={{
                background: 'var(--red)',
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              Reconnect
            </button>
          </>
        )}
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card blue fade-in">
          <div className="stat-icon">
            <Download size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-header">
              <span className="stat-label">Download Speed</span>
              <span className="live-badge">Live</span>
            </div>
            <div className="stat-value">
              {stats.downloadSpeed.toFixed(2)} <span className="stat-unit">Mbps</span>
            </div>
            <div className="stat-info" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              WAN RX: {globalStats.wanDownloadRate.toFixed(2)} Mbps
            </div>
          </div>
        </div>

        <div className="stat-card purple fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="stat-icon">
            <Upload size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-header">
              <span className="stat-label">Upload Speed</span>
              <span className="live-badge">Live</span>
            </div>
            <div className="stat-value">
              {stats.uploadSpeed.toFixed(2)} <span className="stat-unit">Mbps</span>
            </div>
            <div className="stat-info" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              LAN RX: {globalStats.lanDownloadRate.toFixed(2)} Mbps
            </div>
          </div>
        </div>

        <div className="stat-card cyan fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="stat-icon">
            <Monitor size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-header">
              <span className="stat-label">Active Devices</span>
            </div>
            <div className="stat-value">
              {stats.activeDevices}
            </div>
            <div className="stat-info">
              {stats.devicesWithLimits} with limits
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Bandwidth Usage Chart */}
        <div className="chart-card fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="chart-header">
            <h3>Bandwidth Usage (24h)</h3>
            <select className="time-selector">
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={bandwidthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis dataKey="time" stroke="#8b92a4" />
                <YAxis stroke="#8b92a4" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e2634', 
                    border: '1px solid #2d3748',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="download" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Download"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="upload" 
                  stroke="#a855f7" 
                  strokeWidth={2}
                  name="Upload"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic Distribution Chart */}
   {/*      <div className="chart-card fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="chart-header">
            <h3>Traffic Distribution</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={trafficDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {trafficDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e2634', 
                    border: '1px solid #2d3748',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="legend-custom">
              {trafficDistribution.map((item, index) => (
                <div key={index} className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                  <span className="legend-label">{item.name}</span>
                  <span className="legend-value">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div> */}
      </div>

      {/* Active Devices and Quick Actions Section */}
      <div className="devices-section">
        <div className="devices-table-container">

          <div className="devices-table-card">
            <table className="devices-table">
              <thead>
                <tr>
                  <th>DEVICE</th>
                  <th>IP ADDRESS</th>
                </tr>
              </thead>
              <tbody>
                {ipStats && ipStats.length > 0 ? (
                  ipStats.map((device, index) => {
                    return (
                      <tr key={device.ip} className="device-row fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                        <td>
                          <div className="device-info">
                            <div className="device-icon" style={{ 
                              backgroundColor: device.is_limited ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)', 
                              color: device.is_limited ? 'var(--orange)' : 'var(--blue)' 
                            }}>
                              <Monitor size={20} />
                            </div>
                            <div className="device-details">
                              <div className="device-name">{device.ip}</div>
                              <div className="device-description">{device.status}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="ip-address">{device.ip}</span>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      {connectionStatus === 'connected' ? 'No active devices detected' : 'Connecting to server...'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="quick-actions-panel">
          <h3>Quick Actions</h3>
  
          <div className="action-card purple" onClick={() => setShowGlobalBandwidthModal(true)} style={{ cursor: 'pointer' }}>
            <div className="action-icon">
              <Gauge size={24} />
            </div>
            <div className="action-content">
              <div className="action-title">Set Global Bandwidth</div>
              <div className="action-description">Configure global limit</div>
            </div>
          </div>

          <div className="action-card cyan" onClick={() => setShowScheduleModal(true)} style={{ cursor: 'pointer' }}>
            <div className="action-icon">
              <Clock size={24} />
            </div>
            <div className="action-content">
              <div className="action-title">Schedule Rule</div>
              <div className="action-description">Time-based restrictions</div>
            </div>
          </div>

          {/* System Status */}
          {/* <div className="system-status">
            <h4>System Status</h4>
            
            <div className="status-item">
              <div className="status-label">CPU Usage</div>
              <div className="status-bar">
                <div className="status-fill" style={{ width: '24%', backgroundColor: '#3b82f6' }} />
              </div>
              <div className="status-value">24%</div>
            </div>

            <div className="status-item">
              <div className="status-label">Memory</div>
              <div className="status-bar">
                <div className="status-fill" style={{ width: '58%', backgroundColor: '#a855f7' }} />
              </div>
              <div className="status-value">58%</div>
            </div>

            <div className="status-item">
              <div className="status-label">Network Load</div>
              <div className="status-bar">
                <div className="status-fill" style={{ width: '72%', backgroundColor: '#06b6d4' }} />
              </div>
              <div className="status-value">72%</div>
            </div>
          </div> */}
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 16px',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid var(--green)',
          borderRadius: '8px',
          color: 'var(--green)',
          zIndex: 1001,
          maxWidth: '400px'
        }}>
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 16px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--red)',
          borderRadius: '8px',
          color: 'var(--red)',
          zIndex: 1001,
          maxWidth: '400px'
        }}>
          {error}
        </div>
      )}

      {/* Device IP Limit Modal */}
      {showIPLimitModal && selectedIP && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowIPLimitModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              padding: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Set IP Speed Limit</h3>
              <button 
                onClick={() => setShowIPLimitModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '24px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ 
              marginBottom: '20px', 
              padding: '12px', 
              backgroundColor: 'var(--bg-secondary)', 
              borderRadius: '8px' 
            }}>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>IP Address</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>{selectedIP}</div>
            </div>

            <form onSubmit={handleSubmitIPLimit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: 'var(--text-secondary)', 
                  fontWeight: '500',
                  fontSize: '14px'
                }}>
                  Rate Limit *
                </label>
                <input
                  type="text"
                  value={speedLimit}
                  onChange={(e) => setSpeedLimit(e.target.value)}
                  placeholder="e.g., 10mbit, 50mbit, 100mbit"
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  This limit applies only to {selectedIP}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={() => setShowIPLimitModal(false)}
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading || !speedLimit}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, var(--blue), var(--purple))',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading || !speedLimit ? 0.6 : 1
                  }}
                >
                  {loading ? 'Applying...' : 'Apply Limit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Bandwidth Modal */}
      <GlobalBandwidthModal 
        isOpen={showGlobalBandwidthModal}
        onClose={() => setShowGlobalBandwidthModal(false)}
        onSuccess={handleGlobalBandwidthSuccess}
      />

      {/* Schedule Rule Modal */}
      <ScheduleRuleModal 
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSuccess={handleScheduleSuccess}
      />
    </div>
  )
}

export default Dashboard
