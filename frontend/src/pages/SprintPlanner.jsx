import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Loader2, Kanban, Users, Layers, X, ChevronDown, Check } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const SprintPlanner = () => {
  const [sprintData, setSprintData] = useState({ projects: [], tasks: [] });
  const [localTasks, setLocalTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [visibleStatuses, setVisibleStatuses] = useState(['todo', 'in_progress', 'done']);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const assigneeDropdownRef = useRef(null);
  const columnsDropdownRef = useRef(null);

  const navigate = useNavigate();

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target)) {
        setIsAssigneeOpen(false);
      }
      if (columnsDropdownRef.current && !columnsDropdownRef.current.contains(event.target)) {
        setIsColumnsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setAllUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchSprintData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/sprint-planner');
      const data = response.data || { projects: [], tasks: [] };
      setSprintData(data);

      // Initialize local tasks with project info
      const projectMap = data.projects.reduce((acc, p) => {
        acc[p.id] = p.name;
        return acc;
      }, {});

      const enrichedTasks = (data.tasks || []).map(t => ({
        ...t,
        projectName: projectMap[t.project_id] || 'Unknown project'
      }));

      setLocalTasks(enrichedTasks);
    } catch (error) {
      console.error('Error fetching sprint data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSprintData();
    fetchUsers();
  }, []);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const newStatus = destination.droppableId;
    const taskId = draggableId;

    const taskIndex = localTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const originalTask = localTasks[taskIndex];
    if (originalTask.status === newStatus) return;

    const updatedTasks = [...localTasks];
    const [movedTask] = updatedTasks.splice(taskIndex, 1);
    movedTask.status = newStatus;
    updatedTasks.push(movedTask);
    setLocalTasks(updatedTasks);

    try {
      await api.patch(`/tasks/${taskId}`, {
        status: newStatus
      });
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('Failed to update task status. Reverting...');
      fetchSprintData();
    }
  };

  const columns = [
    { id: 'todo', title: 'To Do', color: 'var(--text-muted)' },
    { id: 'in_progress', title: 'In Progress', color: 'var(--primary)' },
    { id: 'done', title: 'Done', color: 'var(--success)' }
  ];

  // Apply filters to tasks
  const filteredTasks = useMemo(() => {
    return localTasks.filter(t => {
      const matchesAssignee = selectedAssignee === 'all' ||
        !t.assignee_id ||
        (t.assignee_id === selectedAssignee);
      return matchesAssignee;
    });
  }, [localTasks, selectedAssignee]);

  const toggleStatusVisibility = (statusId) => {
    setVisibleStatuses(prev =>
      prev.includes(statusId)
        ? prev.filter(id => id !== statusId)
        : [...prev, statusId]
    );
  };

  const activeColumns = columns.filter(col => visibleStatuses.includes(col.id));

  return (
    <main className="main-content">
      <header className="page-header" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Sprint Planning</h1>
            <p className="page-header-sub">Kanban view</p>
          </div>
        </div>
      </header>

      {/* Filter Toolbar */}
      <div className="planner-toolbar">
        <div className="planner-filters-left">
          <div className="filter-group">
            <div className="filter-icon-box">
              <Users size={16} />
            </div>
            <div className="filter-content">
              <span className="filter-label">Assignee</span>
              <div className="custom-select-container" ref={assigneeDropdownRef}>
                <button
                  className="custom-select-trigger"
                  onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}
                >
                  <span>
                    {selectedAssignee === 'all'
                      ? 'Everyone'
                      : allUsers.find(u => u.id === selectedAssignee)?.name || 'Unknown User'}
                  </span>
                  <ChevronDown size={14} style={{ opacity: 0.6 }} />
                </button>

                {isAssigneeOpen && (
                  <div className="custom-select-menu">
                    <div
                      className={`custom-select-option ${selectedAssignee === 'all' ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedAssignee('all');
                        setIsAssigneeOpen(false);
                      }}
                    >
                      Everyone
                      {selectedAssignee === 'all' && <Check size={14} />}
                    </div>
                    {allUsers.map((u) => (
                      <div
                        key={u.id}
                        className={`custom-select-option ${selectedAssignee === u.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedAssignee(u.id);
                          setIsAssigneeOpen(false);
                        }}
                      >
                        {u.name}
                        {selectedAssignee === u.id && <Check size={14} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="planner-v-divider" />

          <div className="filter-group">
            <div className="filter-icon-box">
              <Layers size={16} />
            </div>
            <div className="filter-content">
              <span className="filter-label">Status</span>
              <div className="custom-select-container" ref={columnsDropdownRef}>
                <button
                  className="custom-select-trigger"
                  onClick={() => setIsColumnsOpen(!isColumnsOpen)}
                >
                  <span>
                    {visibleStatuses.length === columns.length
                      ? 'All'
                      : `${visibleStatuses.length} selected`}
                  </span>
                  <ChevronDown size={14} style={{ opacity: 0.6 }} />
                </button>

                {isColumnsOpen && (
                  <div className="custom-select-menu custom-select-menu--right">
                    {columns.map((col) => (
                      <div
                        key={col.id}
                        className={`custom-select-option ${visibleStatuses.includes(col.id) ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation(); // Keep menu open for multi-select
                          toggleStatusVisibility(col.id);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                          {col.title}
                        </div>
                        {visibleStatuses.includes(col.id) && <Check size={14} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="toolbar-actions" style={{ marginLeft: 'auto' }}>
          {(selectedAssignee !== 'all' || visibleStatuses.length < 3) && (
            <button
              className="btn btn-secondary planner-reset-btn"
              onClick={() => {
                setSelectedAssignee('all');
                setVisibleStatuses(['todo', 'in_progress', 'done']);
              }}
            >
              <X size={14} style={{ marginRight: '6px' }} /> Reset
            </button>
          )}
        </div>
      </div>

      <div className="sprint-planner-view">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : sprintData.projects.length === 0 ? (
          <div
            className="card empty-state"
            style={{ padding: '64px 24px', borderStyle: 'dashed', background: 'var(--bg-secondary)' }}
          >
            <Kanban size={40} />
            <h3 style={{ color: 'var(--text)', fontSize: 16, fontWeight: 600, marginTop: 8 }}>Nothing here yet</h3>
            <p style={{ fontSize: 14, marginTop: 6 }}>Create a project and tasks from the sidebar to see them listed here.</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="kanban-board-grid" style={{
              gridTemplateColumns: `repeat(${activeColumns.length}, minmax(min(100%, 300px), 1fr))`
            }}>
              {activeColumns.map(col => {
                const colTasks = filteredTasks.filter(t => t.status === col.id);
                return (
                  <div key={col.id} className="kanban-column" style={{ minWidth: '0' }}>
                    <div className="kanban-column-header">
                      <div className="kanban-column-title">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                        {col.title}
                      </div>
                      <span className="kanban-column-count">{colTasks.length}</span>
                    </div>

                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          className="kanban-list-dropzone"
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{
                            background: snapshot.isDraggingOver ? 'var(--bg-hover)' : 'transparent'
                          }}
                        >
                          {colTasks.length === 0 && !snapshot.isDraggingOver ? (
                            <div className="kanban-no-tasks">
                              No tasks match filters
                            </div>
                          ) : (
                            colTasks.map((t, index) => (
                              <Draggable key={t.id} draggableId={t.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`kanban-card ${snapshot.isDragging ? 'dragging' : ''}`}
                                    onClick={() => !snapshot.isDragging && navigate(`/task/${t.id}`)}
                                    style={{
                                      ...provided.draggableProps.style,
                                      opacity: snapshot.isDragging ? 0.9 : 1
                                    }}
                                  >
                                    <div className="kanban-card-project">
                                      {t.projectName}
                                    </div>
                                    <div className="kanban-card-title">
                                      {t.title}
                                    </div>
                                    <div className="kanban-card-footer">
                                      <div className="kanban-card-meta">
                                        <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                                      </div>
                                      <div className="kanban-card-assignee">
                                        {t.assignee ? t.assignee.name.charAt(0).toUpperCase() : '?'}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </div>
    </main>
  );
};

export default SprintPlanner;
