import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Hash, ListTodo, CheckCircle2, Clock, Activity, Lock, Loader2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, percentage: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await api.get('/tasks/assigned');
        const tasks = response.data || [];
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'done').length;
        const pending = total - completed;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        setStats({ total, completed, pending, percentage });
      } catch (error) {
        console.error('Error fetching tasks for KPIs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to change password';
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Profile</h1>
        <p className="page-header-sub">Your personal information and KPIs</p>
      </div>

      {/* KPI Stats */}
      <div className="stats-container" style={{ marginBottom: '24px', position: 'relative' }}>
        <div className="stat-card" style={{ flex: '1 1 200px' }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}>
            <ListTodo size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-info-label">Total Tasks</div>
            <div className="stat-info-value">{isLoading ? '-' : stats.total}</div>
          </div>
        </div>

        <div className="stat-card" style={{ flex: '1 1 200px' }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-info-label">Completed</div>
            <div className="stat-info-value">{isLoading ? '-' : stats.completed}</div>
          </div>
        </div>

        <div className="stat-card" style={{ flex: '1 1 200px' }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-info-label">To Do</div>
            <div className="stat-info-value">{isLoading ? '-' : stats.pending}</div>
          </div>
        </div>

        <div className="stat-card" style={{ flex: '1 1 200px' }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-info-label">Progress</div>
            <div className="stat-info-value">{isLoading ? '-' : `${stats.percentage}%`}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
        <div className="card" style={{ flex: '1 1 400px', margin: '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--primary-muted)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <User size={40} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h2 style={{ fontSize: '24px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</h2>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-wrapper" style={{ pointerEvents: 'none' }}>
                <User size={18} />
                <input type="text" value={user?.name || ''} readOnly />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper" style={{ pointerEvents: 'none' }}>
                <Mail size={18} />
                <input type="email" value={user?.email || ''} readOnly />
              </div>
            </div>

            <div className="form-group">
              <label>Account ID</label>
              <div className="input-wrapper" style={{ pointerEvents: 'none' }}>
                <Hash size={18} />
                <input type="text" value={user?.id || ''} readOnly />
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ flex: '1 1 400px', margin: '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
              <Lock size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Security</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '13px' }}>Update your password</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {passwordError && (
              <div className="error-msg" style={{ padding: '10px', background: 'rgba(248, 113, 104, 0.1)', color: 'var(--error)', borderRadius: '8px', fontSize: '13px' }}>
                {passwordError}
              </div>
            )}

            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="btn" style={{ alignSelf: 'flex-start', marginTop: '8px' }} disabled={isChangingPassword}>
              {isChangingPassword ? <Loader2 className="animate-spin" size={18} /> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};

export default Profile;
