import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import toast from 'react-hot-toast';
import TaskCard from '../components/TaskCard';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { MdAdd, MdSearch, MdPerson } from 'react-icons/md';

const Tasks = () => {
  const { user, canManage } = useAuth();
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'all',
    priority: searchParams.get('priority') || 'all',
    project: searchParams.get('project') || '',
    search: '',
  });
  const [form, setForm] = useState({ title: '', description: '', status: 'todo', priority: 'medium', dueDate: '', assignedTo: [], project: '' });

  useEffect(() => { fetchData(); }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.set('status', filters.status);
      if (filters.priority !== 'all') params.set('priority', filters.priority);
      if (filters.project) params.set('project', filters.project);
      if (filters.search) params.set('search', filters.search);

      const [tasksRes, projectsRes] = await Promise.all([
        API.get(`/api/tasks?${params}`),
        API.get('/api/projects'),
      ]);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
      if (canManage) {
        const usersRes = await API.get('/api/users');
        setUsers(usersRes.data);
      }
    } catch (error) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
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
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await API.put(`/api/tasks/${taskId}`, { status: newStatus });
      toast.success('Status updated');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update');
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await API.delete(`/api/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading && tasks.length === 0) return <LoadingSpinner />;

  // Filter for "My Tasks Only"
  const displayedTasks = myTasksOnly
    ? tasks.filter(t => {
        const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [];
        return assignees.some(a => (a._id || a) === user?._id);
      })
    : tasks;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{displayedTasks.length} task{displayedTasks.length !== 1 ? 's' : ''} found</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className={`my-tasks-toggle ${myTasksOnly ? 'active' : ''}`}
            onClick={() => setMyTasksOnly(!myTasksOnly)}
          >
            <MdPerson /> My Tasks
          </button>
          {canManage && (
            <button className="btn btn-primary" onClick={openCreate} id="create-task-global-btn">
              <MdAdd /> New Task
            </button>
          )}
        </div>
      </div>

      <div className="filters-bar" id="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <MdSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="search-input"
            style={{ paddingLeft: 36 }}
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <select className="filter-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="all">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
          <option value="overdue">Overdue</option>
        </select>
        <select className="filter-select" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="all">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select className="filter-select" value={filters.project} onChange={(e) => setFilters({ ...filters, project: e.target.value })}>
          <option value="">All Projects</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      {displayedTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">—</div>
          <div className="empty-state-text">{myTasksOnly ? 'No tasks assigned to you' : 'No tasks found'}</div>
          <div className="empty-state-sub">{myTasksOnly ? 'Toggle off "My Tasks" to see all tasks.' : 'Try adjusting your filters or create a new task.'}</div>
        </div>
      ) : (
        displayedTasks.map((task) => (
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

export default Tasks;
