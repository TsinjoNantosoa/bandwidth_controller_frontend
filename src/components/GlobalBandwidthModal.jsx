import React, { useState } from 'react'
import { Gauge, X } from 'lucide-react'
import * as api from '../services/api'

const GlobalBandwidthModal = ({ isOpen, onClose, onSuccess }) => {
  const [rateLimit, setRateLimit] = useState('100mbit')
  const [latency, setLatency] = useState('50ms')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!rateLimit) {
      setError('Please enter a rate limit')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await api.updateHTBGlobalLimit(rateLimit, latency)
      onSuccess(`Global bandwidth limit updated to ${rateLimit} with latency ${latency}`)
      onClose()
      // Reset form
      setRateLimit('100mbit')
      setLatency('50ms')
    } catch (err) {
      setError(`Failed to update bandwidth limit: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
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
            Set Global Bandwidth Limit
          </h3>
          <button 
            className="close-btn"
            onClick={onClose}
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
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px' }}>
          <form onSubmit={handleSubmit}>
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
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
                placeholder="e.g., 100mbit, 500mbit, 1gbit"
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
                Examples: 10mbit, 50mbit, 100mbit, 500mbit, 1gbit
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: 'var(--text-secondary)', 
                fontWeight: '500',
                fontSize: '14px'
              }}>
                Latency
              </label>
              <input
                type="text"
                value={latency}
                onChange={(e) => setLatency(e.target.value)}
                placeholder="e.g., 50ms, 100ms"
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
                Default: 50ms (network latency buffer)
              </div>
            </div>

            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--red)',
                borderRadius: '8px',
                color: 'var(--red)',
                fontSize: '14px',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            <div 
              className="modal-footer" 
              style={{ 
                display: 'flex', 
                gap: '10px', 
                justifyContent: 'flex-end'
              }}
            >
              <button 
                type="button"
                className="cancel-btn"
                onClick={onClose}
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
                disabled={loading || !rateLimit}
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
                  opacity: loading || !rateLimit ? 0.6 : 1
                }}
              >
                <Gauge size={18} />
                {loading ? 'Applying...' : 'Apply Limit'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
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

        .close-btn:hover {
          background: var(--bg-secondary) !important;
          color: var(--text-primary) !important;
        }

        .cancel-btn:hover {
          background: var(--bg-secondary) !important;
        }

        .add-rule-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </div>
  )
}

export default GlobalBandwidthModal
