import React, { useState } from 'react';
import { Clock, Plus } from 'lucide-react';
import * as api from '../services/api';

const ScheduleRuleModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    rate_mbps: 50,
    startHour: '08',
    startMinute: '00',
    endHour: '18',
    endMinute: '00',
    periodicity: 'weekdays',
    customDays: [],
    enabled: true
  });

  const buildCronExpression = () => {
    const { startHour, startMinute, periodicity, customDays } = formData;
    
    let daysPart = '*';
    if (periodicity === 'weekdays') {
      daysPart = '1-5';
    } else if (periodicity === 'weekend') {
      daysPart = '0,6';
    } else if (periodicity === 'custom' && customDays.length > 0) {
      daysPart = customDays.join(',');
    }
    
    return `${startMinute} ${startHour} * * ${daysPart}`;
  };

  const calculateDuration = () => {
    const { startHour, startMinute, endHour, endMinute } = formData;
    const start = parseInt(startHour) * 60 + parseInt(startMinute);
    const end = parseInt(endHour) * 60 + parseInt(endMinute);
    let duration = end - start;
    
    if (duration < 0) {
      duration = 1440 + duration;
    }
    
    return duration;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const newRule = {
        id: formData.id,
        name: formData.name,
        description: formData.description,
        rate_mbps: formData.rate_mbps,
        cron_expr: buildCronExpression(),
        duration: calculateDuration(),
        enabled: formData.enabled
      };
      
      // Récupérer les règles existantes
      const { rules } = await api.getGlobalSchedule();
      const newRules = [...rules, newRule];
      await api.setGlobalSchedule(newRules);
      
      // Réinitialiser le formulaire
      setFormData({
        id: '',
        name: '',
        description: '',
        rate_mbps: 50,
        startHour: '08',
        startMinute: '00',
        endHour: '18',
        endMinute: '00',
        periodicity: 'weekdays',
        customDays: [],
        enabled: true
      });
      
      if (onSuccess) {
        onSuccess(`Règle "${newRule.name}" créée avec succès`);
      }
      onClose();
    } catch (err) {
      alert('Erreur lors de la création: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];
  const weekDays = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wedn' },
    { value: 4, label: 'Thur' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' }
  ];

  const toggleCustomDay = (day) => {
    const newDays = formData.customDays.includes(day)
      ? formData.customDays.filter(d => d !== day)
      : [...formData.customDays, day].sort((a, b) => a - b);
    setFormData({ ...formData, customDays: newDays });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><Clock size={20} /> New scheduling rule</h3>
          <button onClick={onClose} className="btn-close">×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Rule ID *</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="ex: work-hours"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Rule Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: Heures de bureau"
                required
              />
            </div>

            <div className="form-group full-width">
              <label>Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description optionnelle"
              />
            </div>

            <div className="form-group">
              <label>Bandwidth Limit (Mbps) *</label>
              <input
                type="number"
                value={formData.rate_mbps}
                onChange={(e) => setFormData({ ...formData, rate_mbps: parseInt(e.target.value) })}
                min="1"
                max="1000"
                required
              />
            </div>

            <div className="form-group">
              <label>Frequency *</label>
              <select
                value={formData.periodicity}
                onChange={(e) => setFormData({ ...formData, periodicity: e.target.value, customDays: [] })}
              >
                <option value="daily">Everyday</option>
                <option value="weekdays">Monday to Friday</option>
                <option value="weekend">Weekend (Sam-Dim)</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {formData.periodicity === 'custom' && (
              <div className="form-group full-width">
                <label>Week of the day</label>
                <div className="day-selector">
                  {weekDays.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      className={`day-btn ${formData.customDays.includes(day.value) ? 'active' : ''}`}
                      onClick={() => toggleCustomDay(day.value)}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Start Time*</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={formData.startHour}
                  onChange={(e) => setFormData({ ...formData, startHour: e.target.value })}
                >
                  {hours.map(h => <option key={h} value={h}>{h}h</option>)}
                </select>
                <select
                  value={formData.startMinute}
                  onChange={(e) => setFormData({ ...formData, startMinute: e.target.value })}
                >
                  {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>End Time *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={formData.endHour}
                  onChange={(e) => setFormData({ ...formData, endHour: e.target.value })}
                >
                  {hours.map(h => <option key={h} value={h}>{h}h</option>)}
                </select>
                <select
                  value={formData.endMinute}
                  onChange={(e) => setFormData({ ...formData, endMinute: e.target.value })}
                >
                  {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="preview-box">
            <Clock size={16} />
            <strong>Overview</strong> 
            <span>
              {formData.periodicity === 'daily' && 'Everyday'}
              {formData.periodicity === 'weekdays' && 'Monday to Friday'}
              {formData.periodicity === 'weekend' && 'Weekend'}
              {formData.periodicity === 'custom' && formData.customDays.length > 0 && 
                `Jours: ${formData.customDays.map(d => weekDays[d].label).join(', ')}`}
              {formData.periodicity === 'custom' && formData.customDays.length === 0 && 
                'Sélectionnez au moins un jour'}
            </span>
            from <strong>{formData.startHour}:{formData.startMinute}</strong> to <strong>{formData.endHour}:{formData.endMinute}</strong>
            → Limit: <span className="badge-preview">{formData.rate_mbps} Mbps</span>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading || (formData.periodicity === 'custom' && formData.customDays.length === 0)}
            >
              <Plus size={18} />
              {loading ? 'Création...' : 'Ajouter la règle'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
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

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ScheduleRuleModal;
