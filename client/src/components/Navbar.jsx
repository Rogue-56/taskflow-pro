import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiMenu, HiX } from 'react-icons/hi';
import { MdDashboard, MdFolder, MdTask, MdGroup, MdLogout } from 'react-icons/md';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: <MdDashboard /> },
    { path: '/projects', label: 'Projects', icon: <MdFolder /> },
    { path: '/tasks', label: 'Tasks', icon: <MdTask /> },
  ];

  if (isAdmin) {
    navLinks.push({ path: '/team', label: 'Team', icon: <MdGroup /> });
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
        ⚡ <span>TaskFlow Pro</span>
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
            </Link>
          </li>
        ))}

        <li className="nav-user">
          <div className="nav-avatar" style={{ background: user?.avatar || '#6C5CE7' }}>
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
