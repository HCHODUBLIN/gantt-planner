import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useI18n } from '../contexts/I18nContext';

export default function RoutineModal({ isOpen, onClose }) {
  const { allData, updateData } = useData();
  const { t } = useI18n();
  const [blocks, setBlocks] = useState([]);
  const [saturday, setSaturday] = useState('');
  const [sunday, setSunday] = useState('');
  const [rules, setRules] = useState('');
  const [exercise, setExercise] = useState('');

  useEffect(() => {
    if (isOpen && allData) {
      const routine = allData.routine || {};
      setBlocks([...(routine.blocks || [])].map(b => ({ ...b })));
      setSaturday(routine.saturday || '');
      setSunday(routine.sunday || '');
      setRules(routine.rules || '');
      setExercise(routine.exercise || '');
    }
  }, [isOpen, allData]);

  if (!isOpen) return null;

  const updateBlock = (idx, field, value) => {
    setBlocks(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const removeBlock = (idx) => {
    setBlocks(prev => prev.filter((_, i) => i !== idx));
  };

  const addBlock = () => {
    setBlocks(prev => [...prev, {
      key: 'block' + Date.now(),
      emoji: '⏰',
      label: '새 블록',
      labelEn: 'New Block',
      hours: '00-00',
      desc: ''
    }]);
  };

  const handleSave = () => {
    updateData(prev => ({
      ...prev,
      routine: {
        blocks: blocks.map(b => ({
          ...b,
          key: b.label.toLowerCase().replace(/\s+/g, '_')
        })),
        saturday,
        sunday,
        rules,
        exercise
      }
    }));
    onClose();
  };

  return (
    <div className="modal-overlay active" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-title">{t('routineModalTitle')}</div>
        <div>
          {blocks.map((b, i) => (
            <div key={i} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '10px', marginBottom: '8px', background: '#fafbfc' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                <div className="form-group" style={{ margin: 0, flex: '0 0 40px' }}>
                  <label>Emoji</label>
                  <input type="text" value={b.emoji} onChange={e => updateBlock(i, 'emoji', e.target.value)} style={{ textAlign: 'center' }} />
                </div>
                <div className="form-group" style={{ margin: 0, flex: 1 }}>
                  <label>{t('routineLabelKo')}</label>
                  <input type="text" value={b.label} onChange={e => updateBlock(i, 'label', e.target.value)} />
                </div>
                <div className="form-group" style={{ margin: 0, flex: 1 }}>
                  <label>{t('routineLabelEn')}</label>
                  <input type="text" value={b.labelEn || ''} onChange={e => updateBlock(i, 'labelEn', e.target.value)} />
                </div>
                <div className="form-group" style={{ margin: 0, flex: '0 0 70px' }}>
                  <label>{t('routineHours')}</label>
                  <input type="text" value={b.hours} onChange={e => updateBlock(i, 'hours', e.target.value)} placeholder="09-12" />
                </div>
                <button
                  onClick={() => removeBlock(i)}
                  style={{ alignSelf: 'flex-end', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 8px', cursor: 'pointer', fontSize: '11px', marginBottom: '1px' }}
                >
                  ✕
                </button>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>{t('routineDescription')}</label>
                <input type="text" value={b.desc} onChange={e => updateBlock(i, 'desc', e.target.value)} />
              </div>
            </div>
          ))}
        </div>
        <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #eee' }} />
        <div className="form-group">
          <label>{t('routineSaturday')}</label>
          <input type="text" value={saturday} onChange={e => setSaturday(e.target.value)} />
        </div>
        <div className="form-group">
          <label>{t('routineSunday')}</label>
          <input type="text" value={sunday} onChange={e => setSunday(e.target.value)} />
        </div>
        <div className="form-group">
          <label>{t('routineRules')}</label>
          <input type="text" value={rules} onChange={e => setRules(e.target.value)} />
        </div>
        <div className="form-group">
          <label>{t('routineExercise')}</label>
          <input type="text" value={exercise} onChange={e => setExercise(e.target.value)} />
        </div>
        <div style={{ marginTop: '12px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
          <button className="action-btn" onClick={addBlock} style={{ fontSize: '11px' }}>
            {t('addTimeBlock')}
          </button>
        </div>
        <div className="modal-buttons">
          <button onClick={onClose}>{t('cancelBtn')}</button>
          <button className="save-btn" onClick={handleSave}>{t('saveBtnLabel')}</button>
        </div>
      </div>
    </div>
  );
}
