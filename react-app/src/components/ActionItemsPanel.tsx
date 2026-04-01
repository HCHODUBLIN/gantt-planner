import React from 'react';
import { useI18n } from '../contexts/I18nContext';
import type { Task, TaskPriority } from '../types';

const PRIORITY_LABELS: Record<string, string> = { urgent: 'URGENT', high: 'HIGH', medium: 'MED', low: 'LOW' };
const PRIORITY_CLASSES: Record<string, string> = { urgent: 'priority-urgent', high: 'priority-high', medium: 'priority-medium', low: 'priority-low' };

interface ActionItemsPanelProps {
  actionItems: Task[];
  onDragStart: (taskId: string) => void;
  onDropReturn: (e: React.DragEvent) => void;
}

export default function ActionItemsPanel({ actionItems, onDragStart, onDropReturn }: ActionItemsPanelProps) {
  const { t } = useI18n();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).style.outline = '2px dashed var(--accent)';
    (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.outline = '';
    (e.currentTarget as HTMLElement).style.background = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).style.outline = '';
    (e.currentTarget as HTMLElement).style.background = '';
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
            onDragStart={(e: React.DragEvent) => {
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
