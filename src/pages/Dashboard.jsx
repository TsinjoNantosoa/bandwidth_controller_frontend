import React, { useState, useEffect } from 'react'
import { Download, Upload, Monitor, HardDrive, TrendingUp, TrendingDown, Smartphone, Tv, Tablet, Plus, MoreVertical, Ban, Gauge, Clock } from 'lucide-react'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import './Dashboard.css'

const Dashboard = () => {
  const [stats, setStats] = useState({
    downloadSpeed: 45.2,
    uploadSpeed: 12.8,
    activeDevices: 24,
    devicesWithLimits: 18,
    totalTraffic: 342,
    trafficChange: 24
  })

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

  const getUsagePercentage = (download, limit) => {
    return Math.min((download / limit) * 100, 100)
  }

  const getUsageColor = (percentage) => {
    if (percentage >= 80) return 'var(--red)'
    if (percentage >= 60) return 'var(--orange)'
    return 'var(--green)'
  }

  return (
    <div className="dashboard">
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
              {stats.downloadSpeed} <span className="stat-unit">Mbps</span>
            </div>
            <div className="stat-change positive">
              <TrendingUp size={14} />
              <span>12% from avg</span>
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
              {stats.uploadSpeed} <span className="stat-unit">Mbps</span>
            </div>
            <div className="stat-change negative">
              <TrendingDown size={14} />
              <span>8% from avg</span>
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

        <div className="stat-card green fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="stat-icon">
            <HardDrive size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-header">
              <span className="stat-label">Total Traffic Today</span>
            </div>
            <div className="stat-value">
              {stats.totalTraffic} <span className="stat-unit">GB</span>
            </div>
            <div className="stat-change positive">
              <TrendingUp size={14} />
              <span>{stats.trafficChange}% vs yesterday</span>
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
        <div className="chart-card fade-in" style={{ animationDelay: '0.5s' }}>
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
        </div>
      </div>

      {/* Active Devices and Quick Actions Section */}
      <div className="devices-section">
        <div className="devices-table-container">
          <div className="section-header">
            <h3>Active Devices</h3>
            <button className="add-rule-btn">
              <Plus size={20} />
              Add Rule
            </button>
          </div>

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

export default Dashboard
