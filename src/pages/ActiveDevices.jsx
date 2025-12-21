import React, { useState, useEffect, useRef } from 'react'
import { Monitor, Smartphone, Tv, Tablet, Plus, MoreVertical, Ban, Gauge, Clock, Download, RefreshCw } from 'lucide-react'
import * as api from '../services/api'
import { startIPSync } from '../services/ipSync'
import ScheduleRuleModal from '../components/ScheduleRuleModal'
import GlobalBandwidthModal from '../components/GlobalBandwidthModal'
import './ActiveDevices.css'

// Device type detection based on MAC OUI and hostname patterns
const detectDeviceType = (macAddress, hostname) => {
  // Common MAC OUI prefixes (first 6 characters)
  const macOUIs = {
    // Apple devices
    'F8:FF:C2': 'mobile', 'D8:9E:3F': 'mobile', '00:3E:E1': 'mobile', // Apple
    'AC:DE:48': 'mobile', '00:CD:FE': 'mobile', '8C:85:90': 'mobile',
    
    // Samsung devices
    'E8:50:8B': 'tv', 'EC:F4:BB': 'tv', '40:0E:85': 'mobile', // Samsung
    'D8:57:EF': 'mobile', 'C4:62:EA': 'mobile',
    
    // LG TVs
    'B8:5A:F7': 'tv', 'A8:23:FE': 'tv', 'E8:5B:5B': 'tv',
    
    // Google devices
    'F4:F5:D8': 'tv', '54:60:09': 'tv', 'DA:A1:19': 'tv', // Chromecast/TV
    
    // Xiaomi
    '34:CE:00': 'mobile', '64:09:80': 'mobile', '78:02:F8': 'mobile',
    
    // Sony
    '00:23:45': 'tv', 'FC:F1:52': 'tv',
    
    // Dell/HP/Lenovo (common desktop/laptop manufacturers)
    'D4:BE:D9': 'desktop', '00:14:22': 'desktop', 'F4:8E:38': 'desktop', // Dell
    '3C:52:82': 'desktop', 'A4:5D:36': 'desktop', // HP
    '00:21:CC': 'desktop', 'B8:CA:3A': 'desktop', // Lenovo
  }
  
  // Hostname pattern detection
  const hostnamePatterns = [
    { pattern: /iphone|ipad|ipod/i, type: 'mobile' },
    { pattern: /android|samsung|xiaomi|huawei|oppo|vivo/i, type: 'mobile' },
    { pattern: /tv|chromecast|roku|firestick|appletv/i, type: 'tv' },
    { pattern: /tablet|ipad/i, type: 'tablet' },
    { pattern: /laptop|notebook|macbook/i, type: 'desktop' },
    { pattern: /desktop|pc|workstation/i, type: 'desktop' },
  ]

  // Check MAC OUI first (most reliable)
  if (macAddress) {
    const ouiPrefix = macAddress.substring(0, 8).toUpperCase()
    if (macOUIs[ouiPrefix]) {
      return macOUIs[ouiPrefix]
    }
  }

  // Check hostname patterns
  if (hostname) {
    for (const { pattern, type } of hostnamePatterns) {
      if (pattern.test(hostname)) {
        return type
      }
    }
  }

  // Default fallback based on IP last octet (legacy behavior)
  return null
}

const ActiveDevices = () => {
  const [devices, setDevices] = useState(new Map())
  const [blockedDevices, setBlockedDevices] = useState(new Set())
  const [syncState, setSyncState] = useState({
    isConnected: false,
    initialSyncComplete: false,
    sequence: 0,
    error: null,
  })
  const [showActions, setShowActions] = useState(null)
  const [showGlobalBandwidthModal, setShowGlobalBandwidthModal] = useState(false)
  const [showIPLimitModal, setShowIPLimitModal] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [speedLimit, setSpeedLimit] = useState('10mbit')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const syncControlRef = useRef(null)

  // Helper function to map device data
  const getDeviceInfo = (ip, macAddress, hostname) => {
    // Detect device type using MAC and hostname
    const detectedType = detectDeviceType(macAddress, hostname)
    
    // Map device types to icons and colors
    const deviceTypeMap = {
      'desktop': { icon: Monitor, color: '#3b82f6', name: 'Desktop/Laptop' },
      'mobile': { icon: Smartphone, color: '#a855f7', name: 'Mobile Device' },
      'tv': { icon: Tv, color: '#f59e0b', name: 'Smart TV' },
      'tablet': { icon: Tablet, color: '#10b981', name: 'Tablet' },
    }
    
    // Use detected type or fallback to IP-based assignment
    let deviceConfig
    if (detectedType && deviceTypeMap[detectedType]) {
      deviceConfig = deviceTypeMap[detectedType]
    } else {
      // Fallback: use last octet for variety
      const lastOctet = parseInt(ip.split('.').pop())
      const types = ['desktop', 'mobile', 'tv', 'tablet']
      const fallbackType = types[lastOctet % 4]
      deviceConfig = deviceTypeMap[fallbackType]
    }
    
    return {
      icon: deviceConfig.icon,
      color: deviceConfig.color,
      type: detectedType || 'unknown',
      deviceTypeName: deviceConfig.name, // Friendly device type name
      displayName: hostname && hostname !== 'Unknown' ? hostname : deviceConfig.name, // What to show
      description: `Device ${ip.split('.').pop()}`,
      macAddress: macAddress || 'Unknown',
      hostname: hostname || ''
    }
  }

  // IP Sync with IndexedDB persistence
  useEffect(() => {
    console.log('[ActiveDevices] Starting IP sync with IndexedDB')
    
    const handleSyncUpdate = (state) => {
      console.log('[ActiveDevices] Sync update:', {
        ipCount: state.ips.length,
        sequence: state.sequence,
        initialSyncComplete: state.initialSyncComplete,
        isConnected: state.isConnected,
      })

      // Update sync state
      setSyncState({
        isConnected: state.isConnected,
        initialSyncComplete: state.initialSyncComplete,
        sequence: state.sequence,
        error: state.error,
      })

      // Only update devices that actually changed (optimization)
      setDevices(prev => {
        const newDevices = new Map(prev)
        let hasChanges = false

        state.ips.forEach(ipStat => {
          const ip = ipStat.ip || ipStat.IP
          if (!ip) return

          // Extract MAC and hostname from backend
          const macAddress = ipStat.mac_address || ipStat.MACAddress || ''
          const hostname = ipStat.hostname || ipStat.Hostname || ''
          
          const deviceInfo = getDeviceInfo(ip, macAddress, hostname)
          
          // Parse bandwidth limit
          let limitValue = null
          const bandwidthLimit = ipStat.bandwidth_limit || ipStat.BandwidthLimit
          if (bandwidthLimit && bandwidthLimit.trim() !== '') {
            const match = bandwidthLimit.match(/([0-9.]+)/)
            if (match) {
              limitValue = parseFloat(match[1])
            }
          }

          const newDevice = {
            id: ip,
            ip: ip,
            ...deviceInfo,
            download: ipStat.download_rate_mbps || ipStat.DownloadRate || 0,
            upload: ipStat.upload_rate_mbps || ipStat.UploadRate || 0,
            limit: limitValue,
            status: ipStat.status || ipStat.Status || 'Active',
            lastUpdate: Date.now(),
          }

          const existing = newDevices.get(ip)
          
          // Only update if device is new or data changed
          if (!existing || 
              existing.download !== newDevice.download ||
              existing.upload !== newDevice.upload ||
              existing.limit !== newDevice.limit ||
              existing.status !== newDevice.status ||
              existing.macAddress !== newDevice.macAddress ||
              existing.hostname !== newDevice.hostname) {
            newDevices.set(ip, newDevice)
            hasChanges = true
          }
        })

        // Remove stale devices (not in current state.ips)
        const currentIPs = new Set(state.ips.map(s => s.ip || s.IP).filter(Boolean))
        for (const ip of newDevices.keys()) {
          if (!currentIPs.has(ip)) {
            newDevices.delete(ip)
            hasChanges = true
          }
        }

        return hasChanges ? newDevices : prev
      })
    }

    // Start sync
    const syncControl = startIPSync(handleSyncUpdate)
    syncControlRef.current = syncControl

    // Cleanup on unmount
    return () => {
      if (syncControlRef.current) {
        syncControlRef.current.close()
        syncControlRef.current = null
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

  const handleResetToGlobal = async (device) => {
    if (!device) return
    
    setLoading(true)
    setError(null)
    setSuccess(null)
    setShowActions(null)

    try {
      await api.removeIPLimit(device.ip)
      setSuccess(`${device.ip} reset to global limit successfully`)
      
      // Update device in UI to show it's under global limit (limit = null)
      setDevices(prev => {
        const newDevices = new Map(prev)
        const dev = newDevices.get(device.ip)
        if (dev) {
          dev.limit = null // null = sous limite globale
          newDevices.set(device.ip, dev)
        }
        return newDevices
      })
    } catch (err) {
      setError(`Failed to reset to global: ${err.message}`)
      console.error('Reset to global error:', err)
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

  // Determine connection status for display
  const connectionStatus = syncState.error ? 'error' 
    : !syncState.initialSyncComplete ? 'syncing'
    : syncState.isConnected ? 'connected'
    : 'disconnected'

  const statusText = syncState.error ? `● Error: ${syncState.error}`
    : !syncState.initialSyncComplete ? '● Syncing...'
    : syncState.isConnected ? '● Connected'
    : '● Disconnected'

  const statusColor = connectionStatus === 'connected' ? 'var(--green)'
    : connectionStatus === 'syncing' ? 'var(--orange)'
    : connectionStatus === 'error' ? 'var(--red)'
    : 'var(--text-secondary)'

  return (
    <div className="active-devices-page">
      <div className="page-header">
        <div>
          <h2>Active Devices</h2>
          <p>
            Real-time bandwidth monitoring • Status: <span style={{ 
              color: statusColor,
              fontWeight: 'bold'
            }}>
              {statusText}
            </span>
            {!syncState.initialSyncComplete && (
              <span style={{ marginLeft: '8px', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                (Loading cached data...)
              </span>
            )}
            {syncState.sequence > 0 && (
              <span style={{ marginLeft: '8px', fontSize: '0.85em', color: 'var(--text-secondary)' }}>
                • Seq: {syncState.sequence}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="devices-container">
        <div className="devices-table-card">
          <table className="devices-table">
            <thead>
              <tr>
                <th>DEVICE</th>
                <th>TYPE</th>
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
                    {!syncState.initialSyncComplete ? (
                      <div>
                        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                        <div>Loading cached devices and syncing with server...</div>
                      </div>
                    ) : (
                      'No active devices detected'
                    )}
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
                          <div className="device-name">{device.displayName}</div>
                          <div className="device-description" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span>{device.ip}</span>
                            {device.macAddress && device.macAddress !== 'Unknown' && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                • {device.macAddress}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="device-type-badge" style={{ 
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: `${device.color}15`,
                        color: device.color
                      }}>
                        {device.deviceTypeName}
                      </span>
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
                            {device.limit !== null && (
                              <button 
                                className="action-item" 
                                onClick={() => handleResetToGlobal(device)}
                              >
                                <Download size={16} style={{ transform: 'rotate(180deg)' }} />
                                Reset to Global
                              </button>
                            )}
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
                          <div className="device-name-small">{device.displayName}</div>
                          <div className="device-ip-small" style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.7rem' }}>
                            <span>{device.ip}</span>
                            {device.macAddress && device.macAddress !== 'Unknown' && (
                              <span style={{ color: 'var(--text-secondary)' }}>• {device.macAddress}</span>
                            )}
                          </div>
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
