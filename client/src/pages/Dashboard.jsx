import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import StatsCard from '../components/StatsCard';
import TaskCard from '../components/TaskCard';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { MdTask, MdDone, MdPending, MdWarning, MdTrendingUp, MdPriorityHigh, MdAdd } from 'react-icons/md';
import WaterfallChart from '../components/WaterfallChart';

const Dashboard = () => {
  const { user, canManage } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', status: 'todo', priority: 'medium', dueDate: '', assignedTo: [], project: '' });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, tasksRes, projectsRes] = await Promise.all([
        API.get('/api/tasks/stats'),
        API.get('/api/tasks?sort=createdAt'),
        API.get('/api/projects'),
      ]);
      setStats(statsRes.data);
      setRecentTasks(tasksRes.data.slice(0, 5));
      setProjects(projectsRes.data);
      if (canManage) {
        const usersRes = await API.get('/api/users');
        setUsers(usersRes.data);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await API.put(`/api/tasks/${taskId}`, { status: newStatus });
      toast.success('Task status updated');
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update task');
    }
  };

  const openCreate = () => {
    setEditTask(null);
    setForm({ title: '', description: '', status: 'todo', priority: 'medium', dueDate: '', assignedTo: [], project: projects[0]?._id || '' });
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      assignedTo: Array.isArray(task.assignedTo) ? task.assignedTo.map(u => u._id || u) : (task.assignedTo?._id ? [task.assignedTo._id] : []),
      project: task.project?._id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form, dueDate: form.dueDate || null, assignedTo: form.assignedTo.length > 0 ? form.assignedTo : [] };
      if (editTask) {
        await API.put(`/api/tasks/${editTask._id}`, payload);
        toast.success('Task updated');
      } else {
        await API.post('/api/tasks', payload);
        toast.success('Task created');
      }
      setShowModal(false);
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await API.delete(`/api/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="page-subtitle">Here's what's happening with your tasks today.</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={openCreate} id="dashboard-create-task">
            <MdAdd /> New Task
          </button>
        )}
      </div>

      <div className="stats-grid" id="stats-grid">
        <StatsCard icon={<MdTask />} value={stats?.total || 0} label="Total Tasks" colorClass="purple" filterPath="/tasks" />
        <StatsCard icon={<MdPending />} value={stats?.['in-progress'] || 0} label="In Progress" colorClass="blue" filterPath="/tasks?status=in-progress" />
        <StatsCard icon={<MdDone />} value={stats?.done || 0} label="Completed" colorClass="green" filterPath="/tasks?status=done" />
        <StatsCard icon={<MdWarning />} value={stats?.overdue || 0} label="Overdue" colorClass="red" filterPath="/tasks?status=overdue" />
        <StatsCard icon={<MdTrendingUp />} value={stats?.todo || 0} label="To Do" colorClass="yellow" filterPath="/tasks?status=todo" />
        <StatsCard icon={<MdPriorityHigh />} value={stats?.urgent || 0} label="Urgent" colorClass="orange" filterPath="/tasks?priority=urgent" />
      </div>

      <WaterfallChart />

      <div className="page-header" style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Recent Tasks</h2>
        <Link to="/tasks" className="btn btn-ghost btn-sm">View All →</Link>
      </div>

      {recentTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">—</div>
          <div className="empty-state-text">No tasks yet</div>
          <div className="empty-state-sub">Tasks assigned to you will appear here.</div>
        </div>
      ) : (
        recentTasks.map((task) => (
          <TaskCard key={task._id} task={task} onStatusChange={handleStatusChange} onEdit={openEdit} onDelete={handleDelete} />
        ))
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editTask ? 'Edit Task' : 'New Task'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Task title" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
          </div>
          <div className="form-group">
            <label className="form-label">Project</label>
            <select className="form-input form-select" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} required>
              <option value="" disabled>Select project</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Assign To</label>
              <select
                className="form-input form-select"
                multiple
                style={{ minHeight: '90px' }}
                value={form.assignedTo}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                  setForm({ ...form, assignedTo: selected });
                }}
              >
                {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>Hold Ctrl/Cmd to select multiple</div>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editTask ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
