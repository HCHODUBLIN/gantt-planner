import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useI18n } from '../contexts/I18nContext';

interface TagManageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TagManageModal({ isOpen, onClose }: TagManageModalProps) {
  const { allData, updateData, getAllTags, currentFilter, setCurrentFilter } = useData();
  const { t } = useI18n();
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const tags = getAllTags();

  const renameTag = (oldTag: string) => {
    const newTag = (editValues[oldTag] || '').trim().toLowerCase().replace(/\s+/g, '-');
    if (!newTag || newTag === oldTag) return;
    updateData(prev => {
      const next = { ...prev, categories: prev.categories.map(cat => ({
        ...cat,
        tags: (cat.tags || []).map(tag => tag === oldTag ? newTag : tag)
      }))};
      return next;
    });
    setCurrentFilter(prev => {
      const next = new Set(prev);
      if (next.has(oldTag)) { next.delete(oldTag); next.add(newTag); }
      return next;
    });
    setEditValues(prev => {
      const copy = { ...prev };
      delete copy[oldTag];
      return copy;
    });
  };

  const deleteTag = (tag: string) => {
    const msg = (t('tagDeleteConfirm') as string).replace('{tag}', tag);
    if (!confirm(msg)) return;
    updateData(prev => {
      const next = { ...prev, categories: prev.categories.map(cat => ({
        ...cat,
        tags: (cat.tags || []).filter(tg => tg !== tag)
      }))};
      return next;
    });
    setCurrentFilter(prev => {
      const next = new Set(prev);
      if (next.has(tag)) { next.delete(tag); if (next.size === 0) next.add('all'); }
      return next;
    });
  };

  return (
    <div className="modal-overlay active" onClick={(e: React.MouseEvent) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '450px' }}>
        <div className="modal-title">{t('tagManageTitle')}</div>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {tags.length === 0 && (
            <div style={{ color: '#888', fontSize: '12px', padding: '12px 0' }}>{t('noTags')}</div>
          )}
          {tags.map(tag => (
            <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid #f0f1f3' }}>
              <input
                type="text"
                value={editValues[tag] !== undefined ? editValues[tag] : tag}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValues(prev => ({ ...prev, [tag]: e.target.value }))}
                style={{ flex: 1, padding: '6px 8px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit' }}
              />
              <button
                onClick={() => renameTag(tag)}
                style={{ padding: '5px 10px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
              >
                {t('tagManageRename')}
              </button>
              <button
                onClick={() => deleteTag(tag)}
                style={{ padding: '5px 8px', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer' }}
              >
                ❌
              </button>
            </div>
          ))}
        </div>
        <div className="modal-buttons">
          <button onClick={onClose}>{t('tagManageClose')}</button>
        </div>
      </div>
    </div>
  );
}
