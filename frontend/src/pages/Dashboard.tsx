import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

const Dashboard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<'pending' | 'completed'>('pending');
  const [editLoading, setEditLoading] = useState(false);

  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/tasks`, getAuthHeaders());
      setTasks(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch tasks.');
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newTitle.trim()) {
      setError('Task title is required');
      return;
    }

    setAddLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/tasks`,
        { title: newTitle, description: newDescription },
        getAuthHeaders()
      );
      setTasks((prev) => [response.data, ...prev]);
      setNewTitle('');
      setNewDescription('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus = task.status === 'pending' ? 'completed' : 'pending';
    try {
      const response = await axios.put(
        `${API_URL}/tasks/${task._id}`,
        { status: nextStatus },
        getAuthHeaders()
      );
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? response.data : t))
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update task status.');
    }
  };

  const handleStartEdit = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditStatus(task.status);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    if (!editTitle.trim()) {
      setError('Task title is required');
      return;
    }

    setEditLoading(true);
    try {
      const response = await axios.put(
        `${API_URL}/tasks/${editingTask._id}`,
        {
          title: editTitle,
          description: editDescription,
          status: editStatus,
        },
        getAuthHeaders()
      );
      setTasks((prev) =>
        prev.map((t) => (t._id === editingTask._id ? response.data : t))
      );
      setEditingTask(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update task.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await axios.delete(`${API_URL}/tasks/${taskId}`, getAuthHeaders());
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete task.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'pending') return task.status === 'pending';
    if (filter === 'completed') return task.status === 'completed';
    return true;
  });

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const pendingCount = totalCount - completedCount;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo-section">
          <svg className="app-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h2>TaskSpace</h2>
        </div>
        <div className="user-profile">
          <div className="user-details">
            <span className="welcome-text">Welcome back,</span>
            <span className="username">{user?.name || 'User'}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {error && <div className="alert alert-danger dashboard-alert">{error}</div>}

        <section className="stats-grid">
          <div className="stat-card total">
            <div className="stat-info">
              <span className="stat-label">Total Tasks</span>
              <span className="stat-value">{totalCount}</span>
            </div>
          </div>
          <div className="stat-card pending">
            <div className="stat-info">
              <span className="stat-label">Pending</span>
              <span className="stat-value">{pendingCount}</span>
            </div>
          </div>
          <div className="stat-card completed">
            <div className="stat-info">
              <span className="stat-label">Completed</span>
              <span className="stat-value">{completedCount}</span>
            </div>
          </div>
        </section>

        <div className="dashboard-layout">
          <aside className="task-creator">
            <div className="card">
              <h3>Create a New Task</h3>
              <form onSubmit={handleCreateTask} className="task-form">
                <div className="form-group">
                  <label htmlFor="taskTitle">Task Title</label>
                  <input
                    type="text"
                    id="taskTitle"
                    placeholder="e.g., Buy groceries"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    disabled={addLoading}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="taskDesc">Description (Optional)</label>
                  <textarea
                    id="taskDesc"
                    placeholder="Add details about the task..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    disabled={addLoading}
                    rows={4}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-block" disabled={addLoading}>
                  Add Task
                </button>
              </form>
            </div>
          </aside>

          <section className="task-viewer">
            <div className="task-viewer-header">
              <h3>My Tasks</h3>
              <div className="filter-tabs">
                <button
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All ({totalCount})
                </button>
                <button
                  className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                  onClick={() => setFilter('pending')}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                  onClick={() => setFilter('completed')}
                >
                  Completed ({completedCount})
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading-placeholder">
                <div className="spinner"></div>
                <p>Loading tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="empty-tasks">
                <h4>No tasks found</h4>
                <p>
                  {filter === 'all'
                    ? "You haven't created any tasks yet. Try adding one on the left!"
                    : `No tasks found matching "${filter}" filter.`}
                </p>
              </div>
            ) : (
              <div className="tasks-grid">
                {filteredTasks.map((task) => (
                  <div key={task._id} className={`task-card-item ${task.status}`}>
                    <div className="task-card-content">
                      <div className="task-card-header">
                        <label className="checkbox-container">
                          <input
                            type="checkbox"
                            checked={task.status === 'completed'}
                            onChange={() => handleToggleStatus(task)}
                          />
                          <span className="checkmark"></span>
                        </label>
                        <h4 className="task-title">{task.title}</h4>
                      </div>
                      {task.description && (
                        <p className="task-description">{task.description}</p>
                      )}
                      <div className="task-card-footer">
                        <span className={`status-badge ${task.status}`}>
                          {task.status}
                        </span>
                        <span className="task-date">
                          {new Date(task.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="task-card-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStartEdit(task)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-secondary btn-sm delete-btn"
                        onClick={() => handleDeleteTask(task._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {editingTask && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Task</h3>
              <button className="close-modal-btn" onClick={() => setEditingTask(null)}>
                x
              </button>
            </div>
            <form onSubmit={handleUpdateTask} className="modal-form">
              <div className="form-group">
                <label htmlFor="editTitle">Task Title</label>
                <input
                  type="text"
                  id="editTitle"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  disabled={editLoading}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="editDesc">Description</label>
                <textarea
                  id="editDesc"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={editLoading}
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label htmlFor="editStatus">Status</label>
                <select
                  id="editStatus"
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(e.target.value as 'pending' | 'completed')
                  }
                  disabled={editLoading}
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingTask(null)}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
