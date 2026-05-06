import { MdAccessTime, MdDelete, MdEdit } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';

const TaskCard = ({ task, onStatusChange, onEdit, onDelete }) => {
  const { canManage } = useAuth();
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleStatusChange = (e) => {
    e.stopPropagation();
    if (onStatusChange) onStatusChange(task._id, e.target.value);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(task);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(task._id);
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  // assignedTo is now an array
  const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : []);

  return (
    <div className={`glass-card task-card ${isOverdue ? 'overdue' : ''}`} id={`task-${task._id}`}>
      <div className="task-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <div className="task-title">{task.title}</div>
          <span className={`badge badge-priority-${task.priority}`}>{task.priority}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <select className={`status-select status-${task.status}`} value={task.status} onChange={handleStatusChange} onClick={(e) => e.stopPropagation()}>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          {canManage && onEdit && (
            <button className="btn-icon" onClick={handleEdit} aria-label="Edit task" title="Edit">
              <MdEdit />
            </button>
          )}
          {canManage && onDelete && (
            <button className="btn-icon btn-icon-danger" onClick={handleDelete} aria-label="Delete task" title="Delete">
              <MdDelete />
            </button>
          )}
        </div>
      </div>

      {task.description && <div className="task-desc">{task.description}</div>}

      <div className="task-meta">
        {task.dueDate && (
          <span className={`due-date ${isOverdue ? 'overdue' : ''}`}>
            <MdAccessTime />
            {formatDate(task.dueDate)}
          </span>
        )}

        {isOverdue && <span className="badge badge-overdue">OVERDUE</span>}

        {/* Assignee avatars stack */}
        {assignees.length > 0 && (
          <div className="assignee-stack">
            {assignees.slice(0, 4).map((u, i) => (
              <div key={u._id || i} className="assignee-avatar" style={{ background: u.avatar || '#6C5CE7', zIndex: assignees.length - i }} title={u.name}>
                {getInitials(u.name)}
              </div>
            ))}
            {assignees.length > 4 && <span className="assignee-more">+{assignees.length - 4}</span>}
            <span className="assignee-names">{assignees.map(u => u.name).join(', ')}</span>
          </div>
        )}

        {task.project?.name && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {task.project.name}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
