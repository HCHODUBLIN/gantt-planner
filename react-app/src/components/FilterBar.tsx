import React from 'react';
import { useData } from '../contexts/DataContext';
import { useI18n } from '../contexts/I18nContext';

interface FilterBarProps {
  onOpenTagManage: () => void;
}

export default function FilterBar({ onOpenTagManage }: FilterBarProps) {
  const { currentFilter, toggleFilter, getAllTags } = useData();
  const { t } = useI18n();

  const tags = getAllTags();

  const statusFilters = [
    { key: 'all', label: t('filterAll') as string, style: {} },
    { key: 'active', label: t('filterActive') as string, style: { background: '#E9F3F7', color: '#487CA5', borderColor: '#D3E6EF' } },
    { key: 'pending', label: t('filterPending') as string, style: { background: '#F1F1EF', color: '#787774', borderColor: '#E9E9E7' } },
    { key: 'done', label: t('filterDone') as string, style: { background: '#EEF3ED', color: '#548164', borderColor: '#DEE9DD' } },
  ];

  const priorityFilters = [
    { key: 'p-urgent', label: 'URGENT', style: { background: '#FAECEC', color: '#C4554D', borderColor: '#F0D6D6' } },
    { key: 'p-high', label: 'HIGH', style: { background: '#F8ECDF', color: '#CC782F', borderColor: '#EDD9C8' } },
    { key: 'p-medium', label: 'MED', style: { background: '#FAF3DD', color: '#C29343', borderColor: '#EDE5C8' } },
    { key: 'p-low', label: 'LOW', style: { background: '#EEF3ED', color: '#548164', borderColor: '#DEE9DD' } },
  ];

  return (
    <div className="filter-bar">
      {statusFilters.map(f => (
        <button
          key={f.key}
          className={`filter-btn ${currentFilter.has(f.key) ? 'active' : ''}`}
          style={f.style}
          onClick={() => toggleFilter(f.key)}
        >
          {f.label}
        </button>
      ))}
      {tags.map(tag => (
        <button
          key={tag}
          className={`filter-btn ${currentFilter.has(tag) ? 'active' : ''}`}
          onClick={() => toggleFilter(tag)}
        >
          {tag.toUpperCase()}
        </button>
      ))}
      <button
        className="action-btn"
        onClick={onOpenTagManage}
        style={{ padding: '3px 7px', fontSize: '11px', marginLeft: '2px' }}
        title={t('tagManageTitle') as string}
      >
        ⚙️
      </button>
      <span style={{ color: '#ccc', margin: '0 4px' }}>|</span>
      {priorityFilters.map(f => (
        <button
          key={f.key}
          className={`filter-btn p-filter ${currentFilter.has(f.key) ? 'active' : ''}`}
          style={f.style}
          onClick={() => toggleFilter(f.key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
