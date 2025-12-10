import React, { useState, useEffect, useRef } from 'react'
import { Monitor, Smartphone, Tv, Tablet, Plus, MoreVertical, Ban, Gauge, Clock, Download, X } from 'lucide-react'
import * as api from '../services/api'
import './ActiveDevices.css'

const ActiveDevices = () => {
  const [devices, setDevices] = useState(new Map())
  const [wsStatus, setWsStatus] = useState('connecting')
  const [showActions, setShowActions] = useState(null)
  const [showSpeedLimitModal, setShowSpeedLimitModal] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [speedLimit, setSpeedLimit] = useState('10mbit')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  // Helper function to map device data
  const getDeviceInfo = (ip) => {
    const lastOctet = parseInt(ip.split('.').pop())
    const icons = [Monitor, Smartphone, Tv, Tablet]
    const colors = ['#3b82f6', '#a855f7', '#f59e0b', '#10b981']
    const types = ['desktop', 'mobile', 'tv', 'tablet']
    const names = ['Desktop-PC', 'Mobile Device', 'Smart TV', 'Tablet']
    
    const index = lastOctet % 4
    return {
      icon: icons[index],
      color: colors[index],
      type: types[index],
      name: names[index],
      description: `Device ${lastOctet}`
    }
  }

  // Update or add device
  const updateDevice = (data) => {
    setDevices(prev => {
      const newDevices = new Map(prev)
      const deviceInfo = getDeviceInfo(data.ip)
      
      newDevices.set(data.ip, {
        id: data.ip,
        ip: data.ip,
        ...deviceInfo,
        download: data.download_rate_mbps || 0,
        upload: data.upload_rate_mbps || 0,
        limit: data.is_limited ? 50 : 100,
        status: data.status || 'Active',
        lastUpdate: Date.now()
      })
      
      return newDevices
    })
  }

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const wsUrl = `ws://${window.location.hostname}:8080/qos/stream`
        console.log('[WS] Connecting to:', wsUrl)
        setWsStatus('connecting')
        
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          console.log('[WS] Connected successfully')
          setWsStatus('connected')
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
          }
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('[WS] Received:', data)
            if (data.ip) {
              updateDevice(data)
            }
          } catch (err) {
            console.error('[WS] Parse error:', err)
          }
        }

        ws.onerror = (error) => {
          console.error('[WS] Error:', error)
          setWsStatus('disconnected')
        }

        ws.onclose = () => {
          console.log('[WS] Connection closed, reconnecting in 5s...')
          setWsStatus('disconnected')
          wsRef.current = null
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000)
        }
      } catch (err) {
        console.error('[WS] Connection failed:', err)
        setWsStatus('disconnected')
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000)
      }
    }

    connectWebSocket()

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  // Cleanup stale devices (older than 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setDevices(prev => {
        const newDevices = new Map(prev)
        for (const [ip, device] of newDevices) {
          if (now - device.lastUpdate > 30000) {
            newDevices.delete(ip)
          }
        }
        return newDevices
      })
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const getUsagePercentage = (download, limit) => {
    return Math.min((download / limit) * 100, 100)
  }

  const getUsageColor = (percentage) => {
    if (percentage >= 80) return 'var(--red)'
    if (percentage >= 60) return 'var(--orange)'
    return 'var(--green)'
  }

  const handleSetSpeedLimit = (device) => {
    setSelectedDevice(device)
    setSpeedLimit('10mbit')
    setShowSpeedLimitModal(true)
    setShowActions(null)
    setError(null)
    setSuccess(null)
  }

  const handleSubmitSpeedLimit = async (e) => {
    e.preventDefault()
    if (!selectedDevice || !speedLimit) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await api.setIPLimit(selectedDevice.ip, speedLimit)
      setSuccess(`Speed limit ${speedLimit} applied to ${selectedDevice.ip}`)
      console.log('IP Limit result:', result)
      setShowSpeedLimitModal(false)
      // Update device limit in UI
      setDevices(prev => {
        const newDevices = new Map(prev)
        const device = newDevices.get(selectedDevice.ip)
        if (device) {
          device.limit = parseInt(speedLimit) || device.limit
          newDevices.set(selectedDevice.ip, device)
        }
        return newDevices
      })
    } catch (err) {
      setError(`Failed to set speed limit: ${err.message}`)
      console.error('IP Limit error:', err)
    } finally {
      setLoading(false)
    }
  }

  const devicesArray = Array.from(devices.values())

  return (
    <div className="active-devices-page">
      <div className="page-header">
        <div>
          <h2>Active Devices</h2>
          <p>Real-time bandwidth monitoring via WebSocket • Status: <span style={{ 
            color: wsStatus === 'connected' ? 'var(--green)' : wsStatus === 'connecting' ? 'var(--orange)' : 'var(--red)',
            fontWeight: 'bold'
          }}>
            {wsStatus === 'connected' ? '● Connected' : wsStatus === 'connecting' ? '● Connecting...' : '● Disconnected'}
          </span></p>
        </div>
        <button className="add-rule-btn">
          <Plus size={20} />
          Add Rule
        </button>
      </div>

      <div className="devices-container">
        <div className="devices-table-card">
          <table className="devices-table">
            <thead>
              <tr>
                <th>DEVICE</th>
                <th>IP ADDRESS</th>
                <th>DOWNLOAD</th>
                <th>UPLOAD</th>
                <th>LIMIT</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {devicesArray.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    {wsStatus === 'connected' ? 'Waiting for device data...' : 'Connecting to WebSocket...'}
                  </td>
                </tr>
              ) : (
                devicesArray.map((device) => {
                  const DeviceIcon = device.icon
                  const usagePercentage = getUsagePercentage(device.download, device.limit)
                
                return (
                  <tr key={device.id} className="device-row fade-in">
                    <td>
                      <div className="device-info">
                        <div className="device-icon" style={{ backgroundColor: `${device.color}20`, color: device.color }}>
                          <DeviceIcon size={20} />
                        </div>
                        <div className="device-details">
                          <div className="device-name">{device.name}</div>
                          <div className="device-description">{device.description}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="ip-address">{device.ip}</span>
                    </td>
                    <td>
                      <span className="bandwidth-value">{device.download.toFixed(4)} Mbps</span>
                    </td>
                    <td>
                      <span className="bandwidth-value">{device.upload.toFixed(4)} Mbps</span>
                    </td>
                    <td>
                      <div className="limit-info">
                        <div className="limit-badge" style={{ 
                          backgroundColor: `${getUsageColor(usagePercentage)}20`,
                          color: getUsageColor(usagePercentage)
                        }}>
                          {device.limit} Mbps
                        </div>
                        <div className="usage-bar">
                          <div 
                            className="usage-fill" 
                            style={{ 
                              width: `${usagePercentage}%`,
                              backgroundColor: getUsageColor(usagePercentage)
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="action-menu">
                        <button 
                          className="action-button"
                          onClick={() => setShowActions(showActions === device.id ? null : device.id)}
                        >
                          <MoreVertical size={18} />
                        </button>
                        {showActions === device.id && (
                          <div className="action-dropdown">
                            <button className="action-item" onClick={() => handleSetSpeedLimit(device)}>
                              <Gauge size={16} />
                              Set Speed Limit
                            </button>
                            <button className="action-item danger">
                              <Ban size={16} />
                              Block Device
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
              )}
            </tbody>
          </table>
        </div>

        {/* Quick Actions Panel */}
        <div className="quick-actions-panel">
          <h3>Quick Actions</h3>
          
          <div className="action-card blue">
            <div className="action-icon">
              <Ban size={24} />
            </div>
            <div className="action-content">
              <div className="action-title">Block Device</div>
              <div className="action-description">Restrict network access</div>
            </div>
          </div>

          <div className="action-card purple">
            <div className="action-icon">
              <Gauge size={24} />
            </div>
            <div className="action-content">
              <div className="action-title">Set Speed Limit</div>
              <div className="action-description">Configure bandwidth cap</div>
            </div>
          </div>

          <div className="action-card cyan">
            <div className="action-icon">
              <Clock size={24} />
            </div>
            <div className="action-content">
              <div className="action-title">Schedule Rule</div>
              <div className="action-description">Time-based restrictions</div>
            </div>
          </div>

          <div className="action-card green">
            <div className="action-icon">
              <Download size={24} />
            </div>
            <div className="action-content">
              <div className="action-title">Export Logs</div>
              <div className="action-description">Download traffic data</div>
            </div>
          </div>

          {/* System Status */}
          <div className="system-status">
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
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
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

      {/* Set Speed Limit Modal */}
      {showSpeedLimitModal && selectedDevice && (
        <div className="modal-overlay" onClick={() => setShowSpeedLimitModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Set Speed Limit</h3>
              <button className="close-btn" onClick={() => setShowSpeedLimitModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="device-icon" style={{ 
                    backgroundColor: `${selectedDevice.color}20`, 
                    color: selectedDevice.color,
                    padding: '12px',
                    borderRadius: '8px'
                  }}>
                    {React.createElement(selectedDevice.icon, { size: 24 })}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{selectedDevice.name}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>IP: {selectedDevice.ip}</div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmitSpeedLimit}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                    Rate Limit *
                  </label>
                  <input
                    type="text"
                    value={speedLimit}
                    onChange={(e) => setSpeedLimit(e.target.value)}
                    placeholder="e.g., 10mbit, 50mbit, 1gbit"
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
                    Examples: 10mbit, 50mbit, 100mbit, 1gbit
                  </div>
                </div>

                <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button 
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowSpeedLimitModal(false)}
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
                    className="add-rule-btn"
                    disabled={loading || !speedLimit}
                    style={{
                      padding: '10px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Gauge size={18} />
                    {loading ? 'Applying...' : 'Apply Limit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          padding: 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          margin: 0;
          color: var(--text-primary);
          font-size: 18px;
          font-weight: 600;
        }

        .close-btn {
          padding: 8px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .modal-body {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  )
}

export default ActiveDevices
