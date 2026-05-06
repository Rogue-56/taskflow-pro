import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { MdSwapVert, MdAdd, MdExpandMore, MdExpandLess } from 'react-icons/md';

const Team = () => {
  const { user, isAdmin, canManage } = useAuth();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [teamForm, setTeamForm] = useState({ name: '', description: '', manager: '', members: [] });
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes] = await Promise.all([
        API.get('/api/teams'),
      ]);
      setTeams(teamsRes.data);

      // Admin gets all users for team creation
      if (isAdmin) {
        const usersRes = await API.get('/api/users');
        setAllUsers(usersRes.data);
      }
    } catch (error) {
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await API.post('/api/teams', teamForm);
      toast.success('Team created');
      setShowCreateTeam(false);
      setTeamForm({ name: '', description: '', manager: '', members: [] });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create team');
    }
  };

  const handleDeleteTeam = async (teamId) => {
    try {
      await API.delete(`/api/teams/${teamId}`);
      toast.success('Team deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete team');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await API.put(`/api/users/${userId}/role`, { role: newRole });
      toast.success('Role updated');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  };

  const toggleExpand = (teamId) => {
    setExpandedTeam(expandedTeam === teamId ? null : teamId);
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">
            {user?.role === 'member'
              ? 'Your team and teammates'
              : user?.role === 'manager'
              ? 'Teams you manage'
              : 'All teams and members'}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowCreateTeam(true)}>
            <MdAdd /> New Team
          </button>
        )}
      </div>

      {/* Teams List */}
      {teams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">—</div>
          <div className="empty-state-text">No teams found</div>
          <div className="empty-state-sub">
            {isAdmin ? 'Create your first team to get started.' : 'You have not been assigned to any team yet.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {teams.map((team) => (
            <div key={team._id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Team Header - clickable to expand */}
              <div
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => toggleExpand(team._id)}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>{team.name}</div>
                  {team.description && (
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>{team.description}</div>
                  )}
                  <div style={{ display: 'flex', gap: '12px', marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Manager: <strong style={{ color: 'var(--accent)' }}>{team.manager?.name || 'Unassigned'}</strong></span>
                    <span>{team.members?.length || 0} member{(team.members?.length || 0) !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isAdmin && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team._id); }}
                    >
                      Remove
                    </button>
                  )}
                  <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
                    {expandedTeam === team._id ? <MdExpandLess /> : <MdExpandMore />}
                  </span>
                </div>
              </div>

              {/* Expanded: show members */}
              {expandedTeam === team._id && (
                <div style={{ borderTop: '1px solid var(--border-glass)', padding: '16px 24px' }}>
                  {/* Manager card */}
                  {team.manager && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 8 }}>
                        Manager
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--accent-glow)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59,130,246,0.2)' }}>
                        <div className="team-avatar" style={{ background: team.manager.avatar || '#3b82f6', width: 36, height: 36, fontSize: '0.8rem', margin: 0 }}>
                          {getInitials(team.manager.name)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{team.manager.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{team.manager.email}</div>
                        </div>
                        <span className="nav-role-badge manager">{team.manager.role}</span>
                      </div>
                    </div>
                  )}

                  {/* Members list */}
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Members
                  </div>
                  {team.members.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                      No members in this team yet
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {team.members.map((member) => (
                        <div key={member._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                          <div className="team-avatar" style={{ background: member.avatar || '#6C5CE7', width: 36, height: 36, fontSize: '0.8rem', margin: 0 }}>
                            {getInitials(member.name)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{member.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.email}</div>
                          </div>
                          <span className={`nav-role-badge ${member.role}`}>{member.role}</span>
                          {isAdmin && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleRoleChange(member._id, member.role === 'member' ? 'manager' : 'member')}
                              title="Toggle role"
                            >
                              <MdSwapVert />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="modal-overlay" onClick={() => setShowCreateTeam(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Team</h2>
              <button className="modal-close" onClick={() => setShowCreateTeam(false)}>×</button>
            </div>
            <form onSubmit={handleCreateTeam}>
              <div className="form-group">
                <label className="form-label">Team Name</label>
                <input className="form-input" placeholder="e.g. Engineering" value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input form-textarea" placeholder="What does this team do?" value={teamForm.description} onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Manager</label>
                <select className="form-input form-select" value={teamForm.manager} onChange={(e) => setTeamForm({ ...teamForm, manager: e.target.value })} required>
                  <option value="" disabled>Select manager</option>
                  {allUsers.filter(u => u.role === 'manager' || u.role === 'admin').map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Members</label>
                <select
                  className="form-input form-select"
                  multiple
                  style={{ minHeight: '120px' }}
                  value={teamForm.members}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                    setTeamForm({ ...teamForm, members: selected });
                  }}
                >
                  {allUsers.filter(u => u.role === 'member').map(u => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>Hold Ctrl/Cmd to select multiple</div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateTeam(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Team</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
