import { useState, useEffect, useRef } from 'react';
import API from '../api/axios';

const COLORS = {
  total: '#3b82f6',
  done: '#10b981',
  'in-progress': '#f59e0b',
  todo: '#94a3b8',
  overdue: '#ef4444',
};

const PRIORITY_COLORS = {
  low: '#64748b',
  medium: '#a855f7',
  high: '#f97316',
  urgent: '#ef4444',
};

const STATUS_LABELS = {
  done: 'Done',
  'in-progress': 'In Progress',
  todo: 'To Do',
};

const STATUS_MAP = {
  'Done': 'done',
  'In Progress': 'in-progress',
  'To Do': 'todo',
  'Overdue': 'overdue',
};

const WaterfallChart = () => {
  const [mode, setMode] = useState('status');
  const [scope, setScope] = useState('team');
  const [stats, setStats] = useState(null);
  const [projectStats, setProjectStats] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = scope === 'mine' ? '?mine=true' : '';
        const [sRes, pRes, tRes] = await Promise.all([
          API.get(`/api/tasks/stats${q}`),
          API.get(`/api/tasks/stats/projects${q}`),
          API.get(`/api/tasks${q ? q + '&' : '?'}sort=createdAt`),
        ]);
        setStats(sRes.data);
        setProjectStats(pRes.data);
        setTasks(tRes.data);
      } catch { /* silent */ }
    };
    fetchData();
  }, [scope]);

  if (!stats) return null;

  const total = stats.total || 1;

  // Group tasks by status
  const getTasksByStatus = (statusLabel) => {
    const statusKey = STATUS_MAP[statusLabel];
    if (statusKey === 'overdue') {
      return tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done');
    }
    return tasks.filter(t => t.status === statusKey);
  };

  // Group tasks by project
  const getTasksByProject = (projectId) => {
    return tasks.filter(t => t.project?._id === projectId);
  };

  // Get assignee names
  const getAssignees = (task) => {
    const arr = Array.isArray(task.assignedTo) ? task.assignedTo : [];
    return arr.map(u => u.name || 'Unknown').join(', ');
  };

  // Format due date relative to today
  const formatDueDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (diffDays < 0) return `${formatted} (${Math.abs(diffDays)}d overdue)`;
    if (diffDays === 0) return `${formatted} (today)`;
    if (diffDays === 1) return `${formatted} (tomorrow)`;
    return formatted;
  };

  // Get status display info
  const getStatusInfo = (status) => {
    const map = {
      'done': { label: 'Done', color: COLORS.done },
      'in-progress': { label: 'In Progress', color: COLORS['in-progress'] },
      'todo': { label: 'To Do', color: COLORS.todo },
    };
    return map[status] || { label: status, color: '#94a3b8' };
  };

  // Get priority style
  const getPriorityStyle = (priority) => {
    const map = {
      'urgent': { bg: 'rgba(239,68,68,0.2)', color: '#ef4444' },
      'high': { bg: 'rgba(249,115,22,0.15)', color: '#f97316' },
      'medium': { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
      'low': { bg: 'rgba(100,116,139,0.2)', color: '#94a3b8' },
    };
    return map[priority] || map['low'];
  };

  const handleBarHover = (key, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = e.currentTarget.closest('.waterfall-container').getBoundingClientRect();
    setTooltipPos({
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 8,
    });
    setHoveredBar(key);
  };

  // Status breakdown bars
  const statusBars = [
    { label: 'Done', value: stats.done || 0, color: COLORS.done },
    { label: 'In Progress', value: stats['in-progress'] || 0, color: COLORS['in-progress'] },
    { label: 'To Do', value: stats.todo || 0, color: COLORS.todo },
    { label: 'Overdue', value: stats.overdue || 0, color: COLORS.overdue },
  ].sort((a, b) => b.value - a.value);

  // Get the tooltip bar color
  const getTooltipBarColor = () => {
    if (!hoveredBar) return null;
    if (hoveredBar === 'total') return COLORS.total;
    if (hoveredBar.startsWith('status-')) {
      const label = hoveredBar.replace('status-', '');
      const bar = statusBars.find(b => b.label === label);
      return bar?.color || '#94a3b8';
    }
    if (hoveredBar.startsWith('segment-')) {
      const status = hoveredBar.split('|')[2];
      return COLORS[status] || '#94a3b8';
    }
    return '#3b82f6';
  };

  // Render tooltip content
  const renderTooltip = () => {
    if (!hoveredBar) return null;

    let tooltipTasks = [];
    let title = '';

    if (hoveredBar === 'total') {
      title = `All Tasks (${total})`;
      tooltipTasks = tasks.slice(0, 5);
    } else if (hoveredBar.startsWith('status-')) {
      const label = hoveredBar.replace('status-', '');
      tooltipTasks = getTasksByStatus(label);
      title = `${label} (${tooltipTasks.length})`;
    } else if (hoveredBar.startsWith('project-')) {
      const id = hoveredBar.replace('project-', '');
      tooltipTasks = getTasksByProject(id);
      const proj = projectStats.find(p => p._id === id);
      title = `${proj?.name || 'Project'} (${tooltipTasks.length})`;
    } else if (hoveredBar.startsWith('segment-')) {
      const [, projId, status] = hoveredBar.split('|');
      tooltipTasks = getTasksByProject(projId).filter(t => t.status === status);
      const statusLabel = status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1);
      title = `${statusLabel} (${tooltipTasks.length})`;
    }

    const displayTasks = tooltipTasks.slice(0, 4);
    const barColor = getTooltipBarColor();

    return (
      <div
        className="wf-tooltip"
        style={{ left: tooltipPos.x, top: tooltipPos.y }}
      >
        <div className="wf-tooltip-title">
          <span className="wf-tooltip-dot" style={{ background: barColor, color: barColor }} />
          {title}
        </div>
        {displayTasks.length === 0 && (
          <div className="wf-tooltip-empty">No tasks</div>
        )}
        {displayTasks.map((t, i) => {
          const statusInfo = getStatusInfo(t.status);
          const priorityStyle = getPriorityStyle(t.priority);
          const due = formatDueDate(t.dueDate);
          const assignees = getAssignees(t);
          const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done';
          return (
            <div key={t._id || i} className="wf-tooltip-item">
              <div className="wf-tooltip-item-header">
                <span className="wf-tooltip-task">{t.title}</span>
                {t.priority && (
                  <span
                    className="wf-tooltip-priority"
                    style={{ background: priorityStyle.bg, color: priorityStyle.color }}
                  >
                    {t.priority}
                  </span>
                )}
              </div>
              <div className="wf-tooltip-item-details">
                <span className="wf-tooltip-status">
                  <span className="wf-tooltip-status-dot" style={{ background: statusInfo.color }} />
                  {statusInfo.label}
                </span>
                {assignees && (
                  <span className="wf-tooltip-meta">👤 {assignees}</span>
                )}
                {due && (
                  <span className={`wf-tooltip-due ${isOverdue ? 'overdue' : ''}`}>
                    📅 {due}
                  </span>
                )}
              </div>
              {t.project?.name && (
                <span className="wf-tooltip-project">📁 {t.project.name}</span>
              )}
            </div>
          );
        })}
        {tooltipTasks.length > 4 && (
          <div className="wf-tooltip-more">+{tooltipTasks.length - 4} more tasks…</div>
        )}
      </div>
    );
  };

  return (
    <div className="waterfall-container" ref={containerRef} style={{ position: 'relative' }}>
      <div className="waterfall-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h3 className="waterfall-title">Task Breakdown</h3>
          <div className="waterfall-toggle">
            <button className={`wf-toggle-btn ${scope === 'team' ? 'active' : ''}`} onClick={() => setScope('team')}>
              👥 Team
            </button>
            <button className={`wf-toggle-btn ${scope === 'mine' ? 'active' : ''}`} onClick={() => setScope('mine')}>
              👤 My Tasks
            </button>
          </div>
        </div>
        <div className="waterfall-toggle">
          <button className={`wf-toggle-btn ${mode === 'status' ? 'active' : ''}`} onClick={() => setMode('status')}>
            By Status
          </button>
          <button className={`wf-toggle-btn ${mode === 'project' ? 'active' : ''}`} onClick={() => setMode('project')}>
            By Project
          </button>
        </div>
      </div>

      {mode === 'status' ? (
        <div className="waterfall-chart">
          {statusBars.map((bar, i) => {
            const widthPct = (bar.value / total) * 100;
            const offset = statusBars.slice(0, i).reduce((sum, b) => sum + (b.value / total) * 100, 0);
            return (
              <div className="wf-row" key={bar.label}>
                <div className="wf-label">{bar.label}</div>
                <div className="wf-bar-track">
                  <div
                    className="wf-bar wf-bar-hoverable"
                    style={{
                      width: `${Math.max(widthPct, 2)}%`,
                      marginLeft: `${offset}%`,
                      background: bar.color,
                    }}
                    onMouseEnter={(e) => handleBarHover(`status-${bar.label}`, e)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    <span className="wf-bar-value">{bar.value}</span>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="wf-connector" />
          <div className="wf-row wf-total-row">
            <div className="wf-label" style={{ fontWeight: 700 }}>Total</div>
            <div className="wf-bar-track">
              <div
                className="wf-bar wf-bar-total wf-bar-hoverable"
                style={{ width: '100%', background: COLORS.total }}
                onMouseEnter={(e) => handleBarHover('total', e)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                <span className="wf-bar-value">{total}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="waterfall-chart">
          {projectStats.map((proj) => {
            const donePct = (proj.done / (proj.total || 1)) * 100;
            const ipPct = (proj['in-progress'] / (proj.total || 1)) * 100;
            const todoPct = (proj.todo / (proj.total || 1)) * 100;
            return (
              <div className="wf-row" key={proj._id}>
                <div className="wf-label wf-label-project">{proj.name}</div>
                <div className="wf-bar-track wf-stacked">
                  {proj.done > 0 && (
                    <div
                      className="wf-bar-segment wf-bar-hoverable"
                      style={{ width: `${donePct}%`, background: COLORS.done }}
                      onMouseEnter={(e) => handleBarHover(`segment-|${proj._id}|done`, e)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      <span>{proj.done}</span>
                    </div>
                  )}
                  {proj['in-progress'] > 0 && (
                    <div
                      className="wf-bar-segment wf-bar-hoverable"
                      style={{ width: `${ipPct}%`, background: COLORS['in-progress'] }}
                      onMouseEnter={(e) => handleBarHover(`segment-|${proj._id}|in-progress`, e)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      <span>{proj['in-progress']}</span>
                    </div>
                  )}
                  {proj.todo > 0 && (
                    <div
                      className="wf-bar-segment wf-bar-hoverable"
                      style={{ width: `${todoPct}%`, background: COLORS.todo }}
                      onMouseEnter={(e) => handleBarHover(`segment-|${proj._id}|todo`, e)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      <span>{proj.todo}</span>
                    </div>
                  )}
                  <span className="wf-total-label">{proj.total} tasks</span>
                </div>
              </div>
            );
          })}
          <div className="wf-legend">
            <span><i style={{ background: COLORS.done }} /> Done</span>
            <span><i style={{ background: COLORS['in-progress'] }} /> In Progress</span>
            <span><i style={{ background: COLORS.todo }} /> To Do</span>
          </div>
        </div>
      )}

      {renderTooltip()}
    </div>
  );
};

export default WaterfallChart;
