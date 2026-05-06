import { useState, useEffect, useMemo } from 'react';
import API from '../api/axios';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PROJECT_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#06b6d4', '#ef4444', '#84cc16', '#f97316', '#6366f1',
];

const STATUS_COLORS = {
  done: '#10b981',
  'in-progress': '#f59e0b',
  todo: '#94a3b8',
};

const STATUS_LABELS = {
  done: 'Done',
  'in-progress': 'In Progress',
  todo: 'To Do',
};

const PRIORITY_STYLES = {
  urgent: { bg: 'rgba(239,68,68,0.2)', color: '#ef4444' },
  high: { bg: 'rgba(249,115,22,0.15)', color: '#f97316' },
  medium: { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
  low: { bg: 'rgba(100,116,139,0.2)', color: '#94a3b8' },
};

const Calendar = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [mode, setMode] = useState('projects'); // 'projects' | 'tasks'
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, tRes] = await Promise.all([
          API.get('/api/projects'),
          API.get('/api/tasks'),
        ]);
        setProjects(pRes.data);
        setTasks(tRes.data);
      } catch { /* silent */ }
    };
    fetchData();
  }, []);

  // Calendar grid calculations
  const calendarData = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const cells = [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      cells.push({
        day: prevMonthLastDay - i,
        currentMonth: false,
        date: new Date(currentYear, currentMonth - 1, prevMonthLastDay - i),
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        currentMonth: true,
        date: new Date(currentYear, currentMonth, d),
      });
    }

    // Next month padding
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        day: d,
        currentMonth: false,
        date: new Date(currentYear, currentMonth + 1, d),
      });
    }

    return cells;
  }, [currentMonth, currentYear]);

  // Map tasks to dates
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (t.dueDate) {
        const d = new Date(t.dueDate);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (!map[key]) map[key] = [];
        map[key].push(t);
      }
    });
    return map;
  }, [tasks]);

  // Map projects to date ranges — tasks define project timeline
  const projectTimelines = useMemo(() => {
    const timelines = [];
    projects.forEach((proj, idx) => {
      const projTasks = tasks.filter((t) => t.project?._id === proj._id);
      if (projTasks.length === 0) return;

      const dates = projTasks
        .filter((t) => t.dueDate)
        .map((t) => new Date(t.dueDate));
      const createdDates = projTasks
        .filter((t) => t.createdAt)
        .map((t) => new Date(t.createdAt));

      const allDates = [...dates, ...createdDates];
      if (allDates.length === 0) return;

      const earliest = new Date(Math.min(...allDates));
      const latest = new Date(Math.max(...allDates));

      timelines.push({
        ...proj,
        start: earliest,
        end: latest,
        taskCount: projTasks.length,
        doneTasks: projTasks.filter((t) => t.status === 'done').length,
        color: PROJECT_COLORS[idx % PROJECT_COLORS.length],
      });
    });
    return timelines;
  }, [projects, tasks]);

  // Get projects active on a specific date
  const getProjectsForDate = (date) => {
    return projectTimelines.filter((p) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const start = new Date(p.start);
      start.setHours(0, 0, 0, 0);
      const end = new Date(p.end);
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    });
  };

  // Get tasks for a specific date
  const getTasksForDate = (date) => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return tasksByDate[key] || [];
  };

  // Navigation
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const isToday = (date) =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  // Tooltip
  const handleCellHover = (cellIdx, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
    setHoveredCell(cellIdx);
  };

  // Format relative date
  const formatRelative = (dateStr) => {
    const d = new Date(dateStr);
    const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
    const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (diff < 0) return { text: `${formatted} (${Math.abs(diff)}d ago)`, overdue: true };
    if (diff === 0) return { text: `${formatted} (today)`, overdue: false };
    if (diff === 1) return { text: `${formatted} (tomorrow)`, overdue: false };
    return { text: `${formatted} (in ${diff}d)`, overdue: false };
  };

  // Duration text
  const getDuration = (start, end) => {
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (days <= 0) return '1 day';
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    const weeks = Math.floor(days / 7);
    const rem = days % 7;
    return rem > 0 ? `${weeks}w ${rem}d` : `${weeks}w`;
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📅 Calendar</h1>
          <p className="page-subtitle">
            View your {mode === 'projects' ? 'project timelines' : 'task schedule'} at a glance
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="cal-controls">
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={goToPrevMonth} aria-label="Previous month">
            ‹
          </button>
          <h2 className="cal-month-title">
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <button className="cal-nav-btn" onClick={goToNextMonth} aria-label="Next month">
            ›
          </button>
          <button className="cal-today-btn" onClick={goToToday}>
            Today
          </button>
        </div>

        <div className="cal-mode-toggle">
          <button
            className={`cal-mode-btn ${mode === 'projects' ? 'active' : ''}`}
            onClick={() => setMode('projects')}
          >
            📁 Projects
          </button>
          <button
            className={`cal-mode-btn ${mode === 'tasks' ? 'active' : ''}`}
            onClick={() => setMode('tasks')}
          >
            📋 Tasks
          </button>
        </div>
      </div>

      {/* Legend */}
      {mode === 'projects' && projectTimelines.length > 0 && (
        <div className="cal-legend">
          {projectTimelines.map((p) => (
            <span key={p._id} className="cal-legend-item">
              <i style={{ background: p.color }} />
              {p.name}
              <span className="cal-legend-duration">
                ({getDuration(p.start, p.end)})
              </span>
            </span>
          ))}
        </div>
      )}

      {mode === 'tasks' && (
        <div className="cal-legend">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <span key={key} className="cal-legend-item">
              <i style={{ background: STATUS_COLORS[key] }} />
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Calendar Grid */}
      <div className="cal-grid-wrapper">
        {/* Day headers */}
        <div className="cal-grid cal-header-row">
          {DAYS.map((d) => (
            <div key={d} className="cal-day-header">{d}</div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="cal-grid cal-body">
          {calendarData.map((cell, idx) => {
            const cellProjects = getProjectsForDate(cell.date);
            const cellTasks = getTasksForDate(cell.date);
            const hasItems = mode === 'projects' ? cellProjects.length > 0 : cellTasks.length > 0;
            const isTodayCell = isToday(cell.date);

            return (
              <div
                key={idx}
                className={`cal-cell ${!cell.currentMonth ? 'cal-cell-outside' : ''} ${isTodayCell ? 'cal-cell-today' : ''} ${hasItems ? 'cal-cell-active' : ''}`}
                onMouseEnter={(e) => hasItems ? handleCellHover(idx, e) : null}
                onMouseLeave={() => setHoveredCell(null)}
              >
                <span className={`cal-day-number ${isTodayCell ? 'cal-today-badge' : ''}`}>
                  {cell.day}
                </span>

                {mode === 'projects' && (
                  <div className="cal-cell-items">
                    {cellProjects.slice(0, 3).map((p) => (
                      <div
                        key={p._id}
                        className="cal-project-dot"
                        style={{ background: p.color }}
                        title={p.name}
                      />
                    ))}
                    {cellProjects.length > 3 && (
                      <span className="cal-more-indicator">+{cellProjects.length - 3}</span>
                    )}
                  </div>
                )}

                {mode === 'tasks' && (
                  <div className="cal-cell-items">
                    {cellTasks.slice(0, 3).map((t) => (
                      <div
                        key={t._id}
                        className="cal-task-chip"
                        style={{
                          borderLeft: `3px solid ${STATUS_COLORS[t.status] || '#94a3b8'}`,
                        }}
                      >
                        {t.title.length > 12 ? t.title.slice(0, 12) + '…' : t.title}
                      </div>
                    ))}
                    {cellTasks.length > 3 && (
                      <span className="cal-more-indicator">+{cellTasks.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell !== null && (
        <div
          className="cal-tooltip"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          {mode === 'projects' ? (
            <>
              <div className="cal-tooltip-title">
                📅 {calendarData[hoveredCell].date.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              {getProjectsForDate(calendarData[hoveredCell].date).map((p) => (
                <div key={p._id} className="cal-tooltip-project">
                  <div className="cal-tooltip-project-header">
                    <span className="cal-tooltip-project-dot" style={{ background: p.color }} />
                    <span className="cal-tooltip-project-name">{p.name}</span>
                  </div>
                  <div className="cal-tooltip-project-meta">
                    <span>🕐 {getDuration(p.start, p.end)}</span>
                    <span>📋 {p.doneTasks}/{p.taskCount} done</span>
                  </div>
                  <div className="cal-tooltip-progress-track">
                    <div
                      className="cal-tooltip-progress-fill"
                      style={{
                        width: `${(p.doneTasks / (p.taskCount || 1)) * 100}%`,
                        background: p.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="cal-tooltip-title">
                📅 {calendarData[hoveredCell].date.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              {getTasksForDate(calendarData[hoveredCell].date).slice(0, 5).map((t) => {
                const pStyle = PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.low;
                const assignees = Array.isArray(t.assignedTo)
                  ? t.assignedTo.map((u) => u.name || 'Unknown').join(', ')
                  : '';
                return (
                  <div key={t._id} className="cal-tooltip-task">
                    <div className="cal-tooltip-task-header">
                      <span className="cal-tooltip-task-name">{t.title}</span>
                      {t.priority && (
                        <span
                          className="cal-tooltip-task-priority"
                          style={{ background: pStyle.bg, color: pStyle.color }}
                        >
                          {t.priority}
                        </span>
                      )}
                    </div>
                    <div className="cal-tooltip-task-meta">
                      <span className="cal-tooltip-task-status">
                        <span
                          className="cal-tooltip-status-dot"
                          style={{ background: STATUS_COLORS[t.status] || '#94a3b8' }}
                        />
                        {STATUS_LABELS[t.status] || t.status}
                      </span>
                      {assignees && <span className="cal-tooltip-assignee">👤 {assignees}</span>}
                    </div>
                    {t.project?.name && (
                      <span className="cal-tooltip-task-project">📁 {t.project.name}</span>
                    )}
                  </div>
                );
              })}
              {getTasksForDate(calendarData[hoveredCell].date).length > 5 && (
                <div className="cal-tooltip-more">
                  +{getTasksForDate(calendarData[hoveredCell].date).length - 5} more
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Summary cards below calendar */}
      <div className="cal-summary">
        {mode === 'projects' ? (
          projectTimelines.map((p) => (
            <div key={p._id} className="cal-summary-card">
              <div className="cal-summary-header">
                <span className="cal-summary-color" style={{ background: p.color }} />
                <span className="cal-summary-name">{p.name}</span>
              </div>
              <div className="cal-summary-details">
                <div className="cal-summary-row">
                  <span className="cal-summary-label">Duration</span>
                  <span className="cal-summary-value">{getDuration(p.start, p.end)}</span>
                </div>
                <div className="cal-summary-row">
                  <span className="cal-summary-label">Timeline</span>
                  <span className="cal-summary-value">
                    {p.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' → '}
                    {p.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="cal-summary-row">
                  <span className="cal-summary-label">Tasks</span>
                  <span className="cal-summary-value">{p.doneTasks}/{p.taskCount} completed</span>
                </div>
                <div className="cal-summary-progress">
                  <div
                    className="cal-summary-progress-fill"
                    style={{
                      width: `${(p.doneTasks / (p.taskCount || 1)) * 100}%`,
                      background: p.color,
                    }}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          (() => {
            // Group tasks by project for task mode summary
            const projGroups = {};
            tasks.forEach((t) => {
              const pName = t.project?.name || 'No Project';
              const pId = t.project?._id || 'none';
              if (!projGroups[pId]) {
                projGroups[pId] = { name: pName, tasks: [], id: pId };
              }
              projGroups[pId].tasks.push(t);
            });

            return Object.values(projGroups).map((group, idx) => {
              const done = group.tasks.filter((t) => t.status === 'done').length;
              const upcoming = group.tasks.filter((t) => {
                if (!t.dueDate) return false;
                const d = new Date(t.dueDate);
                const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
                return diff >= 0 && diff <= 7;
              });

              return (
                <div key={group.id} className="cal-summary-card">
                  <div className="cal-summary-header">
                    <span
                      className="cal-summary-color"
                      style={{ background: PROJECT_COLORS[idx % PROJECT_COLORS.length] }}
                    />
                    <span className="cal-summary-name">{group.name}</span>
                  </div>
                  <div className="cal-summary-details">
                    <div className="cal-summary-row">
                      <span className="cal-summary-label">Total tasks</span>
                      <span className="cal-summary-value">{group.tasks.length}</span>
                    </div>
                    <div className="cal-summary-row">
                      <span className="cal-summary-label">Completed</span>
                      <span className="cal-summary-value" style={{ color: '#10b981' }}>
                        {done}/{group.tasks.length}
                      </span>
                    </div>
                    <div className="cal-summary-row">
                      <span className="cal-summary-label">Due this week</span>
                      <span className="cal-summary-value" style={{ color: '#f59e0b' }}>
                        {upcoming.length}
                      </span>
                    </div>
                    <div className="cal-summary-progress">
                      <div
                        className="cal-summary-progress-fill"
                        style={{
                          width: `${(done / (group.tasks.length || 1)) * 100}%`,
                          background: PROJECT_COLORS[idx % PROJECT_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            });
          })()
        )}
      </div>
    </div>
  );
};

export default Calendar;
