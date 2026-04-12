import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Plus,
  LogOut,
  User as UserIcon,
  Loader2,
  Users,
  Kanban,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const THEME_KEY = 'taskflow-theme';

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get('projectId');
  const onDashboard = !projectIdParam || projectIdParam === 'dashboard';
  const myWorkActive = location.pathname === '/' && onDashboard;

  const [theme, setTheme] = useState(() => {
    if (typeof document === 'undefined') return 'dark';
    return document.documentElement.getAttribute('data-theme') || 'dark';
  });

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      console.log(response.data);
      setProjects(response.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await api.get('/users');
      console.log("the users are ", response);
      setAllUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchAllUsers();
  }, []);

  useEffect(() => {
    const onProjectsChanged = () => fetchProjects();
    window.addEventListener('taskflow:projects-changed', onProjectsChanged);
    return () => window.removeEventListener('taskflow:projects-changed', onProjectsChanged);
  }, []);

  useEffect(() => {
    if (user && !selectedOwnerId) {
      setSelectedOwnerId(user.id);
    }
  }, [user]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsCreatingProject(true);
    try {
      await api.post('/projects', {
        name: newProjectName,
        description: newProjectDesc,
        owner_id: selectedOwnerId
      });
      setNewProjectName('');
      setNewProjectDesc('');
      setIsProjectModalOpen(false);
      await fetchProjects();
      toast.success('Project created successfully');
    } catch (error) {
      toast.error('Failed to create project');
    } finally {
      setIsCreatingProject(false);
    }
  };

  return (
    <>
      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="sidebar-brand-mark">
              <Briefcase size={18} strokeWidth={2.25} />
            </div>
            <h2>TaskFlow</h2>
          </div>

          <button
            className="mobile-header-btn mobile-only"
            onClick={() => setIsMobileOpen?.(false)}
            aria-label="Close menu"
          >
            <span style={{ fontSize: 18, lineHeight: 1, padding: 4 }}>×</span>
          </button>
        </div>

        <nav className="nav-section">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard /> Dashboard
          </NavLink>

          <NavLink
            to="/sprint"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Kanban /> Sprint Planner
          </NavLink>

          <div className="nav-section-label">Projects</div>

          {isLoading ? (
            <div style={{ padding: '0 10px' }}><Loader2 size={16} className="animate-spin" /></div>
          ) : (
            projects.map((p) => {
              const isActive = location.pathname === `/project/${p.id}`;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`nav-item nav-item-project ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    navigate(`/project/${p.id}?projectName=${encodeURIComponent(p.name)}`);
                  }}
                >
                  <span className="nav-item-project-dot" aria-hidden />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                </button>
              )
            })
          )}

          <button
            type="button"
            className="nav-item nav-item-cta"
            onClick={() => setIsProjectModalOpen(true)}
          >
            <Plus size={18} /> Create project
          </button>
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <div className="sidebar-user-row">
            <div className="sidebar-user-avatar">
              <UserIcon size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Standard</div>
            </div>
          </div>
          <button type="button" className="nav-item logout-btn" onClick={logout} style={{ color: 'var(--error)' }}>
            <LogOut /> Log out
          </button>
        </div>
      </aside>

      {/* Project Creation Modal */}
      {isProjectModalOpen && (
        <div className="modal-overlay">
          <div className="auth-card modal-content" style={{ maxWidth: '450px', width: '90%' }}>
            <button onClick={() => setIsProjectModalOpen(false)} className="close-btn" style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
            </button>
            <div className="auth-header" style={{ textAlign: 'left' }}>
              <h1>New Project</h1>
              <p>Create a fresh workspace for your tasks.</p>
            </div>
            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label>Project Name</label>
                <div className="input-wrapper">
                  <Briefcase size={18} />
                  <input
                    type="text"
                    placeholder="e.g. Website Overhaul"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    required
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  className="jira-input"
                  placeholder="What is this project about?"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  style={{ height: '100px', resize: 'vertical' }}
                />
              </div>
              <div className="form-group">
                <label>Project Owner</label>
                <div className="input-wrapper">
                  <UserIcon size={18} />
                  <select
                    value={selectedOwnerId}
                    onChange={(e) => setSelectedOwnerId(e.target.value)}
                    className="jira-input"
                    style={{ paddingLeft: '40px' }}
                    required
                  >
                    <option value="" disabled>Select an owner</option>
                    {allUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="btn" type="submit" disabled={isCreatingProject}>
                {isCreatingProject ? <Loader2 className="animate-spin" size={20} /> : 'Create Project'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
