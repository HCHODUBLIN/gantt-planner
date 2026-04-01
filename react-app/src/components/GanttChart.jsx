import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useI18n } from '../contexts/I18nContext';
import { useTheme } from '../contexts/ThemeContext';
import { getCategoryColor } from '../utils/colors';
import { dateToCol, colToDate, COLS, TODAY_COL, buildMonthWeekHeaders } from '../utils/dates';
import { saveToServer as saveToServerApi } from '../utils/storage';
import { getSessionPin as getSessionPinFn, getGitHubToken as getGitHubTokenFn, saveToGitHub as saveToGitHubFn } from '../utils/crypto';
import FilterBar from './FilterBar';
import TaskModal from './TaskModal';
import CategoryModal from './CategoryModal';
import TagManageModal from './TagManageModal';
import RoutineSection from './RoutineSection';
import RoutineModal from './RoutineModal';
import ToggleGroup from './ToggleGroup';

const PRIORITY_MAP = { urgent: 'p-urgent', high: 'p-high', medium: 'p-medium', low: 'p-low' };
const PRIORITY_LABEL = { urgent: 'URGENT', high: 'HIGH', medium: 'MED', low: 'LOW' };
const STATUS_CLASS = { done: 's-done', progress: 's-progress', pending: 's-pending' };
const PRIORITY_CYCLE = { low: 'medium', medium: 'high', high: 'urgent', urgent: 'low' };
const STATUS_CYCLE = { pending: 'progress', progress: 'done', done: 'pending' };

export default function GanttChart() {
  const { allData, updateData, currentFilter, isActionItems, resetData, saveStatus, setSaveStatus, isPrivate } = useData();
  const { t, lang } = useI18n();
  const { isDark } = useTheme();

  // Modals
  const [taskModal, setTaskModal] = useState({ open: false, task: null, isNew: false, catIdx: null });
  const [catModal, setCatModal] = useState({ open: false, catIdx: null });
  const [tagManageOpen, setTagManageOpen] = useState(false);
  const [routineModalOpen, setRoutineModalOpen] = useState(false);

  // Drag state
  const dragRef = useRef(null);
  const dragMovedRef = useRef(false);
  const [, forceUpdate] = useState(0);

  // Headers (computed once)
  const { monthHeaders, weeks } = buildMonthWeekHeaders();

  // Drag handlers for bars
  const getColFromX = useCallback((x) => {
    const firstRow = document.querySelector('#gantt-body tr:not(.category-row):not(.section-divider)');
    if (!firstRow) return 0;
    const barCells = firstRow.querySelectorAll('td.bar-cell');
    for (let i = 0; i < barCells.length; i++) {
      const rect = barCells[i].getBoundingClientRect();
      if (x >= rect.left && x <= rect.right) return i;
    }
    if (barCells.length > 0) {
      const firstRect = barCells[0].getBoundingClientRect();
      if (x < firstRect.left) return 0;
    }
    return barCells.length - 1;
  }, []);

  const startDrag = useCallback((e, task, mode) => {
    e.preventDefault();
    dragMovedRef.current = false;
    const startCol = dateToCol(task.start);
    const endCol = dateToCol(task.end);
    dragRef.current = { task, mode, origStart: startCol, origEnd: endCol, originX: e.clientX };
    document.body.style.cursor = mode === 'move' ? 'grabbing' : 'ew-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragRef.current) return;
      const col = getColFromX(e.clientX);
      const { task, mode, origStart, origEnd } = dragRef.current;
      dragMovedRef.current = true;

      if (mode === 'start') {
        const newStart = Math.min(col, origEnd);
        task.start = colToDate(Math.max(0, newStart));
      } else if (mode === 'end') {
        const newEnd = Math.max(col, origStart);
        task.end = colToDate(Math.min(COLS - 1, newEnd));
      } else if (mode === 'move') {
        const delta = col - getColFromX(dragRef.current.originX);
        const newStart = origStart + delta;
        const newEnd = origEnd + delta;
        if (newStart >= 0 && newEnd < COLS) {
          task.start = colToDate(newStart);
          task.end = colToDate(newEnd);
        }
      }
      forceUpdate(n => n + 1);
    };

    const handleMouseUp = () => {
      if (dragRef.current) {
        if (dragMovedRef.current) {
          updateData(prev => ({ ...prev }));
        }
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        dragRef.current = null;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [getColFromX, updateData]);

  // Task operations (declared before handlers that use them)
  const moveTaskToCategory = useCallback((taskId, fromCatIdx, toCatIdx) => {
    if (fromCatIdx === toCatIdx) return;
    updateData(prev => {
      const next = { ...prev, categories: prev.categories.map(c => ({ ...c, tasks: [...c.tasks] })) };
      const fromCat = next.categories[fromCatIdx];
      const toCat = next.categories[toCatIdx];
      if (!fromCat || !toCat) return prev;
      const taskIdx = fromCat.tasks.findIndex(t => t.id === taskId);
      if (taskIdx < 0) return prev;
      const [task] = fromCat.tasks.splice(taskIdx, 1);
      const toIsAction = toCat.name && toCat.name.includes('Action Items');
      const fromIsAction = fromCat.name && fromCat.name.includes('Action Items');
      if (toIsAction && !fromIsAction) {
        task._originCat = fromCat.name;
        task._originCatIdx = fromCatIdx;
      }
      if (!toIsAction && task._originCat) {
        delete task._originCat;
        delete task._originCatIdx;
      }
      toCat.tasks.push(task);
      return next;
    });
  }, [updateData]);

  const reorderTask = useCallback((taskId, fromCatIdx, toCatIdx, targetTaskIdx, above) => {
    updateData(prev => {
      const next = { ...prev, categories: prev.categories.map(c => ({ ...c, tasks: [...c.tasks] })) };
      const fromCat = next.categories[fromCatIdx];
      if (!fromCat) return prev;
      const srcIdx = fromCat.tasks.findIndex(t => t.id === taskId);
      if (srcIdx < 0) return prev;
      const [task] = fromCat.tasks.splice(srcIdx, 1);
      const toCat = next.categories[toCatIdx];
      const toIsAction = toCat.name && toCat.name.includes('Action Items');
      const fromIsAction = fromCat.name && fromCat.name.includes('Action Items');
      if (toIsAction && !fromIsAction) {
        task._originCat = fromCat.name;
        task._originCatIdx = fromCatIdx;
      }
      if (!toIsAction && task._originCat) {
        delete task._originCat;
        delete task._originCatIdx;
      }
      let insertIdx = targetTaskIdx;
      if (fromCatIdx === toCatIdx && srcIdx < targetTaskIdx) insertIdx--;
      if (!above) insertIdx++;
      toCat.tasks.splice(insertIdx, 0, task);
      return next;
    });
  }, [updateData]);

  // Task row drag and drop (declared after moveTaskToCategory and reorderTask)
  const handleTaskDragStart = useCallback((e, taskId, catIdx) => {
    if (dragRef.current) { e.preventDefault(); return; }
    e.dataTransfer.setData('text/plain', JSON.stringify({ taskId, fromCatIdx: catIdx }));
  }, []);

  const handleCategoryDrop = useCallback((e, toCatIdx) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.taskId && data.fromCatIdx !== undefined) {
        moveTaskToCategory(data.taskId, data.fromCatIdx, toCatIdx);
      }
    } catch {}
  }, [moveTaskToCategory]);

  const handleTaskDrop = useCallback((e, toCatIdx, toTaskIdx) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (!data.taskId) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const above = e.clientY < rect.top + rect.height / 2;
      reorderTask(data.taskId, data.fromCatIdx, toCatIdx, toTaskIdx, above);
    } catch {}
  }, [reorderTask]);

  const moveTaskToActionItems = useCallback((task, fromCatIdx) => {
    if (!allData) return;
    const actionIdx = allData.categories.findIndex((c) => c.name && c.name.includes('Action Items'));
    if (actionIdx < 0 || actionIdx === fromCatIdx) return;
    moveTaskToCategory(task.id, fromCatIdx, actionIdx);
  }, [allData, moveTaskToCategory]);

  const returnToOrigin = useCallback((task, currentCatIdx) => {
    if (!task._originCat || !allData) return false;
    const originIdx = allData.categories.findIndex(c => c.name === task._originCat);
    if (originIdx < 0 || originIdx === currentCatIdx) return false;
    return true; // Caller handles the actual move in updateData
  }, [allData]);

  const unpinFromAction = useCallback((catIdx, taskIdx) => {
    updateData(prev => {
      const next = { ...prev, categories: prev.categories.map(c => ({ ...c, tasks: [...c.tasks.map(t => ({ ...t }))] })) };
      const task = next.categories[catIdx].tasks[taskIdx];
      if (!task._originCat) return next;
      const originIdx = next.categories.findIndex(c => c.name === task._originCat);
      if (originIdx >= 0 && originIdx !== catIdx) {
        const [removed] = next.categories[catIdx].tasks.splice(taskIdx, 1);
        delete removed._originCat;
        delete removed._originCatIdx;
        next.categories[originIdx].tasks.push(removed);
      }
      return next;
    });
  }, [updateData]);

  const cyclePriority = useCallback((catIdx, taskIdx) => {
    updateData(prev => {
      const next = { ...prev, categories: prev.categories.map(c => ({ ...c, tasks: [...c.tasks.map(t => ({ ...t }))] })) };
      const task = next.categories[catIdx].tasks[taskIdx];
      task.priority = PRIORITY_CYCLE[task.priority];
      return next;
    });
  }, [updateData]);

  const cycleStatus = useCallback((catIdx, taskIdx) => {
    updateData(prev => {
      const next = { ...prev, categories: prev.categories.map(c => ({ ...c, tasks: [...c.tasks.map(t => ({ ...t }))] })) };
      const task = next.categories[catIdx].tasks[taskIdx];
      task.status = STATUS_CYCLE[task.status];
      // Auto-return to origin when done in Action Items
      if (task.status === 'done' && task._originCat && next.categories[catIdx].name?.includes('Action Items')) {
        const originIdx = next.categories.findIndex(c => c.name === task._originCat);
        if (originIdx >= 0 && originIdx !== catIdx) {
          const [removed] = next.categories[catIdx].tasks.splice(taskIdx, 1);
          delete removed._originCat;
          delete removed._originCatIdx;
          next.categories[originIdx].tasks.push(removed);
        }
      }
      return next;
    });
  }, [updateData]);

  const moveCategoryUp = useCallback((catIdx) => {
    if (catIdx <= 0) return;
    updateData(prev => {
      const next = { ...prev, categories: [...prev.categories] };
      [next.categories[catIdx - 1], next.categories[catIdx]] = [next.categories[catIdx], next.categories[catIdx - 1]];
      return next;
    });
  }, [updateData]);

  const moveCategoryDown = useCallback((catIdx) => {
    updateData(prev => {
      const next = { ...prev, categories: [...prev.categories] };
      if (catIdx >= next.categories.length - 1) return prev;
      [next.categories[catIdx], next.categories[catIdx + 1]] = [next.categories[catIdx + 1], next.categories[catIdx]];
      return next;
    });
  }, [updateData]);

  // Save / Export / Reset
  const handleSave = async () => {
    try {
      setSaveStatus('saving');
      // Try server first (local dev)
      await saveToServerApi(allData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 1500);
    } catch {
      // Server not available — try GitHub API if private mode
      if (isPrivate && getSessionPinFn() && getGitHubTokenFn()) {
        try {
          await saveToGitHubFn(allData, getSessionPinFn());
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus(null), 1500);
        } catch (e) {
          setSaveStatus('error');
          setTimeout(() => setSaveStatus(null), 2000);
        }
      } else {
        // Just localStorage
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 1500);
      }
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (confirm(t('confirmReset'))) {
      resetData();
    }
  };

  // Task modal handlers
  const openEditModal = useCallback((task, catIdx) => {
    if (dragMovedRef.current) return;
    setTaskModal({ open: true, task, isNew: false, catIdx });
  }, []);

  const openAddTaskModal = useCallback((catIdx) => {
    setTaskModal({ open: true, task: null, isNew: true, catIdx });
  }, []);

  const handleTaskSave = useCallback((data) => {
    if (taskModal.isNew) {
      updateData(prev => {
        const next = { ...prev, categories: prev.categories.map(c => ({ ...c, tasks: [...c.tasks] })) };
        next.categories[taskModal.catIdx].tasks.push({
          id: 'task_' + Date.now(),
          ...data,
          cls: 'c-default'
        });
        return next;
      });
    } else {
      updateData(prev => {
        const next = { ...prev, categories: prev.categories.map(c => ({
          ...c,
          tasks: c.tasks.map(t => t.id === taskModal.task.id ? { ...t, ...data } : { ...t })
        }))};
        return next;
      });
    }
    setTaskModal({ open: false, task: null, isNew: false, catIdx: null });
  }, [taskModal, updateData]);

  const handleTaskDelete = useCallback(() => {
    if (!taskModal.task) return;
    updateData(prev => {
      const next = { ...prev, categories: prev.categories.map(c => ({
        ...c,
        tasks: c.tasks.filter(t => t.id !== taskModal.task.id)
      }))};
      return next;
    });
    setTaskModal({ open: false, task: null, isNew: false, catIdx: null });
  }, [taskModal, updateData]);

  // Filter logic for rendering categories/tasks
  const getFilteredData = useCallback(() => {
    if (!allData) return [];
    const categories = allData.categories || [];
    const filters = currentFilter;
    const hasAll = filters.has('all');
    const specialFilters = ['all', 'active', 'pending', 'done', 'p-urgent', 'p-high', 'p-medium', 'p-low'];
    const tagFilters = [...filters].filter(f => !specialFilters.includes(f));
    const statusFilters = [...filters].filter(f => ['active', 'pending', 'done'].includes(f));
    const priorityMapFilter = { 'p-urgent': 'urgent', 'p-high': 'high', 'p-medium': 'medium', 'p-low': 'low' };
    const priorityFilters = [...filters].filter(f => priorityMapFilter[f]).map(f => priorityMapFilter[f]);

    return categories.map((cat, catIdx) => {
      const tags = cat.tags || [];
      if (tags.some(tag => tag.startsWith('divider'))) {
        if (!hasAll && statusFilters.length === 0 && priorityFilters.length === 0) return null;
        return { type: 'divider', catIdx };
      }
      if (tagFilters.length > 0 && !tagFilters.some(f => tags.includes(f))) return null;
      let tasks = cat.tasks || [];
      if (statusFilters.length > 0) {
        const statusMap = { active: 'progress', pending: 'pending', done: 'done' };
        const statuses = statusFilters.map(f => statusMap[f]);
        tasks = tasks.filter(t => statuses.includes(t.status));
        if (tasks.length === 0) return null;
      }
      if (priorityFilters.length > 0) {
        tasks = tasks.filter(t => priorityFilters.includes(t.priority));
        if (tasks.length === 0) return null;
      }
      return { type: 'category', cat, catIdx, tasks };
    }).filter(Boolean);
  }, [allData, currentFilter]);

  const todayCol = TODAY_COL;
  const tableRef = useRef(null);

  const containerRef = useRef(null);

  if (!allData) return <div style={{ padding: '24px' }}>Loading...</div>;

  const filteredData = getFilteredData();

  const saveLabel = saveStatus === 'saved' ? (lang === 'ko' ? '✅ 저장 완료!' : '✅ Saved!')
    : saveStatus === 'saving' ? '⏳...'
    : t('saveBtn');

  return (
    <div style={{ padding: '24px' }}>
      <ToggleGroup />

      <h1>{t('title')}</h1>
      <p className="subtitle">
        {t('subtitle')} | Updated: {allData.updated || ''}
      </p>

      <div className="filter-bar">
        <FilterBar onOpenTagManage={() => setTagManageOpen(true)} />
        <Link to="/weekly" className="action-btn weekly" style={{ marginLeft: 'auto' }}>
          {t('weeklyBtn')}
        </Link>
        <button className="action-btn" onClick={() => setCatModal({ open: true, catIdx: null })} style={{ background: '#8A67AB', color: '#fff', borderColor: '#8A67AB' }}>
          {t('addCatBtn')}
        </button>
        <button className="action-btn save" onClick={handleSave} style={saveStatus === 'saved' ? { background: '#059669' } : {}}>
          {saveLabel}
        </button>
        <button className="action-btn export" onClick={handleExport}>{t('exportBtn')}</button>
        <button className="action-btn reset" onClick={handleReset}>{t('resetBtn')}</button>
      </div>

      <div className="gantt-container" ref={containerRef}>
        <table id="gantt" ref={tableRef}>
          <thead>
            <tr>
              <th>{t('thTask')}</th>
              <th>{t('thStatus')}</th>
              {monthHeaders.map((m, i) => (
                <th key={i} className="month" colSpan={m.count}>{m.name}</th>
              ))}
            </tr>
            <tr className="week-markers">
              <th></th>
              <th></th>
              {weeks.map((w, i) => (
                <th key={i} style={i === todayCol ? { color: '#dc2626', fontWeight: '700' } : i === 0 ? { color: '#dc2626' } : {}}>
                  {w.date}
                </th>
              ))}
            </tr>
          </thead>
          <tbody id="gantt-body">
            {filteredData.map((item) => {
              if (item.type === 'divider') {
                return (
                  <tr key={`div-${item.catIdx}`} className="section-divider">
                    <td colSpan={COLS + 2}></td>
                  </tr>
                );
              }

              const { cat, catIdx, tasks } = item;
              return (
                <CategoryBlock
                  key={`cat-${catIdx}`}
                  cat={cat}
                  catIdx={catIdx}
                  tasks={tasks}
                  isDark={isDark}
                  lang={lang}
                  todayCol={todayCol}
                  isActionItems={isActionItems}
                  onCategoryDrop={handleCategoryDrop}
                  onTaskDrop={handleTaskDrop}
                  onTaskDragStart={handleTaskDragStart}
                  onAddTask={openAddTaskModal}
                  onEditCategory={(idx) => setCatModal({ open: true, catIdx: idx })}
                  onMoveCategoryUp={moveCategoryUp}
                  onMoveCategoryDown={moveCategoryDown}
                  onEditTask={openEditModal}
                  onCyclePriority={cyclePriority}
                  onCycleStatus={cycleStatus}
                  onPinToAction={moveTaskToActionItems}
                  onUnpinFromAction={unpinFromAction}
                  startDrag={startDrag}
                  t={t}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      <RoutineSection onEditRoutine={() => setRoutineModalOpen(true)} />

      <TaskModal
        isOpen={taskModal.open}
        task={taskModal.task}
        isNew={taskModal.isNew}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
        onClose={() => setTaskModal({ open: false, task: null, isNew: false, catIdx: null })}
      />
      <CategoryModal
        isOpen={catModal.open}
        catIdx={catModal.catIdx}
        onClose={() => setCatModal({ open: false, catIdx: null })}
      />
      <TagManageModal
        isOpen={tagManageOpen}
        onClose={() => setTagManageOpen(false)}
      />
      <RoutineModal
        isOpen={routineModalOpen}
        onClose={() => setRoutineModalOpen(false)}
      />
    </div>
  );
}

// Sub-component for category + its tasks
function CategoryBlock({
  cat, catIdx, tasks, isDark, lang, todayCol,
  isActionItems, onCategoryDrop, onTaskDrop, onTaskDragStart,
  onAddTask, onEditCategory, onMoveCategoryUp, onMoveCategoryDown,
  onEditTask, onCyclePriority, onCycleStatus, onPinToAction, onUnpinFromAction,
  startDrag, t
}) {
  const catIsAction = isActionItems(catIdx);

  return (
    <>
      <tr
        className="category-row"
        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drop-target'); }}
        onDragLeave={e => e.currentTarget.classList.remove('drop-target')}
        onDrop={e => { e.currentTarget.classList.remove('drop-target'); onCategoryDrop(e, catIdx); }}
      >
        <td colSpan={COLS + 2}>
          {cat.name}
          <span className="cat-controls">
            <button className="cat-btn" title="Add Task" onClick={() => onAddTask(catIdx)}>➕</button>
            <button className="cat-btn" title="Edit" onClick={() => onEditCategory(catIdx)}>✏️</button>
            <button className="cat-btn" title="Move Up" onClick={() => onMoveCategoryUp(catIdx)}>⬆️</button>
            <button className="cat-btn" title="Move Down" onClick={() => onMoveCategoryDown(catIdx)}>⬇️</button>
          </span>
        </td>
      </tr>
      {tasks.map((task, taskIdx) => {
        const startCol = dateToCol(task.start);
        const endCol = dateToCol(task.end);
        const statusLabel = { done: t('statusDone'), progress: t('statusProgress'), pending: t('statusPending') };

        return (
          <tr
            key={task.id}
            className={task.status === 'done' ? 'completed-row' : ''}
            draggable
            onDragStart={e => onTaskDragStart(e, task.id, catIdx)}
            onDragOver={e => {
              e.preventDefault();
              const rect = e.currentTarget.getBoundingClientRect();
              const mid = rect.top + rect.height / 2;
              e.currentTarget.classList.remove('drop-above', 'drop-below');
              e.currentTarget.classList.add(e.clientY < mid ? 'drop-above' : 'drop-below');
            }}
            onDragLeave={e => e.currentTarget.classList.remove('drop-above', 'drop-below')}
            onDrop={e => { e.currentTarget.classList.remove('drop-above', 'drop-below'); onTaskDrop(e, catIdx, taskIdx); }}
          >
            <td>
              <span onClick={() => onEditTask(task, catIdx)} style={{ cursor: 'pointer' }}>
                {task.name}{' '}
                {task._originCat && catIsAction && (
                  <span style={{ fontSize: '9px', color: '#888', background: '#f3f4f6', padding: '1px 5px', borderRadius: '3px', marginLeft: '3px' }}>
                    ← {task._originCat.replace(/^[^\s]+\s/, '')}
                  </span>
                )}
              </span>
              <span
                className={`priority-tag ${PRIORITY_MAP[task.priority]}`}
                style={{ cursor: 'pointer' }}
                title={t('clickToChangePriority')}
                onClick={e => { e.stopPropagation(); onCyclePriority(catIdx, taskIdx); }}
              >
                {PRIORITY_LABEL[task.priority]}
              </span>
              {!catIsAction && (
                <button
                  className="pin-action-btn"
                  title={t('addToActionItems')}
                  onClick={e => { e.stopPropagation(); onPinToAction(task, catIdx); }}
                >
                  📌
                </button>
              )}
              {catIsAction && task._originCat && (
                <button
                  className="pin-action-btn"
                  title={lang === 'ko' ? '원래 카테고리로 되돌리기' : 'Return to original category'}
                  onClick={e => { e.stopPropagation(); onUnpinFromAction(catIdx, taskIdx); }}
                >
                  ↩️
                </button>
              )}
            </td>
            <td>
              <span
                className={`status-badge ${STATUS_CLASS[task.status]}`}
                style={{ cursor: 'pointer' }}
                title={t('clickToChangeStatus')}
                onClick={() => onCycleStatus(catIdx, taskIdx)}
              >
                {statusLabel[task.status]}
              </span>
            </td>
            {Array.from({ length: COLS }, (_, i) => {
              const isInBar = i >= startCol && i <= endCol;
              return (
                <td key={i} className={`bar-cell${i === todayCol ? ' today-col' : ''}`}>
                  {isInBar && (
                    <div
                      className="bar"
                      style={{
                        background: (task._originCatIdx !== undefined && catIsAction)
                          ? getCategoryColor(task._originCatIdx, isDark)
                          : getCategoryColor(catIdx, isDark),
                        height: '14px',
                        borderRadius: startCol === endCol ? '4px'
                          : i === startCol ? '4px 0 0 4px'
                          : i === endCol ? '0 4px 4px 0' : '0',
                        marginLeft: i === startCol && startCol !== endCol ? '1px' : undefined,
                        marginRight: i === endCol && startCol !== endCol ? '1px' : undefined,
                      }}
                      onMouseDown={e => {
                        if (!e.target.classList.contains('bar-handle')) startDrag(e, task, 'move');
                      }}
                      onClick={() => onEditTask(task, catIdx)}
                    >
                      {i === startCol && (
                        <>
                          <div className="tooltip">{task.tip || task.name}</div>
                          <div className="bar-handle left" onMouseDown={e => { e.stopPropagation(); startDrag(e, task, 'start'); }} />
                        </>
                      )}
                      {i === endCol && (
                        <div className="bar-handle right" onMouseDown={e => { e.stopPropagation(); startDrag(e, task, 'end'); }} />
                      )}
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        );
      })}
    </>
  );
}
