import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import {
  LayoutDashboard, CheckCircle2, Clock, Plus,
  Filter, Loader2, AlertCircle, Pencil, Trash2
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import TaskModal from '../components/TaskModal';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

const EMPTY_TASK_FORM = { title: '', desc: '', status: 'todo', priority: 'medium', assigneeId: '' };

const Project = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const taskIdFromUrl = searchParams.get('taskId');

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Task modal state
  const [taskModal, setTaskModal] = useState({ open: false, editMode: false, editingId: null });
  const [taskForm, setTaskForm] = useState(EMPTY_TASK_FORM);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Delete dialog state
  const [deleteProject, setDeleteProject] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  const currentProject = projects.find(p => p.id === projectId);
  const activeProjectName = currentProject?.name || searchParams.get('projectName') || 'Project';

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data || []);
    } catch (e) {
      console.error('Error fetching projects:', e);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await api.get('/users');
      setAllUsers(res.data || []);
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  const fetchTasks = useCallback(async (pId) => {
    if (!pId) return;
    setIsTasksLoading(true);
    try {
      const res = await api.get(`/projects/${pId}/tasks`);
      setTasks(res.data || []);
    } catch (e) {
      console.error('Error fetching tasks:', e);
    } finally {
      setIsTasksLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); fetchAllUsers(); }, []);
  useEffect(() => { if (projectId) fetchTasks(projectId); }, [projectId, fetchTasks]);
  useEffect(() => {
    if (taskIdFromUrl) navigate(`/task/${taskIdFromUrl}`, { replace: true });
  }, [taskIdFromUrl, navigate]);

  const openCreateModal = () => {
    setTaskForm(EMPTY_TASK_FORM);
    setTaskModal({ open: true, editMode: false, editingId: null });
  };

  const openEditModal = useCallback((task) => {
    setTaskForm({
      title: task.title,
      desc: task.description || '',
      status: task.status,
      priority: task.priority,
      assigneeId: task.assignee_id || '',
    });
    setTaskModal({ open: true, editMode: true, editingId: task.id });
  }, []);

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !projectId) return;
    setIsSubmittingTask(true);
    try {
      const payload = {
        title: taskForm.title,
        description: taskForm.desc,
        status: taskForm.status,
        priority: taskForm.priority,
        assignee_id: taskForm.assigneeId,
      };
      if (taskModal.editMode) {
        await api.patch(`/tasks/${taskModal.editingId}`, payload);
      } else {
        await api.post(`/projects/${projectId}/tasks`, payload);
      }
      setTaskModal({ open: false, editMode: false, editingId: null });
      fetchTasks(projectId);
      toast.success(taskModal.editMode ? 'Task updated' : 'Task created');
    } catch {
      toast.error(`Failed to ${taskModal.editMode ? 'update' : 'create'} task`);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeletingTask(true);
    try {
      await api.delete(`/tasks/${taskToDelete.id}`);
      setTaskToDelete(null);
      fetchTasks(projectId);
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;
    setIsDeletingProject(true);
    try {
      await api.delete(`/projects/${projectId}`);
      setDeleteProject(false);
      window.dispatchEvent(new CustomEvent('taskflow:projects-changed'));
      navigate('/', { replace: true });
      toast.success('Project deleted');
    } catch (error) {
      const msg = error.response?.data || error.message || 'Failed to delete project';
      toast.error(typeof msg === 'string' ? msg : 'Failed to delete project');
    } finally {
      setIsDeletingProject(false);
    }
  };

  const visibleTasks = tasks.filter(t => statusFilter === 'all' || t.status === statusFilter);

  return (
    <main className="main-content">
      <header className="page-header">
        <h1>{activeProjectName}</h1>
        <p className="page-header-sub">Tasks for this project</p>
      </header>

      <div className="toolbar-row">
        <div className="toolbar-actions" style={{ marginLeft: 'auto' }}>
          <button type="button" className="btn btn-primary" onClick={openCreateModal} style={{ boxShadow: 'var(--shadow)' }}>
            <Plus size={18} /> Create task
          </button>
          <button type="button" className="btn btn-secondary btn-danger-outline" onClick={() => setDeleteProject(true)}>
            <Trash2 size={18} /> Delete project
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-card-icon"><LayoutDashboard size={20} strokeWidth={2} /></div>
          <div><div className="stat-card-value">{tasks.length}</div><div className="stat-card-label">Tasks</div></div>
        </div>
        <div className="card stat-card">
          <div className="stat-card-icon"><Clock size={20} strokeWidth={2} /></div>
          <div><div className="stat-card-value">{tasks.filter(t => t.status !== 'done').length}</div><div className="stat-card-label">In progress</div></div>
        </div>
        <div className="card stat-card">
          <div className="stat-card-icon"><CheckCircle2 size={20} strokeWidth={2} /></div>
          <div><div className="stat-card-value">{tasks.filter(t => t.status === 'done').length}</div><div className="stat-card-label">Done</div></div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="panel-header" style={{ padding: '16px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h3>Tasks</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'todo', 'in_progress', 'done'].map(s => (
              <button
                key={s}
                type="button"
                className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  minHeight: 32, padding: '6px 12px', fontSize: 12, textTransform: 'capitalize',
                  background: statusFilter === s ? 'var(--primary)' : 'transparent',
                  color: statusFilter === s ? 'white' : 'var(--text)',
                  border: statusFilter === s ? '1px solid var(--primary)' : '1px solid var(--border)'
                }}
                onClick={() => setStatusFilter(s)}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="task-list" style={{ padding: '0 16px 12px' }}>
          {isTasksLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary)' }} />
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state" style={{ padding: '48px 16px' }}>
              <Clock size={36} /><p>No tasks in this project yet.</p>
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: '48px 16px' }}>
              <Filter size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <p>No tasks with status "{statusFilter.replace('_', ' ')}".</p>
            </div>
          ) : (
            visibleTasks.map(t => (
              <div key={t.id} className="task-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div className="task-info">
                    <button
                      type="button"
                      className="task-title task-title-link"
                      style={{ textDecoration: t.status === 'done' ? 'line-through' : 'none', opacity: t.status === 'done' ? 0.65 : 1 }}
                      onClick={() => navigate(`/task/${t.id}`)}
                    >
                      {t.title}
                    </button>
                    <div className="task-meta">
                      <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                      <span aria-hidden>·</span>
                      <span>{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="task-actions">
                  <span className={`badge badge-${t.status}`}>
                    {t.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <button type="button" className="icon-btn" onClick={() => openEditModal(t)} title="Edit task">
                    <Pencil size={16} />
                  </button>
                  <button type="button" className="icon-btn danger" onClick={() => setTaskToDelete(t)} title="Delete task">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <TaskModal
        isOpen={taskModal.open}
        isEditMode={taskModal.editMode}
        activeProjectName={activeProjectName}
        taskTitle={taskForm.title}       setTaskTitle={v => setTaskForm(f => ({ ...f, title: v }))}
        taskDesc={taskForm.desc}         setTaskDesc={v => setTaskForm(f => ({ ...f, desc: v }))}
        taskStatus={taskForm.status}     setTaskStatus={v => setTaskForm(f => ({ ...f, status: v }))}
        taskPriority={taskForm.priority} setTaskPriority={v => setTaskForm(f => ({ ...f, priority: v }))}
        taskAssigneeId={taskForm.assigneeId} setTaskAssigneeId={v => setTaskForm(f => ({ ...f, assigneeId: v }))}
        allUsers={allUsers}
        isSubmitting={isSubmittingTask}
        onSubmit={handleTaskSubmit}
        onClose={() => setTaskModal({ open: false, editMode: false, editingId: null })}
      />

      <DeleteConfirmDialog
        isOpen={deleteProject}
        title="Delete project?"
        description={<>This will permanently delete <strong>{activeProjectName}</strong> and all its tasks. This cannot be undone.</>}
        confirmLabel="Delete project"
        isDeleting={isDeletingProject}
        onConfirm={handleDeleteProject}
        onCancel={() => setDeleteProject(false)}
      />

      <DeleteConfirmDialog
        isOpen={!!taskToDelete}
        title="Delete task?"
        description={<>This will permanently delete <strong>{taskToDelete?.title}</strong>. This cannot be undone.</>}
        confirmLabel="Delete task"
        isDeleting={isDeletingTask}
        onConfirm={handleDeleteTask}
        onCancel={() => setTaskToDelete(null)}
      />
    </main>
  );
};

export default Project;
