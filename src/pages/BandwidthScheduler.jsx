import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, Power, PowerOff, RefreshCw, TrendingDown, Zap, Edit } from 'lucide-react';
import * as api from '../services/api';
import ScheduleRuleModal from '../components/ScheduleRuleModal';

const BandwidthScheduler = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  // Charger les règles au montage
  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getGlobalSchedule();
      setRules(data.rules || []);
    } catch (err) {
      setError('Erreur lors du chargement des règles: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSuccess = (message) => {
    setSuccess(message);
    setEditingRule(null);
    loadRules();
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleCloseModal = () => {
    setShowForm(false);
    setEditingRule(null);
  };

  const getPriorityLevel = (priority) => {
    if (priority >= 8) return 'high';
    if (priority >= 5) return 'medium';
    return 'low';
  };

  const handleDeleteRule = async (id) => {
    if (!confirm(`Supprimer la règle ${id} ?`)) return;
    
    try {
      setLoading(true);
      setError('');
      await api.deleteGlobalScheduleRule(id);
      setSuccess(`✓ Règle supprimée`);
      await loadRules();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur lors de la suppression: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Convertir cron en texte lisible
  const cronToReadable = (cronExpr, duration) => {
    const parts = cronExpr.split(' ');
    const minute = parts[0];
    const hour = parts[1];
    const days = parts[4];
    
    const startTime = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    const endMinutes = (parseInt(hour) * 60 + parseInt(minute) + duration) % 1440;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    
    let daysText = 'Tous les jours';
    if (days === '1-5') daysText = 'Lundi à Vendredi';
    else if (days === '0,6') daysText = 'Weekend';
    else if (days !== '*') daysText = `Jours: ${days}`;
    
    return `${daysText}, ${startTime} - ${endTime}`;
  };

  const handleToggleRule = async (rule) => {
    try {
      setLoading(true);
      setError('');
      
      // Toggle the enabled state
      const updatedRule = { ...rule, enabled: !rule.enabled };
      
      await api.updateScheduleRule(rule.id, updatedRule);
      setSuccess(`✓ Règle ${rule.enabled ? 'désactivée' : 'activée'}`);
      await loadRules();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur lors du changement: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1><Calendar size={28} style={{ verticalAlign: 'middle', marginRight: '10px' }} />Schedule bandwidth</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Programmez automatiquement vos changements de bande passante selon vos horaires
            <span className="timezone-badge">
              <Clock size={14} />
              Local time
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={loadRules} className="btn-secondary" disabled={loading}>
            <RefreshCw size={18} />
            Refresh
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Plus size={18} />
            New rule
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <Zap size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <Zap size={18} />
          {success}
        </div>
      )}

      <ScheduleRuleModal
        isOpen={showForm}
        onClose={handleCloseModal}
        onSuccess={handleScheduleSuccess}
        editRule={editingRule}
      />

      <div className="card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingDown size={20} />
            Scheduled rules({rules.length})
        </h3>

        {loading && <div className="loading-state">Chargement...</div>}

        {!loading && rules.length === 0 && (
          <div className="empty-state">
            <Clock size={64} />
            <h4>No rule of schedule</h4>
            <p>Begin to create your first bandwidth schedule rule</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus size={18} />
              Create my first rule
            </button>
          </div>
        )}

        {!loading && rules.length > 0 && (
          <div className="rules-grid">
            {rules.map(rule => (
              <div key={rule.id} className={`rule-card ${!rule.enabled ? 'disabled' : ''}`}>
                <div className="rule-header">
                  <div>
                    <h4>{rule.name}</h4>
                    <span className="rule-id">{rule.id}</span>
                  </div>
                  <button
                    onClick={() => handleToggleRule(rule)}
                    className={`toggle-btn ${rule.enabled ? 'active' : ''}`}
                    title={rule.enabled ? 'Désactiver' : 'Activer'}
                  >
                    {rule.enabled ? <Power size={16} /> : <PowerOff size={16} />}
                  </button>
                </div>

                <div className="rule-body">
                  {rule.description && (
                    <p className="rule-description">{rule.description}</p>
                  )}
                  
                  <div className="rule-info">
                    <div className="info-item">
                      <Clock size={16} />
                      <span>{cronToReadable(rule.cron_expr, rule.duration)}</span>
                    </div>
                    
                    <div className="info-item">
                      <Zap size={16} />
                      <span className="rate-badge">{rule.rate_mbps} Mbps</span>
                    </div>

                    <div className="info-item">
                      <span className={`priority-badge priority-${getPriorityLevel(rule.priority)}`}>
                        Priority: {rule.priority}/10
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rule-footer">
                  <button
                    onClick={() => handleEditRule(rule)}
                    className="btn-edit"
                  >
                    <Edit size={16} />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="btn-delete"
                  >
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .page-container {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid var(--border);
        }

        .page-header h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          color: var(--text-primary);
        }

        .timezone-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-left: 12px;
          padding: 4px 10px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: var(--blue);
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-weight: 500;
        }
        
        .alert-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: var(--red);
        }
        
        .alert-success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: var(--green);
        }

        /* Modal */
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
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: var(--card-bg);
          border-radius: 16px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid var(--border);
        }

        .modal-header h3 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-primary);
        }

        .btn-close {
          background: none;
          border: none;
          font-size: 32px;
          color: var(--text-secondary);
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .btn-close:hover {
          background: rgba(239, 68, 68, 0.1);
          color: var(--red);
        }

        .modal-content form {
          padding: 24px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          margin-bottom: 8px;
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 14px;
        }

        .form-group input,
        .form-group select {
          padding: 12px 14px;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 14px;
          transition: all 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--blue);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .day-selector {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .day-btn {
          flex: 1;
          min-width: 50px;
          padding: 10px;
          background: var(--bg-primary);
          border: 2px solid var(--border);
          border-radius: 8px;
          color: var(--text-secondary);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .day-btn:hover {
          border-color: var(--blue);
          color: var(--blue);
        }

        .day-btn.active {
          background: var(--blue);
          border-color: var(--blue);
          color: white;
        }

        .preview-box {
          margin-top: 20px;
          padding: 16px;
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 10px;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 14px;
        }

        .badge-preview {
          background: var(--blue);
          color: white;
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 600;
        }

        .modal-footer {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding: 20px 24px;
          border-top: 1px solid var(--border);
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-secondary);
        }

        .empty-state svg {
          opacity: 0.3;
          margin-bottom: 20px;
        }

        .empty-state h4 {
          margin: 10px 0;
          color: var(--text-primary);
          font-size: 20px;
        }

        .empty-state p {
          margin: 10px 0 30px 0;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .loading-state {
          text-align: center;
          padding: 40px;
          color: var(--text-secondary);
        }

        /* Rules Grid */
        .rules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .rule-card {
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s;
        }

        .rule-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          border-color: var(--blue);
        }

        .rule-card.disabled {
          opacity: 0.6;
        }

        .rule-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px;
          background: var(--card-bg);
          border-bottom: 1px solid var(--border);
        }

        .rule-header h4 {
          margin: 0 0 6px 0;
          color: var(--text-primary);
          font-size: 18px;
        }

        .rule-id {
          font-size: 12px;
          color: var(--text-secondary);
          font-family: 'Courier New', monospace;
          background: rgba(59, 130, 246, 0.1);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .toggle-btn {
          padding: 8px 12px;
          border-radius: 20px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          font-size: 12px;
          transition: all 0.2s;
        }

        .toggle-btn.active {
          background: rgba(16, 185, 129, 0.2);
          color: var(--green);
        }

        .toggle-btn:not(.active) {
          background: rgba(107, 114, 128, 0.2);
          color: var(--text-secondary);
        }

        .toggle-btn:hover {
          transform: scale(1.05);
        }

        .rule-body {
          padding: 20px;
        }

        .rule-description {
          margin: 0 0 16px 0;
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.5;
        }

        .rule-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-secondary);
          font-size: 14px;
        }

        .info-item svg {
          color: var(--blue);
          flex-shrink: 0;
        }

        .rate-badge {
          background: linear-gradient(135deg, var(--blue), var(--purple));
          color: white;
          padding: 4px 12px;
          border-radius: 6px;
          font-weight: 700;
        }

        .priority-badge {
          padding: 4px 12px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 13px;
        }

        .priority-badge.priority-high {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .priority-badge.priority-medium {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .priority-badge.priority-low {
          background: rgba(107, 114, 128, 0.1);
          color: #6b7280;
          border: 1px solid rgba(107, 114, 128, 0.3);
        }

        .rule-footer {
          padding: 16px 20px;
          background: var(--card-bg);
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .btn-edit {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: var(--blue);
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
        }

        .btn-edit:hover {
          background: rgba(59, 130, 246, 0.2);
          transform: translateY(-2px);
        }

        .btn-delete {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 8px;
          color: var(--red);
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
        }

        .btn-delete:hover {
          background: rgba(239, 68, 68, 0.2);
          transform: scale(1.05);
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            gap: 20px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .rules-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default BandwidthScheduler;
