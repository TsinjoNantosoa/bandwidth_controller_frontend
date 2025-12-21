const API_BASE_URL = 'http://localhost:8080'

/**
 * Get global traffic history for a time range
 * @param {Date} startTime - Start of time range
 * @param {Date} endTime - End of time range
 * @param {string} interval - Aggregation interval (e.g., '5m', '1h', 'raw')
 * @returns {Promise<Array>} Array of traffic history entries
 */
export const getGlobalTrafficHistory = async (startTime, endTime, interval = '5m') => {
  const params = new URLSearchParams({
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    interval
  })
  
  const response = await fetch(`${API_BASE_URL}/traffic/history/global?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch global traffic history: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Get traffic history for a specific IP
 * @param {string} ip - IP address
 * @param {Date} startTime - Start of time range
 * @param {Date} endTime - End of time range
 * @returns {Promise<Array>} Array of IP traffic history entries
 */
export const getIPTrafficHistory = async (ip, startTime, endTime) => {
  const params = new URLSearchParams({
    ip,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString()
  })
  
  const response = await fetch(`${API_BASE_URL}/traffic/history/ip?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch IP traffic history: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Get top data consumers
 * @param {Date} startTime - Start of time range
 * @param {Date} endTime - End of time range
 * @param {number} limit - Number of top consumers to return
 * @returns {Promise<Array>} Array of top consumers
 */
export const getTopConsumers = async (startTime, endTime, limit = 10) => {
  const params = new URLSearchParams({
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    limit: limit.toString()
  })
  
  const response = await fetch(`${API_BASE_URL}/traffic/history/top-consumers?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch top consumers: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Get time range based on preset
 * @param {string} preset - Time range preset ('1h', '6h', '24h', '7d', '30d')
 * @returns {Object} Object with startTime and endTime
 */
export const getTimeRange = (preset) => {
  const endTime = new Date()
  const startTime = new Date()
  
  switch (preset) {
    case '1h':
      startTime.setHours(endTime.getHours() - 1)
      break
    case '6h':
      startTime.setHours(endTime.getHours() - 6)
      break
    case '24h':
      startTime.setDate(endTime.getDate() - 1)
      break
    case '7d':
      startTime.setDate(endTime.getDate() - 7)
      break
    case '30d':
      startTime.setDate(endTime.getDate() - 30)
      break
    default:
      startTime.setHours(endTime.getHours() - 1)
  }
  
  return { startTime, endTime }
}

/**
 * Get appropriate interval based on time range
 * @param {Date} startTime 
 * @param {Date} endTime 
 * @returns {string} Interval string
 */
export const getAppropriateInterval = (startTime, endTime) => {
  const diffMs = endTime - startTime
  const diffHours = diffMs / (1000 * 60 * 60)
  
  if (diffHours <= 1) return 'raw'      // 1 hour or less: raw data
  if (diffHours <= 6) return '1 minute' // 6 hours or less: 1 min aggregation
  if (diffHours <= 24) return '5 minute' // 24 hours or less: 5 min aggregation
  if (diffHours <= 168) return '1 hour'  // 7 days or less: 1 hour aggregation
  return '1 day'                         // More than 7 days: 1 day aggregation
}
