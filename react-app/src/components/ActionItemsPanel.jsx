import { useI18n } from '../contexts/I18nContext';

const PRIORITY_LABELS = { urgent: 'URGENT', high: 'HIGH', medium: 'MED', low: 'LOW' };
const PRIORITY_CLASSES = { urgent: 'priority-urgent', high: 'priority-high', medium: 'priority-medium', low: 'priority-low' };

export default function ActionItemsPanel({ actionItems, onDragStart, onDropReturn }) {
  const { t } = useI18n();

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.style.outline = '2px dashed var(--accent)';
    e.currentTarget.style.background = 'var(--surface-hover)';
  };

  const handleDragLeave = (e) => {
    e.currentTarget.style.outline = '';
    e.currentTarget.style.background = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.style.outline = '';
    e.currentTarget.style.background = '';
    onDropReturn(e);
  };

  return (
    <div className="action-items-panel">
      <div className="action-items-header">
        <span className="action-items-title">{t('actionItems')}</span>
        <span className="action-items-hint">{t('actionHint')}</span>
      </div>
      <div
        className="action-items-list"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {actionItems.length === 0 && (
          <span style={{ color: 'var(--text-muted)', fontSize: '10px', padding: '4px' }}>
            {t('noActionItems')}
          </span>
        )}
        {actionItems.map(task => (
          <div
            key={task.id}
            className="action-item-chip"
            draggable
            onDragStart={e => {
              onDragStart(task.id);
              e.dataTransfer.effectAllowed = 'copy';
            }}
          >
            <span className={`chip-priority ${PRIORITY_CLASSES[task.priority]}`}>
              {PRIORITY_LABELS[task.priority]}
            </span>
            {' '}{task.name}
          </div>
        ))}
      </div>
    </div>
  );
}
