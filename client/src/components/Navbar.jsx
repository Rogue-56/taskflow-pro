import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HiMenu, HiX } from 'react-icons/hi';
import { MdDashboard, MdFolder, MdTask, MdGroup, MdLogout, MdHistory, MdCalendarMonth } from 'react-icons/md';
import API from '../api/axios';

const SEEN_KEY = 'taskflow_last_seen';

const getSeenTimestamps = () => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}');
  } catch {
    return {};
  }
};

const markSeen = (tab) => {
  const seen = getSeenTimestamps();
  seen[tab] = new Date().toISOString();
  localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
};

const Navbar = () => {
  const { user, logout, isAdmin, canManage } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasUpdates, setHasUpdates] = useState({ projects: false, tasks: false, teams: false });

  // Check for updates
  const checkUpdates = useCallback(async () => {
    try {
      const res = await API.get('/api/updates');
      const serverData = res.data; // { tasks: count, projects: count, teams: count }
      const seen = getSeenTimestamps();

      // Items were updated recently — but has user seen the tab since?
      const now = new Date();
      const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      setHasUpdates({
        projects: serverData.projects > 0 && (!seen.projects || new Date(seen.projects) < cutoff),
        tasks: serverData.tasks > 0 && (!seen.tasks || new Date(seen.tasks) < cutoff),
        teams: serverData.teams > 0 && (!seen.teams || new Date(seen.teams) < cutoff),
      });
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    checkUpdates();
    const interval = setInterval(checkUpdates, 60000);
    return () => clearInterval(interval);
  }, [checkUpdates]);

  // Mark tab as seen when navigating
  useEffect(() => {
    const tabMap = {
      '/projects': 'projects',
      '/tasks': 'tasks',
      '/team': 'teams',
    };
    const tab = tabMap[location.pathname];
    if (tab) {
      markSeen(tab);
      setHasUpdates(prev => ({ ...prev, [tab]: false }));
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: <MdDashboard />, dotKey: null },
    { path: '/projects', label: 'Projects', icon: <MdFolder />, dotKey: 'projects' },
    { path: '/tasks', label: 'Tasks', icon: <MdTask />, dotKey: 'tasks' },
  ];

  navLinks.push({ path: '/team', label: 'Team', icon: <MdGroup />, dotKey: 'teams' });
  navLinks.push({ path: '/calendar', label: 'Calendar', icon: <MdCalendarMonth />, dotKey: null });

  if (canManage) {
    navLinks.push({ path: '/history', label: 'History', icon: <MdHistory />, dotKey: null });
  }

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <nav className="navbar" id="main-navbar">
      <Link to="/dashboard" className="navbar-brand">
        <span>TaskFlow Pro</span>
      </Link>

      <button
        className="hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
        id="hamburger-btn"
      >
        {menuOpen ? <HiX /> : <HiMenu />}
      </button>

      <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
        {navLinks.map((link) => (
          <li key={link.path}>
            <Link
              to={link.path}
              className={location.pathname === link.path ? 'active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              {link.icon} {link.label}
              {link.dotKey && hasUpdates[link.dotKey] && <span className="nav-dot" />}
            </Link>
          </li>
        ))}

        <li className="nav-user">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme" id="theme-toggle-btn" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div className="nav-avatar" style={{ background: user?.avatar || '#3b82f6' }}>
            {initials}
          </div>
          <span className={`nav-role-badge ${user?.role}`}>{user?.role}</span>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" id="logout-btn">
            <MdLogout /> Logout
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
