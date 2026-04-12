import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronRight,
  Loader2,
  Share2,
  Eye,
  MoreHorizontal,
  Trash2,
  CheckSquare,
  Clock,
  Flag,
  User,
  Calendar,
  Link2
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

function formatIssueKey(id) {
  const compact = String(id).replace(/-/g, '');
  return `TF-${compact.slice(0, 8).toUpperCase()}`;
}

function formatStatusLabel(s) {
  return String(s || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' }
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

const IssueDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingField, setSavingField] = useState(null);

  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [createdAt, setCreatedAt] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [users, setUsers] = useState([]);

  const projectHref = projectId ? `/project/${projectId}` : '/';

  const applyTaskPayload = useCallback((data) => {
    setProjectId(String(data.project_id));
    setProjectName(data.project?.name || '');
    setTitle(data.title || '');
    setDescription(data.description || '');
    setStatus(data.status || 'todo');
    setPriority(data.priority || 'medium');
    setAssigneeId(data.assignee_id ? String(data.assignee_id) : '');
    setCreatedAt(data.created_at ? new Date(data.created_at) : null);
    setUpdatedAt(data.updated_at ? new Date(data.updated_at) : null);
  }, []);

  const buildPatchBody = useCallback(
    (overrides = {}) => ({
      title: overrides.title ?? title,
      description: overrides.description ?? description,
      status: overrides.status ?? status,
      priority: overrides.priority ?? priority,
      assignee_id: Object.prototype.hasOwnProperty.call(overrides, 'assignee_id')
        ? overrides.assignee_id
        : assigneeId
    }),
    [taskId, title, description, status, priority, assigneeId, projectId]
  );

  const patchTask = async (overrides = {}, fieldKey = null) => {
    if (fieldKey) setSavingField(fieldKey);
    else setSaving(true);
    try {
      const { data } = await api.patch(`/tasks/${taskId}`, buildPatchBody(overrides));
      applyTaskPayload(data);
      toast.success('Task updated successfully');
    } catch (e) {
      toast.error(e.response?.data || e.message || 'Failed to update issue');
    } finally {
      setSavingField(null);
      setSaving(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await api.get('/users');
        if (!cancelled) setUsers(u.data || []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const { data } = await api.get(`/tasks/${taskId}`);
        if (cancelled) return;
        applyTaskPayload(data);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e.response?.status === 404 ? 'notfound' : 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [taskId, applyTaskPayload]);

  const handleSaveDetails = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    patchTask({});
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/tasks/${taskId}`);
      setIsDeleteDialogOpen(false);
      navigate(projectHref, { replace: true });
      toast.success('Task deleted successfully');
    } catch (e) {
      toast.error(e.response?.data || e.message || 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const assigneeUser = users.find((u) => String(u.id) === String(assigneeId));

  if (loading) {
    return (
      <main className="main-content jira-issue-view">
        <div className="jira-issue-loading">
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--primary)' }} />
          <p>Loading issue…</p>
        </div>
      </main>
    );
  }

  if (loadError === 'notfound') {
    return (
      <main className="main-content jira-issue-view">
        <div className="jira-issue-loading">
          <p style={{ fontWeight: 600 }}>Issue not found</p>
          <Link to="/" className="btn btn-secondary" style={{ marginTop: 16 }}>
            Back to board
          </Link>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="main-content jira-issue-view">
        <div className="jira-issue-loading">
          <p>Could not load this issue.</p>
          <button type="button" className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
            Go home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="main-content jira-issue-view">
      <nav className="jira-issue-breadcrumb" aria-label="Breadcrumb">
        <Link to={projectHref} className="jira-crumb-link">
          {projectName || 'Project'}
        </Link>
        <ChevronRight size={14} className="jira-crumb-sep" aria-hidden />
        <span className="jira-crumb-current">{formatIssueKey(taskId)}</span>
      </nav>

      <header className="jira-issue-toolbar" style={{ borderRadius: 'var(--radius-lg)', padding: '12px 18px', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
        <div className="jira-issue-toolbar-left">
          <span className="jira-issue-type-pill" style={{ borderRadius: 'var(--radius-lg)', background: 'var(--primary-muted)', color: 'var(--primary)', padding: '6px 12px', fontWeight: 700 }}>
            <CheckSquare size={14} strokeWidth={2.5} />
            Task
          </span>
          <span className="jira-issue-key-text" style={{ fontSize: '14px', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>{formatIssueKey(taskId)}</span>
        </div>
      </header>

      <div className="jira-issue-columns">
        <div className="jira-issue-main">
          <form onSubmit={handleSaveDetails} className="jira-issue-form">
            <label className="sr-only" htmlFor="issue-title">
              Summary
            </label>
            <input
              id="issue-title"
              className="jira-issue-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a summary…"
              autoComplete="off"
            />

            <div className="jira-issue-form-actions">
              <button type="submit" className="btn" disabled={saving || !title.trim()}>
                {saving && !savingField ? <Loader2 className="animate-spin" size={18} /> : 'Save changes'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-danger-outline"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={saving}
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>

            <section className="jira-issue-section">
              <div className="jira-section-head">
                <h2>Description</h2>
              </div>
              <textarea
                className="jira-issue-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description…"
                rows={8}
              />
            </section>
          </form>
        </div>

        <aside className="jira-issue-sidebar" aria-label="Issue details">
          <h2 className="jira-sidebar-title">Details</h2>

          <div className="jira-detail-block">
            <span className="jira-detail-label">Status</span>
            <div className="jira-status-segment" role="group" aria-label="Workflow status">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`jira-status-segment-btn ${status === opt.value ? 'active' : ''}`}
                  disabled={savingField === 'status'}
                  onClick={() => {
                    if (opt.value === status) return;
                    setStatus(opt.value);
                    patchTask({ status: opt.value }, 'status');
                  }}
                >
                  {savingField === 'status' && status === opt.value ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    opt.label
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="jira-detail-block">
            <span className="jira-detail-label">
              <User size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Assignee
            </span>
            <div className="jira-assignee-row">
              {assigneeUser ? (
                <div className="assignee-cell jira-assignee-pill">
                  <div className="assignee-avatar">{assigneeUser.name.charAt(0)}</div>
                  <span>{assigneeUser.name}</span>
                </div>
              ) : (
                <span className="jira-muted">No assignee</span>
              )}
            </div>
            <select
              className="jira-sidebar-select"
              value={assigneeId}
              disabled={savingField === 'assignee'}
              onChange={(e) => {
                const next = e.target.value;
                setAssigneeId(next);
                patchTask({ assignee_id: next }, 'assignee');
              }}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="jira-detail-block">
            <span className="jira-detail-label">
              <Flag size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Priority
            </span>
            <select
              className="jira-sidebar-select"
              value={priority}
              disabled={savingField === 'priority'}
              onChange={(e) => {
                const next = e.target.value;
                setPriority(next);
                patchTask({ priority: next }, 'priority');
              }}
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className="jira-priority-hint">
              <span className={`badge badge-${priority}`}>{priority}</span>
            </div>
          </div>

          <div className="jira-detail-block">
            <span className="jira-detail-label">
              <Link2 size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Parent
            </span>
            <Link to={projectHref} className="jira-detail-link">
              {projectName || 'Project'}
            </Link>
          </div>

          <div className="jira-detail-meta">
            <div className="jira-meta-row">
              <Calendar size={14} />
              <span>Created</span>
              <strong>{createdAt ? createdAt.toLocaleString() : '—'}</strong>
            </div>
            <div className="jira-meta-row">
              <Clock size={14} />
              <span>Updated</span>
              <strong>{updatedAt ? updatedAt.toLocaleString() : '—'}</strong>
            </div>
          </div>
        </aside>
      </div>

      {isDeleteDialogOpen && (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setIsDeleteDialogOpen(false);
          }}
        >
          <div className="auth-card modal-content" style={{ maxWidth: '440px', width: '90%' }}>
            <button
              type="button"
              onClick={() => !isDeleting && setIsDeleteDialogOpen(false)}
              className="close-btn"
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              aria-label="Close"
            >
              <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
            </button>
            <div className="auth-header" style={{ textAlign: 'left' }}>
              <h1>Delete task?</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                This will permanently delete <strong>{title}</strong>. This cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '28px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{ background: 'var(--error)', color: '#fff' }}
              >
                {isDeleting ? <Loader2 className="animate-spin" size={20} /> : 'Delete task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default IssueDetail;
