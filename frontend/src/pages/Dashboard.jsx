import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  ListTodo,
  Loader2,
  AlertCircle,
  ChevronRight,
  Calendar,
  Folder
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0
  });

  const navigate = useNavigate();

  const fetchMyTasks = async () => {
    try {
      const response = await api.get('/tasks/assigned');
      const taskData = response.data || [];
      setTasks(taskData);

      const total = taskData.length;
      const completed = taskData.filter(t => t.status === 'done').length;
      const pending = total - completed;

      setStats({ total, pending, completed });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-center" style={{ height: '80vh' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Personal Dashboard</h1>
          <p className="page-subtitle">Overview of your assigned work across all projects.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}>
            <ListTodo size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-info-label">Total Tasks</div>
            <div className="stat-info-value">{stats.total}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-info-label">Pending</div>
            <div className="stat-info-value">{stats.pending}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-info-label">Completed</div>
            <div className="stat-info-value">{stats.completed}</div>
          </div>
        </div>
      </div>

      {/* Modern Task List */}
      <div className="content-card">
        <div className="card-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Your Tasks</h2>
          <span className="badge badge-primary">{tasks.length} Total</span>
        </div>

        {tasks.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div className="empty-icon-wrapper" style={{ marginBottom: '16px' }}>
              <AlertCircle size={48} color="var(--text-muted)" />
            </div>
            <h3>No tasks assigned</h3>
            <p>You don't have any tasks assigned to you at the moment.</p>
          </div>
        ) : (
          <div className="list-container">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="dashboard-task-card"
                onClick={() => navigate(`/task/${task.id}`)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: '15px',
                    marginBottom: '8px', 
                    color: 'var(--text)',
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap' 
                  }}>
                    {task.title}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div className="task-meta-item">
                      <Folder size={12} strokeWidth={2.5} />
                      <span style={{ fontWeight: 500 }}>{task.project?.name || 'General'}</span>
                    </div>
                    
                    <div className={`priority-indicator priority-${task.priority}`}>
                      <AlertCircle size={12} strokeWidth={2.5} />
                      <span style={{ textTransform: 'capitalize' }}>{task.priority} Priority</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <div className={`status-pill status-pill-${task.status}`}>
                    {task.status.replace('_', ' ')}
                  </div>
                  <ChevronRight size={18} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div >
  );
};

export default Dashboard;
