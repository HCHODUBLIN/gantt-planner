import { useState, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';

export default function TaskModal({ isOpen, task, isNew, onSave, onDelete, onClose }) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [status, setStatus] = useState('pending');
  const [priority, setPriority] = useState('medium');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    if (task) {
      setName(task.name || '');
      setStatus(task.status || 'pending');
      setPriority(task.priority || 'medium');
      setStart(task.start || '');
      setEnd(task.end || '');
    } else if (isNew) {
      setName('');
      setStatus('pending');
      setPriority('medium');
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setStart(today);
      setEnd(nextWeek);
    }
  }, [task, isNew]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    if (start && end && end < start) {
      alert(t('endDateError'));
      return;
    }
    onSave({ name: name.trim(), status, priority, start, end });
  };

  return (
    <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-title">{isNew ? t('addTaskTitle') : t('modalTitle')}</div>
        <div className="form-group">
          <label>{t('labelName')}</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>{t('labelStatus')}</label>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="pending">{t('optPending')}</option>
            <option value="progress">{t('optProgress')}</option>
            <option value="done">{t('optDone')}</option>
          </select>
        </div>
        <div className="form-group">
          <label>{t('labelPriority')}</label>
          <select value={priority} onChange={e => setPriority(e.target.value)}>
            <option value="low">{t('optLow')}</option>
            <option value="medium">{t('optMedium')}</option>
            <option value="high">{t('optHigh')}</option>
            <option value="urgent">{t('optUrgent')}</option>
          </select>
        </div>
        <div className="form-group">
          <label>{t('labelStart')}</label>
          <input type="date" value={start} onChange={e => setStart(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>{t('labelEnd')}</label>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} required />
        </div>
        <div className="modal-buttons">
          {!isNew && onDelete && (
            <button className="delete-btn" onClick={onDelete}>{t('deleteBtn')}</button>
          )}
          <button onClick={onClose}>{t('cancelBtn')}</button>
          <button className="save-btn" onClick={handleSave}>{t('saveBtnLabel')}</button>
        </div>
      </div>
    </div>
  );
}
