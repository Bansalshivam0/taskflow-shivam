import React from 'react';
import { Plus, AlertCircle, Clock, Filter, Users, Loader2 } from 'lucide-react';

const TaskModal = ({
  isOpen,
  isEditMode,
  activeProjectName,
  taskTitle, setTaskTitle,
  taskDesc, setTaskDesc,
  taskStatus, setTaskStatus,
  taskPriority, setTaskPriority,
  taskAssigneeId, setTaskAssigneeId,
  allUsers,
  isSubmitting,
  onSubmit,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="auth-card modal-content" style={{ maxWidth: '500px', width: '90%' }}>
        <button
          onClick={onClose}
          className="close-btn"
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
        </button>

        <div className="auth-header" style={{ textAlign: 'left' }}>
          <h1>{isEditMode ? 'Edit task' : 'Create task'}</h1>
          <p>
            {isEditMode
              ? <>Update fields for a task in <b>{activeProjectName}</b>.</>
              : <>New task in <b>{activeProjectName}</b>.</>}
          </p>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label>Title</label>
            <div className="input-wrapper">
              <AlertCircle size={18} />
              <input
                type="text"
                placeholder="What needs to be done?"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="jira-input"
              placeholder="Additional details..."
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              style={{ height: '100px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Status</label>
              <div className="input-wrapper">
                <Clock size={16} />
                <select value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)} className="jira-input" style={{ paddingLeft: '40px' }}>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <div className="input-wrapper">
                <Filter size={16} />
                <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} className="jira-input" style={{ paddingLeft: '40px' }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Assign To</label>
            <div className="input-wrapper">
              <Users size={16} />
              <select
                value={taskAssigneeId}
                onChange={(e) => setTaskAssigneeId(e.target.value)}
                className="jira-input"
                style={{ paddingLeft: '40px' }}
                required
              >
                <option value="" disabled>Select a user</option>
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
          </div>

          <button className="btn" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? <Loader2 className="animate-spin" size={20} />
              : (isEditMode ? 'Save changes' : 'Create')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
