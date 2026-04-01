import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useI18n } from '../contexts/I18nContext';

interface CategoryModalProps {
  isOpen: boolean;
  catIdx: number | null;
  onClose: () => void;
}

export default function CategoryModal({ isOpen, catIdx, onClose }: CategoryModalProps) {
  const { allData, updateData, getAllTags } = useData();
  const { t } = useI18n();

  const isEditing = catIdx !== null && catIdx !== undefined;
  const allTags = getAllTags();

  // Compute initial values directly from current props
  const cat = isEditing && allData ? allData.categories[catIdx] : null;
  const [name, setName] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>('');
  const [initialized, setInitialized] = useState<boolean>(false);

  // Reset when modal opens (isOpen transitions to true)
  if (isOpen && !initialized) {
    setName(cat?.name || '');
    setSelectedTags([...(cat?.tags || [])]);
    setNewTag('');
    setInitialized(true);
  }
  if (!isOpen && initialized) {
    setInitialized(false);
  }

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const tag = newTag.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag) return;
    setNewTag('');
    if (!selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    updateData(prev => {
      const next = { ...prev, categories: [...prev.categories] };
      if (isEditing) {
        next.categories[catIdx] = { ...next.categories[catIdx], name: name.trim(), tags: selectedTags };
        delete (next.categories[catIdx] as Record<string, unknown>).section;
      } else {
        next.categories.push({ name: name.trim(), tags: selectedTags, tasks: [] });
      }
      return next;
    });
    onClose();
  };

  const handleDelete = () => {
    if (!isEditing || !allData) return;
    const c = allData.categories[catIdx];
    const msg = (t('deleteCatConfirm') as string).replace('{name}', c.name).replace('{count}', String(c.tasks.length));
    if (!confirm(msg)) return;
    updateData(prev => {
      const next = { ...prev, categories: [...prev.categories] };
      next.categories.splice(catIdx, 1);
      return next;
    });
    onClose();
  };

  // Merge allTags with any custom tags already selected
  const displayTags = [...new Set([...allTags, ...selectedTags])];

  return (
    <div className="modal-overlay active" onClick={(e: React.MouseEvent) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-title">{isEditing ? t('catModalTitle') : t('newCatTitle')}</div>
        <div className="form-group">
          <label>{t('catNameLabel')}</label>
          <input type="text" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="📊 Category Name" />
        </div>
        <div className="form-group">
          <label>{t('catTagsLabel')}</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
            {displayTags.map(tag => (
              <label key={tag} style={{
                display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px',
                padding: '3px 8px', border: '1px solid #ddd', borderRadius: '12px',
                cursor: 'pointer', userSelect: 'none',
                background: selectedTags.includes(tag) ? '#e0e7ff' : ''
              }}>
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => toggleTag(tag)}
                  style={{ margin: 0 }}
                />
                {tag.toUpperCase()}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <input
              type="text"
              value={newTag}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTag(e.target.value)}
              placeholder={t('newTagPlaceholder') as string}
              style={{ flex: 1, padding: '6px 8px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '11px' }}
              onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && addCustomTag()}
            />
            <button
              type="button"
              onClick={addCustomTag}
              style={{ padding: '6px 10px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
            >+</button>
          </div>
          <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>{t('catTagHint')}</div>
        </div>
        <div className="modal-buttons">
          {isEditing && (
            <button className="delete-btn" onClick={handleDelete}>{t('deleteBtn')}</button>
          )}
          <button onClick={onClose}>{t('cancelBtn')}</button>
          <button className="save-btn" onClick={handleSave}>{t('saveBtnLabel')}</button>
        </div>
      </div>
    </div>
  );
}
