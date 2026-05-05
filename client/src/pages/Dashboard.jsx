import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import StatsCard from '../components/StatsCard';
import TaskCard from '../components/TaskCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { MdTask, MdDone, MdPending, MdWarning, MdTrendingUp, MdPriorityHigh } from 'react-icons/md';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, tasksRes] = await Promise.all([
        API.get('/api/tasks/stats'),
        API.get('/api/tasks?sort=createdAt'),
      ]);
      setStats(statsRes.data);
      setRecentTasks(tasksRes.data.slice(0, 5));
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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening with your tasks today.</p>
        </div>
      </div>

      <div className="stats-grid" id="stats-grid">
        <StatsCard icon={<MdTask />} value={stats?.total || 0} label="Total Tasks" colorClass="purple" />
        <StatsCard icon={<MdPending />} value={stats?.['in-progress'] || 0} label="In Progress" colorClass="blue" />
        <StatsCard icon={<MdDone />} value={stats?.done || 0} label="Completed" colorClass="green" />
        <StatsCard icon={<MdWarning />} value={stats?.overdue || 0} label="Overdue" colorClass="red" />
        <StatsCard icon={<MdTrendingUp />} value={stats?.todo || 0} label="To Do" colorClass="yellow" />
        <StatsCard icon={<MdPriorityHigh />} value={stats?.urgent || 0} label="Urgent" colorClass="orange" />
      </div>

      <div className="page-header">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Recent Tasks</h2>
        <Link to="/tasks" className="btn btn-ghost btn-sm">View All →</Link>
      </div>

      {recentTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">No tasks yet</div>
          <div className="empty-state-sub">Tasks assigned to you will appear here.</div>
        </div>
      ) : (
        recentTasks.map((task) => (
          <TaskCard key={task._id} task={task} onStatusChange={handleStatusChange} />
        ))
      )}
    </div>
  );
};

export default Dashboard;
