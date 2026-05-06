import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { MdHistory, MdDeleteForever } from 'react-icons/md';

const TaskHistory = () => {
  const [deletedTasks, setDeletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await API.get('/api/tasks/history');
      setDeletedTasks(res.data);
    } catch (error) {
      toast.error('Failed to load task history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Task History</h1>
          <p className="page-subtitle">{deletedTasks.length} deleted task{deletedTasks.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {deletedTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">—</div>
          <div className="empty-state-text">No deleted tasks</div>
          <div className="empty-state-sub">Deleted tasks will appear here for reference.</div>
        </div>
      ) : (
        <div className="history-list">
          {deletedTasks.map((task) => (
            <div className="glass-card history-card" key={task._id}>
              <div className="history-card-header">
                <div style={{ flex: 1 }}>
                  <div className="history-title">
                    <MdDeleteForever style={{ color: 'var(--danger)', fontSize: '1.1rem' }} />
                    <span>{task.title}</span>
                  </div>
                  {task.description && (
                    <div className="history-desc">{task.description}</div>
                  )}
                </div>
              </div>
              <div className="history-meta">
                <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                <span className={`badge badge-${task.status}`}>{task.status.replace('-', ' ')}</span>
                {task.assignedTo && (
                  <span className="history-detail">Assigned: {task.assignedTo}</span>
                )}
                {task.project && (
                  <span className="history-detail">Project: {task.project}</span>
                )}
                {task.dueDate && (
                  <span className="history-detail">Due: {formatDate(task.dueDate)}</span>
                )}
              </div>
              <div className="history-footer">
                <span className="history-deleted-info">
                  <MdHistory style={{ fontSize: '0.85rem' }} />
                  Deleted on {formatDate(task.deletedAt)}
                  {task.deletedBy?.name && <> by <strong>{task.deletedBy.name}</strong></>}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskHistory;
