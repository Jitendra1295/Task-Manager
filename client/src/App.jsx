import { useState, useEffect, useCallback } from 'react';
import { fetchTasks, createTask, updateTask, deleteTask } from './api/tasks';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import AuthForm from './components/AuthForm';

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('task_user');
      const token = localStorage.getItem('task_token');
      return stored && token ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle unauthorized events dispatched by Axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
      setTasks([]);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // Fetch tasks for the logged in user whenever filter changes
  const loadTasks = useCallback(async (currentFilter) => {
    if (!localStorage.getItem('task_token')) return;

    setIsLoading(true);
    setError('');
    try {
      const data = await fetchTasks(currentFilter);
      setTasks(data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to connect to server';
      setError(`Error: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadTasks(filter);
    } else {
      setTasks([]);
    }
  }, [currentUser, filter, loadTasks]);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('task_token');
    localStorage.removeItem('task_user');
    setCurrentUser(null);
    setTasks([]);
    setError('');
  };

  const handleTaskCreated = async (taskData) => {
    const newTask = await createTask(taskData);
    if (filter === 'completed') {
      setFilter('all');
    } else {
      setTasks((prev) => [newTask, ...prev]);
    }
  };

  const handleTaskUpdated = async (id, updates) => {
    const updatedTask = await updateTask(id, updates);
    if (filter !== 'all' && updatedTask.status !== filter) {
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } else {
      setTasks((prev) => prev.map((t) => (t._id === id ? updatedTask : t)));
    }
  };

  const handleTaskDeleted = async (id) => {
    await deleteTask(id);
    setTasks((prev) => prev.filter((t) => t._id !== id));
  };

  return (
    <main className="app-container">
      <header className="app-header">
        <div className="header-row">
          <h1 className="app-title">Task Manager</h1>
          {currentUser && (
            <div className="user-profile-bar">
              <span className="user-badge" title={currentUser.email}>
                {currentUser.name}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </header>

      {!currentUser ? (
        <section className="auth-section">
          <AuthForm onAuthSuccess={handleAuthSuccess} />
        </section>
      ) : (
        <>
          {error && (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => loadTasks(filter)}
              >
                Retry
              </button>
            </div>
          )}

          <section className="form-section">
            <TaskForm onTaskCreated={handleTaskCreated} />
          </section>

          <section className="filter-section">
            <div className="filter-group" role="group" aria-label="Filter tasks by status">
              <button
                type="button"
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                onClick={() => setFilter('pending')}
              >
                Pending
              </button>
              <button
                type="button"
                className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Completed
              </button>
            </div>
          </section>

          <section className="list-section">
            <TaskList
              tasks={tasks}
              isLoading={isLoading}
              onUpdate={handleTaskUpdated}
              onDelete={handleTaskDeleted}
            />
          </section>
        </>
      )}
    </main>
  );
}

export default App;
