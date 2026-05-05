import { MdAccessTime, MdDelete, MdEdit } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';

const TaskCard = ({ task, onStatusChange, onEdit, onDelete }) => {
  const { isAdmin } = useAuth();
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleStatusChange = (e) => {
    e.stopPropagation();
    onStatusChange(task._id, e.target.value);
  };

  return (
    <div className={`glass-card task-card ${isOverdue ? 'overdue' : ''}`} id={`task-${task._id}`}>
      <div className="task-header">
        <div style={{ flex: 1 }}>
          <div className="task-title">{task.title}</div>
          {task.description && <div className="task-desc">{task.description}</div>}
        </div>
        <div className="task-actions">
          {isAdmin && onEdit && (
            <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); onEdit(task); }} aria-label="Edit task">
              <MdEdit />
            </button>
          )}
          {isAdmin && onDelete && (
            <button className="btn btn-danger btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); onDelete(task._id); }} aria-label="Delete task">
              <MdDelete />
            </button>
          )}
        </div>
      </div>

      <div className="task-meta">
        <span className={`badge badge-${task.priority}`}>{task.priority}</span>

        <select className="status-select" value={task.status} onChange={handleStatusChange} onClick={(e) => e.stopPropagation()}>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        {task.dueDate && (
          <span className={`due-date ${isOverdue ? 'overdue' : ''}`}>
            <MdAccessTime />
            {isOverdue && '⚠ '}
            {formatDate(task.dueDate)}
          </span>
        )}

        {isOverdue && <span className="badge badge-overdue">OVERDUE</span>}

        {task.assignedTo && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            → {task.assignedTo.name}
          </span>
        )}

        {task.project?.name && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            📁 {task.project.name}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
