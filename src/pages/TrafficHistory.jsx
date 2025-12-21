import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { BarChart, Bar } from 'recharts'
import { format } from 'date-fns'
import { Clock, TrendingUp, Download, Upload, Users, Activity } from 'lucide-react'
import { getGlobalTrafficHistory, getIPTrafficHistory, getTopConsumers, getTimeRange, getAppropriateInterval } from '../services/trafficHistory'
import './TrafficHistory.css'

const TrafficHistory = () => {
  const [timeRange, setTimeRange] = useState('24h')
  const [globalData, setGlobalData] = useState([])
  const [topConsumers, setTopConsumers] = useState([])
  const [ipTrafficData, setIpTrafficData] = useState({}) // Store traffic history per IP
  const [ipLimits, setIpLimits] = useState({}) // Store rate limits per IP
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [globalLimit, setGlobalLimit] = useState(100) // Default 100 Mbps
  const [customRange, setCustomRange] = useState({
    start: '',
    end: ''
  })
  const [showCustomRange, setShowCustomRange] = useState(false)

  // Get appropriate time format based on time range
  const getTimeFormat = (range) => {
    switch (range) {
      case '1h': return 'HH:mm'           // Just time for 1 hour
      case '6h': return 'HH:mm'           // Just time for 6 hours
      case '24h': return 'MMM dd HH:mm'   // Date + time for 24 hours
      case '7d': return 'MMM dd HH:mm'    // Date + time for 7 days
      case '30d': return 'MMM dd'          // Just date for 30 days
      default: return 'MMM dd HH:mm'
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange])

  // Listen to WebSocket for current global limit
  useEffect(() => {
    let ws
    
    const connectWebSocket = () => {
      ws = new WebSocket('ws://localhost:8080/qos/stream')
      
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          
          // Check for global traffic stats
          if (msg.type === 'global' && msg.global_stat) {
            const globalStat = msg.global_stat
            if (globalStat.global_limit) {
              // Parse limit string (e.g., "100mbit" -> 100)
              const match = globalStat.global_limit.match(/(\d+(?:\.\d+)?)/)
              if (match) {
                setGlobalLimit(parseFloat(match[1]))
              }
            }
          }
          
          // Check for snapshot with IP limits
          if (msg.type === 'snapshot' && msg.ips) {
            const limits = {}
            msg.ips.forEach(ipData => {
              if (ipData.upload_limit || ipData.download_limit) {
                // Parse limit strings and take the maximum of upload/download
                const uploadMatch = ipData.upload_limit?.match(/(\d+(?:\.\d+)?)/)
                const downloadMatch = ipData.download_limit?.match(/(\d+(?:\.\d+)?)/)
                const uploadLimit = uploadMatch ? parseFloat(uploadMatch[1]) : 0
                const downloadLimit = downloadMatch ? parseFloat(downloadMatch[1]) : 0
                limits[ipData.ip] = Math.max(uploadLimit, downloadLimit)
              }
            })
            setIpLimits(limits)
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err)
        }
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
      
      ws.onclose = () => {
        console.log('WebSocket closed, will reconnect')
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000)
      }
    }
    
    connectWebSocket()
    
    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      let startTime, endTime
      
      if (showCustomRange && customRange.start && customRange.end) {
        startTime = new Date(customRange.start)
        endTime = new Date(customRange.end)
      } else {
        const range = getTimeRange(timeRange)
        startTime = range.startTime
        endTime = range.endTime
      }
      
      const interval = getAppropriateInterval(startTime, endTime)
      
      // Fetch global traffic history and top consumers in parallel
      const [globalHistory, consumers] = await Promise.all([
        getGlobalTrafficHistory(startTime, endTime, interval),
        getTopConsumers(startTime, endTime, 10)
      ])
      
      // Format data for charts with appropriate time format
      const timeFormat = getTimeFormat(timeRange)
      const formattedData = globalHistory.map(entry => ({
        timestamp: new Date(entry.timestamp).getTime(),
        timeLabel: format(new Date(entry.timestamp), timeFormat),
        upload: parseFloat(entry.lan_upload_rate || 0).toFixed(2),
        download: parseFloat(entry.lan_download_rate || 0).toFixed(2),
        wanUpload: parseFloat(entry.wan_upload_rate || 0).toFixed(2),
        wanDownload: parseFloat(entry.wan_download_rate || 0).toFixed(2)
      }))
      
      setGlobalData(formattedData)
      setTopConsumers(consumers)
      
      // Fetch traffic history for top 5 IPs
      const top5 = consumers.slice(0, 5)
      const ipHistories = {}
      
      await Promise.all(
        top5.map(async (consumer) => {
          try {
            const history = await getIPTrafficHistory(consumer.ip, startTime, endTime)
            ipHistories[consumer.ip] = history.map(entry => ({
              timestamp: new Date(entry.timestamp).getTime(),
              timeLabel: format(new Date(entry.timestamp), timeFormat),
              upload: parseFloat(entry.upload_rate || 0).toFixed(2),
              download: parseFloat(entry.download_rate || 0).toFixed(2)
            }))
          } catch (err) {
            console.error(`Failed to fetch history for IP ${consumer.ip}:`, err)
            ipHistories[consumer.ip] = []
          }
        })
      )
      
      setIpTrafficData(ipHistories)
      
      // Only set error if there's an actual failure, not just empty data
      if (formattedData.length === 0 && consumers.length === 0) {
        console.log('No data available for the selected time range yet')
      }
    } catch (err) {
      console.error('Failed to fetch traffic history:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTimeRangeChange = (range) => {
    setShowCustomRange(false)
    setTimeRange(range)
  }

  const handleCustomRangeApply = () => {
    if (customRange.start && customRange.end) {
      setShowCustomRange(true)
      fetchData()
    }
  }

  const calculateTotals = () => {
    if (globalData.length === 0) return { totalUpload: 0, totalDownload: 0 }
    
    const totalUpload = globalData.reduce((sum, d) => sum + parseFloat(d.upload), 0) / globalData.length
    const totalDownload = globalData.reduce((sum, d) => sum + parseFloat(d.download), 0) / globalData.length
    
    return {
      avgUpload: totalUpload.toFixed(2),
      avgDownload: totalDownload.toFixed(2)
    }
  }

  const totals = calculateTotals()

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value} Mbps
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="traffic-history-page">
      <div className="page-header">
        <div className="header-content">
          <Activity size={32} />
          <div>
            <h1>Traffic History & Analytics</h1>
            <p>Monitor bandwidth usage trends and identify top consumers</p>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="time-range-selector">
        <div className="range-buttons">
          {['1h', '6h', '24h', '7d', '30d'].map(range => (
            <button
              key={range}
              className={`range-btn ${timeRange === range && !showCustomRange ? 'active' : ''}`}
              onClick={() => handleTimeRangeChange(range)}
            >
              {range === '1h' && 'Last Hour'}
              {range === '6h' && 'Last 6 Hours'}
              {range === '24h' && 'Last 24 Hours'}
              {range === '7d' && 'Last 7 Days'}
              {range === '30d' && 'Last 30 Days'}
            </button>
          ))}
          <button
            className={`range-btn ${showCustomRange ? 'active' : ''}`}
            onClick={() => setShowCustomRange(!showCustomRange)}
          >
  
            <Clock size={16} />
            Custom Range
          </button>
        </div>

        {showCustomRange && (
          <div className="custom-range-inputs">
            <input
              type="datetime-local"
              value={customRange.start}
              onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
            />
            <span>to</span>
            <input
              type="datetime-local"
              value={customRange.end}
              onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
            />
            <button className="apply-btn" onClick={handleCustomRangeApply}>
              Apply
            </button>
          </div>
        )}

        <button className="refresh-btn" onClick={fetchData} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>Failed to load traffic data: {error}</p>
        </div>
      )}

      {!loading && !error && globalData.length === 0 && topConsumers.length === 0 && (
        <div className="info-message">
          <p>No traffic data available yet for the selected time range. Data is collected every 2 seconds.</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Global Limit</div>
            <div className="stat-value">{globalLimit} Mbps</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#3b82f620', color: '#3b82f6' }}>
            <Upload size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Average Upload</div>
            <div className="stat-value">{totals.avgUpload} Mbps</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#10b98120', color: '#10b981' }}>
            <Download size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Average Download</div>
            <div className="stat-value">{totals.avgDownload} Mbps</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#a855f720', color: '#a855f7' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Data Points</div>
            <div className="stat-value">{globalData.length}</div>
          </div>
        </div>
      </div>

      {/* Global Traffic Chart */}
      <div className="chart-card">
        <h3>Global Bandwidth Usage</h3>
        {loading ? (
          <div className="chart-loading">Loading chart data...</div>
        ) : globalData.length === 0 ? (
          <div className="chart-empty">No data available for selected time range</div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={globalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="timeLabel" 
                stroke="#9ca3af"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fontSize: 12 }}
                label={{ value: 'Mbps', angle: -90, position: 'insideLeft' }}
                domain={[0, globalLimit]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine 
                y={globalLimit} 
                stroke="#f59e0b" 
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{ 
                  value: `Global Limit: ${globalLimit} Mbps`, 
                  position: 'top',
                  fill: '#f59e0b',
                  fontSize: 12,
                  fontWeight: 600
                }}
              />
              <Line 
                type="monotone" 
                dataKey="upload" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Upload"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="download" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Download"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Consumers Individual Graphs */}
      <div className="chart-card">
        <h3>Top 5 Data Consumers - Traffic Over Time</h3>
        {loading ? (
          <div className="chart-loading">Loading chart data...</div>
        ) : topConsumers.length === 0 ? (
          <div className="chart-empty">No consumer data available</div>
        ) : (
          <div className="ip-charts-grid">
            {topConsumers.slice(0, 5).map((consumer, index) => {
              const ipData = ipTrafficData[consumer.ip] || []
              const colors = [
                { upload: '#3b82f6', download: '#10b981' },
                { upload: '#f59e0b', download: '#8b5cf6' },
                { upload: '#ef4444', download: '#06b6d4' },
                { upload: '#f97316', download: '#84cc16' },
                { upload: '#ec4899', download: '#14b8a6' }
              ]
              const color = colors[index] || colors[0]
              const ipLimit = ipLimits[consumer.ip] || globalLimit
              
              return (
                <div key={consumer.ip} className="ip-chart-container">
                  <div className="ip-chart-header">
                    <span className="rank-badge" style={{
                      backgroundColor: index === 0 ? '#f59e0b20' : index === 1 ? '#9ca3af20' : '#6b728020',
                      color: index === 0 ? '#f59e0b' : index === 1 ? '#9ca3af' : '#6b7280'
                    }}>
                      #{index + 1}
                    </span>
                    <div className="ip-info">
                      <span className="ip-address">{consumer.ip}</span>
                      <span className="ip-hostname">{consumer.hostname || 'Unknown'}</span>
                    </div>
                    <div className="ip-stats">
                      <span className="stat-small">Limit: {ipLimit} Mbps {ipLimits[consumer.ip] ? '' : '(Global)'}</span>
                      <span className="stat-small">Total: {consumer.total_traffic_mb.toFixed(2)} MB</span>
                    </div>
                  </div>
                  {ipData.length === 0 ? (
                    <div className="chart-empty-small">No traffic data for this IP</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={ipData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="timeLabel" 
                          stroke="#9ca3af"
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis 
                          stroke="#9ca3af"
                          tick={{ fontSize: 10 }}
                          label={{ value: 'Mbps', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
                          domain={[0, ipLimit]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <ReferenceLine 
                          y={ipLimit} 
                          stroke={ipLimits[consumer.ip] ? '#f59e0b' : '#9ca3af'} 
                          strokeDasharray="3 3"
                          strokeWidth={1}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="upload" 
                          stroke={color.upload} 
                          strokeWidth={2}
                          name="Upload"
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="download" 
                          stroke={color.download} 
                          strokeWidth={2}
                          name="Download"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Top Consumers Table */}
      <div className="chart-card">
        <h3>Top Consumers Summary</h3>
        {loading ? (
          <div className="chart-loading">Loading data...</div>
        ) : topConsumers.length === 0 ? (
          <div className="chart-empty">No consumer data available</div>
        ) : (
          <div className="consumers-table">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>IP Address</th>
                    <th>Hostname</th>
                    <th>Total Upload</th>
                    <th>Total Download</th>
                    <th>Total Traffic</th>
                    <th>Avg Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topConsumers.map((consumer, index) => (
                    <tr key={consumer.ip}>
                      <td>
                        <span className="rank-badge" style={{
                          backgroundColor: index === 0 ? '#f59e0b20' : index === 1 ? '#9ca3af20' : '#6b728020',
                          color: index === 0 ? '#f59e0b' : index === 1 ? '#9ca3af' : '#6b7280'
                        }}>
                          #{index + 1}
                        </span>
                      </td>
                      <td><span className="ip-address">{consumer.ip}</span></td>
                      <td>{consumer.hostname || 'Unknown'}</td>
                      <td>{consumer.total_upload_mb.toFixed(2)} MB</td>
                      <td>{consumer.total_download_mb.toFixed(2)} MB</td>
                      <td><strong>{consumer.total_traffic_mb.toFixed(2)} MB</strong></td>
                      <td>
                        <div className="rate-info">
                          <span>↑ {consumer.avg_upload_rate.toFixed(2)} Mbps</span>
                          <span>↓ {consumer.avg_download_rate.toFixed(2)} Mbps</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        )}
      </div>
    </div>
  )
}

export default TrafficHistory
