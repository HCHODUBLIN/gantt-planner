import { useState } from 'react';
import { useI18n } from '../contexts/I18nContext';

export default function PinModal({ onSubmit, onCancel, error }) {
  const [pin, setPin] = useState('');
  const { t } = useI18n();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin.length >= 4) onSubmit(pin);
  };

  return (
    <div className="modal-overlay active" onClick={onCancel}>
      <div className="modal-content pin-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">🔒 {t('pinTitle') || 'Enter PIN'}</div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          {t('pinDesc') || 'Enter your PIN to access private data'}
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            className="form-control"
            value={pin}
            onChange={e => setPin(e.target.value)}
            placeholder="PIN (4+ characters)"
            autoFocus
            style={{ marginBottom: '8px', fontSize: '16px', textAlign: 'center', letterSpacing: '4px' }}
          />
          {error && (
            <div style={{ color: '#C4554D', fontSize: '11px', marginBottom: '8px' }}>
              {error}
            </div>
          )}
          <div className="modal-buttons">
            <button type="button" onClick={onCancel} style={{ padding: '6px 14px', border: '1px solid var(--input-border)', background: 'var(--surface)', color: 'var(--text)', borderRadius: '4px', cursor: 'pointer' }}>
              {t('cancelBtn') || 'Cancel'}
            </button>
            <button type="submit" className="save-btn" disabled={pin.length < 4} style={{ padding: '6px 14px' }}>
              {t('unlockBtn') || 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
