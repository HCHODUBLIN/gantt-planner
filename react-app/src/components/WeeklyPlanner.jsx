import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useI18n } from '../contexts/I18nContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatDateKey, getWeekStart } from '../utils/dates';
import { loadWeeklyPlan, saveWeeklyPlan as persistWeeklyPlan, getWeekKey, saveToServer as saveToServerApi } from '../utils/storage';
import { taskClsColors } from '../utils/colors';
import ActionItemsPanel from './ActionItemsPanel';
import ToggleGroup from './ToggleGroup';

const PRIORITY_CLASSES = { urgent: 'priority-urgent', high: 'priority-high', medium: 'priority-medium', low: 'priority-low' };

export default function WeeklyPlanner() {
  const { allData, updateData } = useData();
  const { t, lang } = useI18n();
  const { isDark } = useTheme();

  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date(2026, 2, 23)));
  const [weeklyPlan, setWeeklyPlan] = useState({});
  const [allTasks, setAllTasks] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [routineConfig, setRoutineConfig] = useState(null);

  // Drag state
  const dragRef = useRef({ task: null, fromActionPanel: false, sourceSlot: null, idx: null });

  // Edit modal state
  const [editModal, setEditModal] = useState({ open: false, taskId: null, dayKey: null, period: null, index: null, note: '' });
  // Add modal state
  const [addModal, setAddModal] = useState({ open: false, dayKey: null, period: null });
  const [addForm, setAddForm] = useState({ name: '', priority: 'medium', category: 'c-action', note: '' });

  // Load tasks from data context
  useEffect(() => {
    if (!allData) return;
    const tasks = [];
    const actions = [];
    (allData.categories || []).forEach((cat, catIdx) => {
      const catTasks = (cat.tasks || []).filter(t => t.id);
      tasks.push(...catTasks);
      if (catIdx === 0 && cat.name?.includes('Action')) {
        actions.push(...catTasks.filter(t => t.status !== 'done'));
      }
    });
    setAllTasks(tasks);
    setActionItems(actions);
    setRoutineConfig(allData.routine || {});
  }, [allData]);

  // Load weekly plan when week changes
  useEffect(() => {
    if (!allData) return;
    const weekKey = getWeekKey(currentWeekStart);
    const stored = allData.weeklyPlans?.[weekKey] || loadWeeklyPlan(currentWeekStart);
    setWeeklyPlan(stored);
  }, [currentWeekStart, allData]);

  const saveWP = useCallback((plan) => {
    setWeeklyPlan(plan);
    persistWeeklyPlan(currentWeekStart, plan);
    // Also save to allData so it persists with tasks.json
    const weekKey = getWeekKey(currentWeekStart);
    updateData(prev => ({
      ...prev,
      weeklyPlans: { ...(prev.weeklyPlans || {}), [weekKey]: plan }
    }));
  }, [currentWeekStart, updateData]);

  const getTasksForSlot = useCallback((dayKey, period) => {
    if (!weeklyPlan[dayKey]) return [];
    if (!weeklyPlan[dayKey].tasks) return [];
    return weeklyPlan[dayKey].tasks[period] || [];
  }, [weeklyPlan]);

  // Drag handlers
  const handleActionDragStart = useCallback((taskId) => {
    dragRef.current = { task: { taskId }, fromActionPanel: true, sourceSlot: null, idx: null };
  }, []);

  const handleCardDragStart = useCallback((taskId, dayKey, period, idx) => {
    dragRef.current = { task: { taskId }, fromActionPanel: false, sourceSlot: { dayKey, period }, idx };
  }, []);

  const handleDropOnSlot = useCallback((dayKey, period) => {
    const { task, fromActionPanel, sourceSlot, idx } = dragRef.current;
    if (!task) return;

    const plan = JSON.parse(JSON.stringify(weeklyPlan));

    if (fromActionPanel) {
      if (!plan[dayKey]) plan[dayKey] = { tasks: {} };
      if (!plan[dayKey].tasks[period]) plan[dayKey].tasks[period] = [];
      const existing = plan[dayKey].tasks[period].find(t =>
        (typeof t === 'string' ? t : t.id) === task.taskId
      );
      if (!existing) {
        plan[dayKey].tasks[period].push(task.taskId);
      }
    } else if (sourceSlot) {
      // Move from one slot to another
      const fromTasks = plan[sourceSlot.dayKey]?.tasks?.[sourceSlot.period];
      if (fromTasks && idx < fromTasks.length) {
        const [moved] = fromTasks.splice(idx, 1);
        if (!plan[dayKey]) plan[dayKey] = { tasks: {} };
        if (!plan[dayKey].tasks[period]) plan[dayKey].tasks[period] = [];
        plan[dayKey].tasks[period].push(moved);
      }
    }

    saveWP(plan);
    dragRef.current = { task: null, fromActionPanel: false, sourceSlot: null, idx: null };
  }, [weeklyPlan, saveWP]);

  const handleDropReturn = useCallback((e) => {
    const { task, fromActionPanel, sourceSlot, idx } = dragRef.current;
    if (!task || fromActionPanel) return;
    if (sourceSlot) {
      const plan = JSON.parse(JSON.stringify(weeklyPlan));
      const tasks = plan[sourceSlot.dayKey]?.tasks?.[sourceSlot.period];
      if (tasks && idx < tasks.length) {
        tasks.splice(idx, 1);
        saveWP(plan);
      }
    }
    dragRef.current = { task: null, fromActionPanel: false, sourceSlot: null, idx: null };
  }, [weeklyPlan, saveWP]);

  const removeTaskFromSlot = useCallback((dayKey, period, idx) => {
    const plan = JSON.parse(JSON.stringify(weeklyPlan));
    const tasks = plan[dayKey]?.tasks?.[period];
    if (tasks) {
      tasks.splice(idx, 1);
      saveWP(plan);
    }
  }, [weeklyPlan, saveWP]);

  // Edit modal
  const openEditModal = useCallback((taskId, dayKey, period, idx, note) => {
    setEditModal({ open: true, taskId, dayKey, period, index: idx, note: note || '' });
  }, []);

  const saveEditedTask = useCallback(() => {
    const { dayKey, period, index } = editModal;
    const plan = JSON.parse(JSON.stringify(weeklyPlan));
    const tasks = plan[dayKey]?.tasks?.[period];
    if (tasks && index < tasks.length) {
      if (typeof tasks[index] === 'string') {
        tasks[index] = { id: tasks[index], note: editModal.note };
      } else {
        tasks[index] = { ...tasks[index], note: editModal.note };
      }
    }
    saveWP(plan);
    setEditModal({ open: false, taskId: null, dayKey: null, period: null, index: null, note: '' });
  }, [editModal, weeklyPlan, saveWP]);

  // Add modal
  const openAddModal = useCallback((dayKey, period) => {
    setAddForm({ name: '', priority: 'medium', category: 'c-action', note: '' });
    setAddModal({ open: true, dayKey, period });
  }, []);

  const addNewTask = useCallback(() => {
    if (!addForm.name.trim()) { alert(t('enterTaskName')); return; }
    const newTask = {
      id: `manual-${Date.now()}`,
      name: addForm.name.trim(),
      priority: addForm.priority,
      cls: addForm.category,
      status: 'progress',
      start: addModal.dayKey,
      end: addModal.dayKey
    };
    setAllTasks(prev => [...prev, newTask]);
    const plan = JSON.parse(JSON.stringify(weeklyPlan));
    if (!plan[addModal.dayKey]) plan[addModal.dayKey] = { tasks: {} };
    if (!plan[addModal.dayKey].tasks[addModal.period]) plan[addModal.dayKey].tasks[addModal.period] = [];
    plan[addModal.dayKey].tasks[addModal.period].push({ id: newTask.id, note: addForm.note });
    saveWP(plan);
    setAddModal({ open: false, dayKey: null, period: null });
  }, [addForm, addModal, weeklyPlan, saveWP, t]);

  // Day note
  const editDayNote = useCallback((dayKey) => {
    const currentNote = weeklyPlan[dayKey]?.note || '';
    const newNote = prompt(t('notePrompt'), currentNote.trim());
    if (newNote !== null) {
      const plan = JSON.parse(JSON.stringify(weeklyPlan));
      if (!plan[dayKey]) plan[dayKey] = { tasks: {} };
      plan[dayKey].note = newNote;
      saveWP(plan);
    }
  }, [weeklyPlan, saveWP, t]);

  // Week navigation
  const goToCurrentWeek = () => setCurrentWeekStart(getWeekStart(new Date(2026, 2, 23)));
  const goToPreviousWeek = () => setCurrentWeekStart(prev => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000));
  const goToNextWeek = () => setCurrentWeekStart(prev => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000));

  // Focus & training info
  const focusProject = (() => {
    const endDate = formatDateKey(new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000));
    const startDate = formatDateKey(currentWeekStart);
    const urgent = allTasks.filter(t => {
      const inWeek = t.start <= endDate && t.end >= startDate;
      return inWeek && ['urgent', 'high'].includes(t.priority) && (t.cls === 'c-proj' || t.cls === 'c-action');
    });
    return urgent.length > 0 ? urgent[0].name : t('noFocus');
  })();

  const currentTraining = (() => {
    const endDate = formatDateKey(new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000));
    const startDate = formatDateKey(currentWeekStart);
    const courses = allTasks.filter(t => {
      const inWeek = t.start <= endDate && t.end >= startDate;
      return inWeek && t.priority === 'urgent' && (t.cls === 'c-course' || t.cls === 'c-zoomcamp');
    });
    return courses.length > 0 ? courses[0].name : 'Leetcode SQL';
  })();

  // Save to server
  const [saveStatus, setSaveStatus] = useState(null);
  const handleSave = async () => {
    const saved = localStorage.getItem('gantt-data');
    if (!saved) { alert(t('noData')); return; }
    setSaveStatus('saving');
    try {
      await saveToServerApi(JSON.parse(saved));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 1500);
    } catch {
      // Server not available (e.g. GitHub Pages) — data is already in localStorage
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 1500);
    }
  };

  // Export markdown
  const exportMarkdown = () => {
    const isEn = lang === 'en';
    const dayNames = t('days');
    let md = `# ${isEn ? 'Weekly Planner' : '주간 플래너'} ${formatDateKey(currentWeekStart)} ~ ${formatDateKey(new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000))}\n\n`;
    md += `## 🎯 ${isEn ? 'This Week' : '이번주 핵심'}\n`;
    md += `- **${isEn ? 'Focus Project' : '핵심 프로젝트'}**: ${focusProject}\n`;
    md += `- **${isEn ? 'Current Training' : '현재 학습'}**: ${currentTraining}\n`;
    md += `- **${isEn ? 'Goal' : '목표'}**: ${routineConfig?.exercise || t('defaultGoal')}\n\n`;

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      const dayKey = formatDateKey(date);
      md += `### ${dayNames[i]} (${date.getMonth() + 1}/${date.getDate()})\n`;
      if (i === 5) { md += `**${t('rest')}** 😴\n\n`; continue; }
      if (i === 6) {
        md += `#### 📚 ${t('study')}\n`;
        const tasks = getTasksForSlot(dayKey, 'full-day');
        tasks.forEach(tid => {
          const id = typeof tid === 'string' ? tid : tid.id;
          const task = allTasks.find(x => x.id === id);
          if (task) md += `- ${task.name} (${task.priority})\n`;
        });
        md += '\n'; continue;
      }
      const blocks = routineConfig?.blocks || [
        { key: 'morning', emoji: '🌅', label: t('morning'), hours: '09-12' },
        { key: 'afternoon', emoji: '☀️', label: t('afternoon'), hours: '13-17' },
        { key: 'evening', emoji: '🌙', label: t('evening'), hours: '18-19' },
      ];
      blocks.forEach(b => {
        const tasks = getTasksForSlot(dayKey, b.key);
        if (tasks.length > 0) {
          md += `#### ${b.emoji} ${b.label} (${b.hours})\n`;
          tasks.forEach(tid => {
            const id = typeof tid === 'string' ? tid : tid.id;
            const task = allTasks.find(x => x.id === id);
            if (task) md += `- ${task.name} (${task.priority})\n`;
          });
        }
      });
      const note = weeklyPlan[dayKey]?.note;
      if (note) md += `**📝 ${isEn ? 'Note' : '노트'}**: ${note}\n`;
      md += '\n';
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-planner-${formatDateKey(currentWeekStart)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!allData) return <div style={{ padding: '24px' }}>Loading...</div>;

  const routine = routineConfig || {};
  const blocks = routine.blocks || [
    { key: 'morning', emoji: '🌅', label: t('morning'), hours: '09-12', desc: '' },
    { key: 'afternoon', emoji: '☀️', label: t('afternoon'), hours: '13-17', desc: '' },
    { key: 'evening', emoji: '🌙', label: t('evening'), hours: '18-19', desc: '' },
  ];
  const dayNames = t('days');

  const saveBtnText = saveStatus === 'saved' ? '✅ Saved' : saveStatus === 'saving' ? '⏳' : saveStatus === 'error' ? '❌ Error' : '💾 ' + t('save');

  return (
    <div className="weekly-container">
      <header className="weekly-header">
        <div className="header-top">
          <div className="header-title">{t('weeklyTitle')}</div>
          <div className="nav-links">
            <Link to="/" className="nav-link">{t('backToGantt')}</Link>
            <ToggleGroup />
          </div>
        </div>

        <div className="header-info">
          <div className="info-block">
            <div className="info-label">{t('focusLabel')}</div>
            <div className="info-value">{focusProject}</div>
          </div>
          <div className="info-block">
            <div className="info-label">{t('trainingLabel')}</div>
            <div className="info-value">{currentTraining}</div>
          </div>
          <div className="info-block">
            <div className="info-label">{t('goalLabel')}</div>
            <div className="info-value">{routine.exercise || t('defaultGoal')}</div>
          </div>
        </div>

        <div className="controls">
          <div className="week-selector">
            <label>{t('weekLabel')}</label>
            <input
              type="date"
              value={formatDateKey(currentWeekStart)}
              onChange={e => setCurrentWeekStart(getWeekStart(new Date(e.target.value)))}
            />
          </div>
          <button onClick={goToCurrentWeek}>{t('thisWeek')}</button>
          <button onClick={goToPreviousWeek}>{t('prevWeek')}</button>
          <button onClick={goToNextWeek}>{t('nextWeek')}</button>
          <button className="save-btn" onClick={handleSave} style={{ background: '#548164', color: '#fff', borderColor: '#548164' }}>
            {saveBtnText}
          </button>
          <button className="export-btn" onClick={exportMarkdown}>{t('exportMd')}</button>
        </div>
      </header>

      <ActionItemsPanel
        actionItems={actionItems}
        onDragStart={handleActionDragStart}
        onDropReturn={handleDropReturn}
      />

      <div className="planner-wrapper">
        <div className="week-grid">
          <div className="days-grid">
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date(currentWeekStart);
              date.setDate(date.getDate() + i);
              const dayKey = formatDateKey(date);

              return (
                <div key={i} className={`day-column${i === 5 ? ' saturday' : ''}${i === 6 ? ' sunday study-day' : ''}`}>
                  <div className="day-header">
                    <span className="day-name">{dayNames[i]}</span>
                    <span className="day-date">{date.getMonth() + 1}/{date.getDate()}</span>
                  </div>

                  {i === 5 ? (
                    <div className="rest-day time-block">
                      <div style={{ fontSize: '24px' }}>😴</div>
                      <div>{routine.saturday || t('rest')}</div>
                    </div>
                  ) : i === 6 ? (
                    <TimeBlock
                      dayKey={dayKey}
                      period="full-day"
                      label={`📚 ${routine.sunday || t('study')}`}
                      className="time-block"
                      style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' }}
                      tasks={getTasksForSlot(dayKey, 'full-day')}
                      allTasks={allTasks}
                      onDrop={handleDropOnSlot}
                      onRemove={removeTaskFromSlot}
                      onCardDragStart={handleCardDragStart}
                      onCardClick={openEditModal}
                      onBlockClick={openAddModal}
                      t={t}
                      lang={lang}
                    />
                  ) : (
                    <div className="time-blocks-wrapper">
                      {blocks.map(b => (
                        <TimeBlock
                          key={b.key}
                          dayKey={dayKey}
                          period={b.key}
                          label={`${b.emoji} ${lang === 'en' ? (b.labelEn || b.label) : b.label} (${b.hours})`}
                          className={`time-block ${b.key}`}
                          tasks={getTasksForSlot(dayKey, b.key)}
                          allTasks={allTasks}
                          onDrop={handleDropOnSlot}
                          onRemove={removeTaskFromSlot}
                          onCardDragStart={handleCardDragStart}
                          onCardClick={openEditModal}
                          onBlockClick={openAddModal}
                          t={t}
                          lang={lang}
                        />
                      ))}
                    </div>
                  )}

                  <div
                    className={`day-note${weeklyPlan[dayKey]?.note ? ' has-content' : ''}`}
                    onClick={() => editDayNote(dayKey)}
                  >
                    {weeklyPlan[dayKey]?.note || ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editModal.open && (
        <div className="modal-overlay active" onClick={e => e.target === e.currentTarget && setEditModal({ ...editModal, open: false })}>
          <div className="modal">
            <div className="modal-title">{t('editTitle')}</div>
            <div className="form-group">
              <label className="form-label">{t('taskName')}</label>
              <input
                type="text"
                className="form-control"
                value={allTasks.find(t2 => t2.id === editModal.taskId)?.name || ''}
                readOnly
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('memo')}</label>
              <textarea
                className="form-control"
                value={editModal.note}
                onChange={e => setEditModal(prev => ({ ...prev, note: e.target.value }))}
              />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setEditModal({ ...editModal, open: false })}>{t('cancel')}</button>
              <button className="btn-primary" onClick={saveEditedTask}>{t('save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {addModal.open && (
        <div className="modal-overlay active" onClick={e => e.target === e.currentTarget && setAddModal({ ...addModal, open: false })}>
          <div className="modal">
            <div className="modal-title">{t('addTitle')}</div>
            <div className="form-group">
              <label className="form-label">{t('taskName')}</label>
              <input
                type="text"
                className="form-control"
                value={addForm.name}
                onChange={e => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('taskPlaceholder')}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('priority')}</label>
              <select className="form-control" value={addForm.priority} onChange={e => setAddForm(prev => ({ ...prev, priority: e.target.value }))}>
                <option value="medium">{t('medium')}</option>
                <option value="high">{t('high')}</option>
                <option value="urgent">{t('urgent')}</option>
                <option value="low">{t('low')}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('category')}</label>
              <select className="form-control" value={addForm.category} onChange={e => setAddForm(prev => ({ ...prev, category: e.target.value }))}>
                <option value="c-action">{t('action')}</option>
                <option value="c-proj">{t('project')}</option>
                <option value="c-course">{t('course')}</option>
                <option value="c-misc">{t('misc')}</option>
                <option value="c-life">{t('lifestyle')}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('memo')}</label>
              <textarea
                className="form-control"
                value={addForm.note}
                onChange={e => setAddForm(prev => ({ ...prev, note: e.target.value }))}
                placeholder={t('memoPlaceholder')}
              />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setAddModal({ ...addModal, open: false })}>{t('cancel')}</button>
              <button className="btn-primary" onClick={addNewTask}>{t('add')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TimeBlock({ dayKey, period, label, className, style, tasks, allTasks, onDrop, onRemove, onCardDragStart, onCardClick, onBlockClick, t, lang }) {
  const PRIORITY_LABELS_LOCAL = { urgent: t('urgent'), high: t('high'), medium: t('medium'), low: t('low') };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.style.outline = '2px dashed var(--accent)';
  };

  const handleDragLeave = (e) => {
    e.currentTarget.style.outline = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.outline = '';
    onDrop(dayKey, period);
  };

  const handleBlockClick = (e) => {
    if (e.target === e.currentTarget || e.target.classList.contains('time-label') || e.target.classList.contains('empty-state')) {
      onBlockClick(dayKey, period);
    }
  };

  return (
    <div
      className={className}
      style={style}
      onClick={handleBlockClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="time-label">{label}</div>
      <div
        className="tasks-container"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {tasks.length === 0 ? (
          <div className="empty-state">{t('emptySlot')}</div>
        ) : (
          tasks.map((taskIdOrObj, idx) => {
            const taskId = typeof taskIdOrObj === 'string' ? taskIdOrObj : taskIdOrObj.id;
            const taskNote = typeof taskIdOrObj === 'object' ? taskIdOrObj.note : '';
            const task = allTasks.find(t2 => t2.id === taskId);
            if (!task) return null;

            const borderColor = taskClsColors[task.cls] || taskClsColors['c-default'];

            return (
              <div
                key={`${taskId}-${idx}`}
                className="task-card"
                style={{ borderLeft: `3px solid ${borderColor}` }}
                draggable
                onDragStart={() => onCardDragStart(taskId, dayKey, period, idx)}
                onClick={(e) => {
                  if (!e.target.closest('.task-remove-btn')) {
                    onCardClick(taskId, dayKey, period, idx, taskNote);
                  }
                }}
              >
                <button
                  className="task-remove-btn"
                  title={t('remove')}
                  onClick={e => { e.stopPropagation(); onRemove(dayKey, period, idx); }}
                >
                  ✕
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className={`task-priority ${PRIORITY_CLASSES[task.priority]}`}>
                    {PRIORITY_LABELS_LOCAL[task.priority]}
                  </span>
                </div>
                <div className="task-name">{task.name}</div>
                {taskNote && (
                  <div style={{ fontSize: '9px', color: '#666', marginTop: '3px', fontStyle: 'italic' }}>
                    📝 {taskNote}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
