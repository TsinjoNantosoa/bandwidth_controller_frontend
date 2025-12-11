import React, { useState } from 'react'
import { Shield, Plus, Trash2, Edit, Check, X } from 'lucide-react'
import * as api from '../services/api'

const BandwidthRules = () => {
  const [rules, setRules] = useState([
    {
      id: 1,
      name: 'Gaming Traffic',
      type: 'HTB',
      bandwidth: '100mbit',
      priority: 'High',
      status: 'Active',
      description: 'Prioritize gaming traffic'
    },
    {
      id: 2,
      name: 'Video Streaming',
      type: 'Simple',
      bandwidth: '50mbit',
      priority: 'Medium',
      status: 'Active',
      description: 'Limit streaming bandwidth'
    }
  ])

  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [rateLimit, setRateLimit] = useState('100mbit')
  const [latency, setLatency] = useState('50ms')

  const [newRule, setNewRule] = useState({
    name: '',
    type: 'HTB',
    bandwidth: '',
    priority: 'Medium',
    description: ''
  })

  const handleUpdateHTBLimit = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await api.updateHTBGlobalLimit(rateLimit, latency)
      setSuccess(`HTB limit updated to ${rateLimit} with latency ${latency}!`)
      console.log('HTB Update result:', result)
    } catch (err) {
      setError(`Failed to update HTB limit: ${err.message}`)
      console.error('HTB Update error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApplySimpleLimit = async (bandwidth) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await api.applySimpleLimit(bandwidth, latency)
      setSuccess(`Simple limit applied: ${bandwidth}`)
      console.log('Simple limit result:', result)
    } catch (err) {
      setError(`Failed to apply simple limit: ${err.message}`)
      console.error('Simple limit error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleResetRules = async () => {
    if (!confirm('Are you sure you want to reset all QoS rules?')) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await api.resetShaping()
      setSuccess('All QoS rules have been reset!')
      console.log('Reset result:', result)
    } catch (err) {
      setError(`Failed to reset rules: ${err.message}`)
      console.error('Reset error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRule = () => {
    if (!newRule.name || !newRule.bandwidth) {
      setError('Please fill in all required fields')
      return
    }

    const rule = {
      id: rules.length + 1,
      ...newRule,
      status: 'Active'
    }

    setRules([...rules, rule])
    setShowAddModal(false)
    setNewRule({
      name: '',
      type: 'HTB',
      bandwidth: '',
      priority: 'Medium',
      description: ''
    })

    if (newRule.type === 'HTB') {
      handleUpdateHTBLimit(newRule.bandwidth)
    } else {
      handleApplySimpleLimit(newRule.bandwidth)
    }
  }

  const handleDeleteRule = (id) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      setRules(rules.filter(rule => rule.id !== id))
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'var(--red)'
      case 'Medium': return 'var(--orange)'
      case 'Low': return 'var(--green)'
      default: return 'var(--text-secondary)'
    }
  }

  return (
    <div className="bandwidth-rules-page">
      <div className="page-header">
        <div>
          <h2>Bandwidth Rules</h2>
          {/* <p>Configure and manage QoS traffic control rules</p> */}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
{/*           <button className="add-rule-btn" onClick={() => setShowAddModal(true)}>
            <Plus size={20} />
            Add Rule
          </button> */}
          <button 
            className="add-rule-btn" 
            onClick={handleResetRules}
            disabled={loading}
            style={{ backgroundColor: 'var(--red)' }}
          >
            <Trash2 size={20} />
            Reset All
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--red)',
          borderRadius: '8px',
          color: 'var(--red)',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid var(--green)',
          borderRadius: '8px',
          color: 'var(--green)',
          marginBottom: '20px'
        }}>
          {success}
        </div>
      )}

      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={20} />
          Global Limit Configuration
        </h3>
        {/* <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '15px' }}>
          Backend is running in background. Update the global HTB rate limit and latency here.
        </p> */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', maxWidth: '600px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Rate Limit *
            </label>
            <input
              type="text"
              value={rateLimit}
              onChange={(e) => setRateLimit(e.target.value)}
              placeholder="e.g., 50mbit, 100mbit"
              className="compact-input"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Latency (optional)
            </label>
            <input
              type="text"
              value={latency}
              onChange={(e) => setLatency(e.target.value)}
              placeholder="e.g., 50ms, 100ms"
              className="compact-input"
            />
          </div>
        </div>
        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
          <button 
            className="add-rule-btn"
            onClick={handleUpdateHTBLimit}
            disabled={loading || !rateLimit}
          >
            {loading ? 'Processing...' : "Set Limit"}
          </button>
        </div>
      </div>

{/*       <div className="card">
        <table className="rules-table">
          <thead>
            <tr>
              <th>NAME</th>
              <th>TYPE</th>
              <th>BANDWIDTH</th>w
              <th>PRIORITY</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td>
                  <div>
                    <div style={{ fontWeight: '500' }}>{rule.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {rule.description}
                    </div>
                  </div>
                </td>
                <td>
                  <span className="type-badge" style={{
                    backgroundColor: rule.type === 'HTB' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                    color: rule.type === 'HTB' ? 'var(--blue)' : 'var(--purple)'
                  }}>
                    {rule.type}
                  </span>
                </td>
                <td>{rule.bandwidth}</td>
                <td>
                  <span style={{ color: getPriorityColor(rule.priority) }}>
                    {rule.priority}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${rule.status.toLowerCase()}`}>
                    {rule.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="icon-btn">
                      <Edit size={16} />
                    </button>
                    <button 
                      className="icon-btn" 
                      onClick={() => handleDeleteRule(rule.id)}
                      style={{ color: 'var(--red)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div> */}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Rule</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Rule Name *</label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="e.g., Gaming Traffic"
                />
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select
                  value={newRule.type}
                  onChange={(e) => setNewRule({ ...newRule, type: e.target.value })}
                >
                  <option value="HTB">HTB (Hierarchical)</option>
                  <option value="Simple">Simple (TBF)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bandwidth *</label>
                <input
                  type="text"
                  value={newRule.bandwidth}
                  onChange={(e) => setNewRule({ ...newRule, bandwidth: e.target.value })}
                  placeholder="e.g., 100mbit"
                />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={newRule.priority}
                  onChange={(e) => setNewRule({ ...newRule, priority: e.target.value })}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  placeholder="Rule description"
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="add-rule-btn" onClick={handleAddRule}>
                <Check size={20} />
                Add Rule
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .bandwidth-rules-page {
          padding: 20px;
        }

        .card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
        }

        .rules-table {
          width: 100%;
          border-collapse: collapse;
        }

        .rules-table thead {
          background: var(--bg-secondary);
        }

        .rules-table th {
          padding: 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .rules-table td {
          padding: 16px;
          border-top: 1px solid var(--border);
        }

        .rules-table tbody tr:hover {
          background: var(--bg-secondary);
        }

        .type-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.active {
          background: rgba(34, 197, 94, 0.1);
          color: var(--green);
        }

        .icon-btn {
          padding: 8px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

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
        }

        .modal {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          padding: 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-body {
          padding: 20px;
        }

        .modal-footer {
          padding: 20px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: var(--text-secondary);
          font-size: 14px;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-primary);
          font-family: inherit;
        }

        .close-btn {
          padding: 8px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: 6px;
        }

        .close-btn:hover {
          background: var(--bg-secondary);
        }

        .cancel-btn {
          padding: 10px 20px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-primary);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-btn:hover {
          background: var(--bg-secondary);
        }

        .compact-input {
          width: 100%;
          padding: 8px 10px;
          background: var(--card-bg);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 6px;
          color: var(--text-primary);
          font-size: 13px;
        }

        .compact-input:focus, .compact-input:focus-visible {
          outline: 2px solid rgba(30,144,255,0.14);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}

export default BandwidthRules
