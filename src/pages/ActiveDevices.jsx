import React, { useState, useEffect, useRef } from 'react'
import { Monitor, Smartphone, Tv, Tablet, Plus, MoreVertical, Ban, Gauge, Clock, Download } from 'lucide-react'
import * as api from '../services/api'
import ScheduleRuleModal from '../components/ScheduleRuleModal'
import GlobalBandwidthModal from '../components/GlobalBandwidthModal'
import './ActiveDevices.css'

const ActiveDevices = () => {
  const [devices, setDevices] = useState(new Map())
  const [blockedDevices, setBlockedDevices] = useState(new Set())
  const [wsStatus, setWsStatus] = useState('connecting')
  const [showActions, setShowActions] = useState(null)
  const [showGlobalBandwidthModal, setShowGlobalBandwidthModal] = useState(false)
  const [showIPLimitModal, setShowIPLimitModal] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [speedLimit, setSpeedLimit] = useState('10mbit')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const devicesRef = useRef(new Map()) // Ref pour éviter les problèmes de closure

  // Sync devices state with ref
  useEffect(() => {
    devicesRef.current = devices
  }, [devices])

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

  // WebSocket connection - utilise useCallback pour éviter les recreations
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
            
            // Le backend envoie { type: "ip", ip_stat: {...} } ou { type: "global", global_stat: {...} }
            if (data.type === 'ip' && data.ip_stat) {
              // Utilise setDevices avec callback pour éviter problèmes de closure
              setDevices(prev => {
                const newDevices = new Map(prev)
                const deviceInfo = getDeviceInfo(data.ip_stat.ip)
                
                // Parse bandwidth_limit: si vide/null = sous limite globale uniquement
                let limitValue = null
                if (data.ip_stat.bandwidth_limit && data.ip_stat.bandwidth_limit.trim() !== '') {
                  // Limite explicite définie - extraire le nombre
                  const match = data.ip_stat.bandwidth_limit.match(/([0-9.]+)/)
                  if (match) {
                    limitValue = parseFloat(match[1])
                  }
                }
                
                newDevices.set(data.ip_stat.ip, {
                  id: data.ip_stat.ip,
                  ip: data.ip_stat.ip,
                  ...deviceInfo,
                  download: data.ip_stat.download_rate_mbps || 0,
                  upload: data.ip_stat.upload_rate_mbps || 0,
                  limit: limitValue, // null = global, number = limite explicite
                  status: data.ip_stat.status || 'Active',
                  lastUpdate: Date.now()
                })
                
                return newDevices
              })
            } else if (data.ip) {
              // Fallback pour l'ancien format
              setDevices(prev => {
                const newDevices = new Map(prev)
                const deviceInfo = getDeviceInfo(data.ip)
                
                let limitValue = null
                if (data.bandwidth_limit && data.bandwidth_limit.trim() !== '') {
                  const match = data.bandwidth_limit.match(/([0-9.]+)/)
                  if (match) {
                    limitValue = parseFloat(match[1])
                  }
                }
                
                newDevices.set(data.ip, {
                  id: data.ip,
                  ip: data.ip,
                  ...deviceInfo,
                  download: data.download_rate_mbps || 0,
                  upload: data.upload_rate_mbps || 0,
                  limit: limitValue,
                  status: data.status || 'Active',
                  lastUpdate: Date.now()
                })
                
                return newDevices
              })
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
  }, []) // Pas de dépendances - ne se reconnecte qu'au mount

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
    if (!limit || limit === 0) return 0 // Pas de limite explicite ou limit=0
    return Math.min((download / limit) * 100, 100)
  }

  const getUsageColor = (percentage) => {
    if (percentage >= 80) return 'var(--red)'
    if (percentage >= 60) return 'var(--orange)'
    return 'var(--green)'
  }

  const handleSetGlobalBandwidth = () => {
    setShowGlobalBandwidthModal(true)
    setShowActions(null)
    setError(null)
    setSuccess(null)
  }

  const handleGlobalBandwidthSuccess = (message) => {
    setSuccess(message)
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleSetIPLimit = (device) => {
    setSelectedDevice(device)
    setSpeedLimit('10mbit')
    setShowIPLimitModal(true)
    setShowActions(null)
    setError(null)
    setSuccess(null)
  }

  const handleSubmitIPLimit = async (e) => {
    e.preventDefault()
    if (!selectedDevice || !speedLimit) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await api.setIPLimit(selectedDevice.ip, speedLimit)
      setSuccess(`Speed limit ${speedLimit} applied to ${selectedDevice.ip}`)
      setShowIPLimitModal(false)
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
      setError(`Failed to set IP limit: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleSuccess = (message) => {
    setSuccess(message)
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleBlockDevice = async (device) => {
    if (!device) return
    
    setLoading(true)
    setError(null)
    setSuccess(null)
    setShowActions(null)

    try {
      await api.blockDevice(device.ip)
      setSuccess(`Device ${device.ip} blocked successfully`)
      setBlockedDevices(prev => new Set([...prev, device.ip]))
      
      // Update device status in UI
      setDevices(prev => {
        const newDevices = new Map(prev)
        const dev = newDevices.get(device.ip)
        if (dev) {
          dev.blocked = true
          newDevices.set(device.ip, dev)
        }
        return newDevices
      })
    } catch (err) {
      setError(`Failed to block device: ${err.message}`)
      console.error('Block device error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUnblockDevice = async (device) => {
    if (!device) return
    
    setLoading(true)
    setError(null)
    setSuccess(null)
    setShowActions(null)

    try {
      await api.unblockDevice(device.ip)
      setSuccess(`Device ${device.ip} unblocked successfully`)
      setBlockedDevices(prev => {
        const newSet = new Set(prev)
        newSet.delete(device.ip)
        return newSet
      })
      
      // Update device status in UI
      setDevices(prev => {
        const newDevices = new Map(prev)
        const dev = newDevices.get(device.ip)
        if (dev) {
          dev.blocked = false
          newDevices.set(device.ip, dev)
        }
        return newDevices
      })
    } catch (err) {
      setError(`Failed to unblock device: ${err.message}`)
      console.error('Unblock device error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Check blocked status for all devices on mount
  useEffect(() => {
    const checkBlockedDevices = async () => {
      const ips = Array.from(devices.keys())
      const blocked = new Set()
      
      for (const ip of ips) {
        try {
          const status = await api.getDeviceStatus(ip)
          if (status.blocked) {
            blocked.add(ip)
          }
        } catch (err) {
          console.error(`Failed to check status for ${ip}:`, err)
        }
      }
      
      setBlockedDevices(blocked)
    }

    if (devices.size > 0) {
      checkBlockedDevices()
    }
  }, [devices.size])

  const devicesArray = Array.from(devices.values())
  const blockedDevicesArray = devicesArray.filter(d => blockedDevices.has(d.ip))

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
                devicesArray.map((device, index) => {
                  const DeviceIcon = device.icon
                  const usagePercentage = getUsagePercentage(device.download, device.limit)
                  const isLastTwo = index >= devicesArray.length - 2
                
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
                        {device.limit === null ? (
                          <div className="limit-badge" style={{ 
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)'
                          }}>
                            Global
                          </div>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="action-menu">
                        <button 
                          className={`action-button ${blockedDevices.has(device.ip) ? 'blocked' : ''}`}
                          onClick={() => setShowActions(showActions === device.id ? null : device.id)}
                        >
                          <MoreVertical size={18} />
                        </button>
                        {showActions === device.id && (
                          <div className={`action-dropdown ${isLastTwo ? 'dropdown-up' : ''}`}>
                            <button className="action-item" onClick={() => handleSetIPLimit(device)}>
                              <Gauge size={16} />
                              Set IP Speed Limit
                            </button>
                            {blockedDevices.has(device.ip) ? (
                              <button 
                                className="action-item success" 
                                onClick={() => handleUnblockDevice(device)}
                              >
                                <Ban size={16} />
                                Unblock Device
                              </button>
                            ) : (
                              <button 
                                className="action-item danger" 
                                onClick={() => handleBlockDevice(device)}
                              >
                                <Ban size={16} />
                                Block Device
                              </button>
                            )}
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
          

          <div className="action-card purple" onClick={handleSetGlobalBandwidth} style={{ cursor: 'pointer' }}>
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

          {/* Blocked Devices Section */}
          {blockedDevicesArray.length > 0 && (
            <div className="blocked-devices-section">
              <h4 style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                color: 'var(--red)',
                marginBottom: '12px',
                fontSize: '14px'
              }}>
                <Ban size={18} />
                Blocked Devices ({blockedDevicesArray.length})
              </h4>
              <div className="blocked-devices-list">
                {blockedDevicesArray.map((device) => {
                  const DeviceIcon = device.icon
                  return (
                    <div key={device.ip} className="blocked-device-item">
                      <div className="device-info-compact">
                        <div className="device-icon-small" style={{ 
                          backgroundColor: `${device.color}20`, 
                          color: device.color 
                        }}>
                          <DeviceIcon size={16} />
                        </div>
                        <div>
                          <div className="device-name-small">{device.name}</div>
                          <div className="device-ip-small">{device.ip}</div>
                        </div>
                      </div>
                      <button 
                        className="unblock-btn"
                        onClick={() => handleUnblockDevice(device)}
                        disabled={loading}
                      >
                        Unblock
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

      {/*     <div className="action-card green">
            <div className="action-icon">
              <Download size={24} />
            </div>
            <div className="action-content">
              <div className="action-title">Export Logs</div>
              <div className="action-description">Download traffic data</div>
            </div>
          </div> */}

          {/* System Status */}
         {/*  <div className="system-status">
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
          right: '40vw',
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

      {/* Device IP Limit Modal */}
      {showIPLimitModal && selectedDevice && (
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
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease'
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
              maxHeight: '90vh',
              overflow: 'hidden',
              animation: 'slideUp 0.3s ease'
            }}
          >
            <div 
              className="modal-header"
              style={{
                padding: '20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' }}>
                Set IP Speed Limit
              </h3>
              <button 
                className="close-btn"
                onClick={() => setShowIPLimitModal(false)}
                style={{
                  padding: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ 
                marginBottom: '20px', 
                padding: '12px', 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: '8px' 
              }}>
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
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      {selectedDevice.name}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      IP: {selectedDevice.ip}
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmitIPLimit}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
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
                    This limit applies only to {selectedDevice.ip}
                  </div>
                </div>

                <div 
                  className="modal-footer" 
                  style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    justifyContent: 'flex-end',
                    marginTop: '20px'
                  }}
                >
                  <button 
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowIPLimitModal(false)}
                    disabled={loading}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '14px'
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
                      gap: '8px',
                      background: 'linear-gradient(135deg, var(--blue), var(--purple))',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: loading || !speedLimit ? 0.6 : 1
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

export default ActiveDevices
