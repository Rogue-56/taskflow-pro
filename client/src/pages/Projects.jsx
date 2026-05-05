import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';

const Projects = () => {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', status: 'active', members: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/api/projects');
      setProjects(data);
      if (isAdmin) {
        const usersRes = await API.get('/api/users');
        setUsers(usersRes.data);
      }
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditProject(null);
    setForm({ name: '', description: '', status: 'active', members: [] });
    setShowModal(true);
  };

  const openEdit = (project) => {
    setEditProject(project);
    setForm({
      name: project.name,
      description: project.description || '',
      status: project.status,
      members: project.members?.map((m) => m._id) || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editProject) {
        await API.put(`/api/projects/${editProject._id}`, form);
        toast.success('Project updated');
      } else {
        await API.post('/api/projects', form);
        toast.success('Project created');
      }
      setShowModal(false);
      fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await API.delete(`/api/projects/${id}`);
      toast.success('Project deleted');
      fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete project');
    }
  };

  const toggleMember = (userId) => {
    setForm((prev) => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter((id) => id !== userId)
        : [...prev.members, userId],
    }));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate} id="create-project-btn">
            <MdAdd /> New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <div className="empty-state-text">No projects found</div>
          <div className="empty-state-sub">{isAdmin ? 'Create your first project to get started.' : 'You have not been assigned to any projects yet.'}</div>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => {
            const total = project.taskCounts?.total || 0;
            const done = project.taskCounts?.done || 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <div key={project._id} className="glass-card project-card" id={`project-${project._id}`}>
                <div className="project-card-header">
                  <Link to={`/projects/${project._id}`} className="project-name" style={{ color: 'var(--text-primary)' }}>
                    {project.name}
                  </Link>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(project)}><MdEdit /></button>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(project._id)}><MdDelete /></button>
                    </div>
                  )}
                </div>
                {project.description && <div className="project-desc">{project.description}</div>}

                <div className="project-progress">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>Progress</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>

                <div className="project-footer">
                  <div className="project-members">
                    {project.members?.slice(0, 4).map((m) => (
                      <div key={m._id} className="member-avatar" style={{ background: m.avatar || '#6C5CE7' }} title={m.name}>
                        {m.name?.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {project.members?.length > 4 && (
                      <div className="member-avatar" style={{ background: '#555' }}>+{project.members.length - 4}</div>
                    )}
                  </div>
                  <div className="project-task-count">{total} task{total !== 1 ? 's' : ''}</div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <span className={`badge badge-${project.status === 'active' ? 'in-progress' : project.status === 'completed' ? 'done' : 'todo'}`}>
                    {project.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editProject ? 'Edit Project' : 'New Project'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter project name" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
          </div>
          {editProject && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Members</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {users.map((u) => (
                <button key={u._id} type="button" className={`btn btn-sm ${form.members.includes(u._id) ? 'btn-primary' : 'btn-ghost'}`} onClick={() => toggleMember(u._id)}>
                  {u.name}
                </button>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editProject ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Projects;
