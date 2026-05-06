import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const restoreAuth = async () => {
      const token = localStorage.getItem('taskflow_token');
      const savedUser = localStorage.getItem('taskflow_user');

      if (token && savedUser) {
        try {
          // Verify token is still valid
          const { data } = await API.get('/api/auth/me');
          setUser(data);
          localStorage.setItem('taskflow_user', JSON.stringify(data));
        } catch (error) {
          // Token invalid — clear everything
          localStorage.removeItem('taskflow_token');
          localStorage.removeItem('taskflow_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    restoreAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await API.post('/api/auth/login', { email, password });
      localStorage.setItem('taskflow_token', data.token);
      localStorage.setItem('taskflow_user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const { data } = await API.post('/api/auth/register', { name, email, password, role });
      localStorage.setItem('taskflow_token', data.token);
      localStorage.setItem('taskflow_user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success('Account created successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canManage = user?.role === 'admin' || user?.role === 'manager';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, isManager, canManage }}>
      {children}
    </AuthContext.Provider>
  );
};
