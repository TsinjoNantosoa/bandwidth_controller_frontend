import React, { useState } from 'react'
import { Monitor, Smartphone, Tv, Tablet, Plus, MoreVertical, Ban, Gauge, Clock, Download } from 'lucide-react'
import './ActiveDevices.css'

const ActiveDevices = () => {
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

  const getUsagePercentage = (download, limit) => {
    return Math.min((download / limit) * 100, 100)
  }

  const getUsageColor = (percentage) => {
    if (percentage >= 80) return 'var(--red)'
    if (percentage >= 60) return 'var(--orange)'
    return 'var(--green)'
  }

  return (
    <div className="active-devices-page">
      <div className="page-header">
        <div>
          <h2>Active Devices</h2>
          <p>Manage connected devices and their bandwidth allocation</p>
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
              {devices.map((device) => {
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
                      <span className="bandwidth-value">{device.download} Mbps</span>
                    </td>
                    <td>
                      <span className="bandwidth-value">{device.upload} Mbps</span>
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
                            <button className="action-item">
                              <Gauge size={16} />
                              Set Speed Limit
                            </button>
                            <button className="action-item">
                              <Clock size={16} />
                              Schedule Rule
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
              })}
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
    </div>
  )
}

export default ActiveDevices
