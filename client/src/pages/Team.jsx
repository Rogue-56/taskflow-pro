import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { MdSwapVert } from 'react-icons/md';

const Team = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/api/users');
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await API.put(`/api/users/${userId}/role`, { role: newRole });
      toast.success('Role updated');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await API.delete(`/api/users/${userId}`);
      toast.success('User removed');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Members</h1>
          <p className="page-subtitle">{users.length} member{users.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="team-grid">
        {users.map((user) => {
          const initials = user.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
          return (
            <div key={user._id} className="glass-card team-card" id={`team-${user._id}`}>
              <div className="team-avatar" style={{ background: user.avatar || '#6C5CE7' }}>{initials}</div>
              <div className="team-name">{user.name}</div>
              <div className="team-email">{user.email}</div>
              <span className={`nav-role-badge ${user.role}`} style={{ marginBottom: 16, display: 'inline-block' }}>{user.role}</span>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleRoleChange(user._id, user.role === 'admin' ? 'member' : 'admin')}
                  title="Toggle role"
                >
                  <MdSwapVert /> {user.role === 'admin' ? 'Make Member' : 'Make Admin'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user._id)}>Remove</button>
              </div>
              <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Team;
