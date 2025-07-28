import React, { useState, useEffect, useMemo } from 'react';
import TaskTable from './components/TaskTable';

function App() {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [draggedTabIndex, setDraggedTabIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Auto-refresh interval
  useEffect(() => {
    let interval;
    if (autoRefresh && selectedProfile) {
      interval = setInterval(() => {
        console.log(`Auto-refreshing tasks every ${refreshInterval}s...`);
        loadTasks(selectedProfile);
      }, refreshInterval * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedProfile, refreshInterval]);

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) throw new Error('Failed to load profiles');
      const data = await response.json();
      setProfiles(data);
    } catch (err) {
      setError('Failed to load profiles: ' + err.message);
    }
  };

  const loadTasks = async (profileId) => {
    if (!profileId) {
      setTasks([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/tasks/${profileId}?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`Failed to load tasks: ${response.status}`);
      }
      
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      setError('❌ Error loading tasks: ' + err.message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (profileId) => {
    setSelectedProfile(profileId);
    setGlobalFilter(''); // Clear search when switching profiles
    loadTasks(profileId);
  };

  const handleAddProfile = async (name, file) => {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('taskFile', await file.text());

      const response = await fetch('/api/add-profile', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to add profile');
      }

      await loadProfiles();
      setShowAddProfile(false);
    } catch (err) {
      setError('Failed to add profile: ' + err.message);
    }
  };

  const handleRemoveProfile = async (profileId) => {
    if (!confirm('Are you sure you want to remove this profile? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/remove-profile/${profileId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove profile');
      }

      // If we're removing the currently selected profile, clear selection
      if (selectedProfile === profileId) {
        setSelectedProfile('');
        setTasks([]);
      }

      await loadProfiles();
    } catch (err) {
      setError('Failed to remove profile: ' + err.message);
    }
  };

  // Drag and drop handlers for tab reordering
  const handleDragStart = (e, index) => {
    setDraggedTabIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // Required for Firefox compatibility
  };

  const handleDragOver = (e, index) => {
    e.preventDefault(); // Required to allow drop
    setDragOverIndex(index); // Visual feedback for drop target
  };

  const handleDragEnd = () => {
    // Clean up drag state regardless of drop success
    setDraggedTabIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    // Ignore invalid drops (same position or invalid state)
    if (draggedTabIndex === null || draggedTabIndex === dropIndex) {
      return;
    }

    // Reorder profiles array using splice operations
    const newProfiles = [...profiles];
    const draggedProfile = newProfiles[draggedTabIndex];
    
    // Remove dragged item from original position
    newProfiles.splice(draggedTabIndex, 1);
    // Insert at new position
    newProfiles.splice(dropIndex, 0, draggedProfile);
    
    // Update state and clear drag indicators
    setProfiles(newProfiles);
    setDraggedTabIndex(null);
    setDragOverIndex(null);
  };

  // Memoized task statistics to avoid recalculation on every render
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    
    return { total, completed, inProgress, pending };
  }, [tasks]);

  return (
    <div className="app">
      <header className="header">
        <h1>🦐 Shrimp Task Manager Viewer</h1>
        <div className="version-info">
          <span>v1.0.0</span> • 
          <a href="https://github.com/cjo4m06/mcp-shrimp-task-manager/releases" target="_blank" rel="noopener noreferrer">
            Release Notes
          </a>
        </div>
        <p>Web-based dashboard for viewing and monitoring task data across multiple profiles</p>
      </header>

      <div className="controls" name="main-controls-section">
        <div className="tab-border-line" name="tab-border-separator"></div>
        <div className="profile-controls" name="profile-selection-controls">
          <div className="profile-tabs" name="profile-tabs-container">
            <div className="tabs-list" name="profile-tabs-list">
              {profiles.map((profile, index) => (
                <div 
                  key={profile.id} 
                  className={`tab ${selectedProfile === profile.id ? 'active' : ''} ${draggedTabIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                  name={`profile-tab-${profile.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={() => handleProfileChange(profile.id)}
                  title={`Switch to ${profile.name} profile - Drag to reorder tabs`}
                >
                  <span className="tab-name">{profile.name}</span>
                  <button 
                    className="tab-close-btn"
                    name={`close-tab-${profile.id}-button`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveProfile(profile.id);
                    }}
                    title={`Close ${profile.name} tab and remove profile`}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button 
                className="add-tab-btn"
                name="add-new-tab-button"
                onClick={() => setShowAddProfile(true)}
                title="Add a new profile tab"
              >
                + Add Tab
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedProfile && (
        <>
          <div className="content-container" name="main-content-area">
            <div className="stats-and-search-container" name="stats-and-search-row">
              <div className="search-container" name="task-search-controls">
                <input
                  type="text"
                  name="task-search-input"
                  className="search-input"
                  placeholder="🔍 Search tasks..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  title="Search and filter tasks by any text content"
                />
              </div>

              <div className="stats-grid" name="task-statistics-display">
                <div className="stat-card" name="total-tasks-counter" title="Total number of tasks in this profile">
                  <h3>Total Tasks</h3>
                  <div className="value">{stats.total}</div>
                </div>
                <div className="stat-card" name="completed-tasks-counter" title="Number of completed tasks">
                  <h3>Completed</h3>
                  <div className="value">{stats.completed}</div>
                </div>
                <div className="stat-card" name="in-progress-tasks-counter" title="Number of tasks currently in progress">
                  <h3>In Progress</h3>
                  <div className="value">{stats.inProgress}</div>
                </div>
                <div className="stat-card" name="pending-tasks-counter" title="Number of pending tasks">
                  <h3>Pending</h3>
                  <div className="value">{stats.pending}</div>
                </div>
              </div>

              <div className="controls-right" name="right-side-controls">
                <button 
                  name="refresh-profile-button"
                  className="refresh-button profile-refresh"
                  onClick={() => loadTasks(selectedProfile)}
                  disabled={loading || !selectedProfile}
                  title="Refresh current profile data - reload tasks from file"
                >
                  {loading ? '⏳' : '🔄'}
                </button>

                <div className="auto-refresh-controls" name="auto-refresh-controls" title="Configure automatic task refresh">
                  <label className="auto-refresh" name="auto-refresh-toggle">
                    <input 
                      type="checkbox"
                      name="auto-refresh-checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      title={`Enable automatic refresh every ${refreshInterval} seconds`}
                    />
                    Auto-refresh
                  </label>
                  
                  <select 
                    className="refresh-interval-select"
                    name="refresh-interval-selector"
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    disabled={!autoRefresh}
                    title="Set how often to automatically refresh task data"
                  >
                    <option value={5}>5s</option>
                    <option value={10}>10s</option>
                    <option value={15}>15s</option>
                    <option value={30}>30s</option>
                    <option value={60}>1m</option>
                    <option value={120}>2m</option>
                    <option value={300}>5m</option>
                  </select>
                </div>
              </div>
            </div>

            <TaskTable 
              data={tasks} 
              globalFilter={globalFilter}
              onGlobalFilterChange={setGlobalFilter}
            />
          </div>
        </>
      )}

      {error && (
        <div className="error" name="error-message-display" title="Error information">{error}</div>
      )}

      {!selectedProfile && (
        <div className="content-container" name="no-profile-container">
          <div className="loading" name="no-profile-message" title="Choose a profile from the dropdown above">Select a profile to view tasks</div>
        </div>
      )}

      {loading && selectedProfile && (
        <div className="content-container" name="loading-container">
          <div className="loading" name="loading-indicator" title="Loading tasks from file">Loading tasks... ⏳</div>
        </div>
      )}

      {showAddProfile && (
        <div className="modal-overlay" name="add-profile-modal-overlay" onClick={() => setShowAddProfile(false)} title="Click outside to close">
          <div className="modal-content" name="add-profile-modal" onClick={(e) => e.stopPropagation()} title="Add new profile form">
            <h3>Add New Profile</h3>
            <form name="add-profile-form" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const name = formData.get('name');
              const file = formData.get('file');
              if (name && file) {
                handleAddProfile(name, file);
              }
            }}>
              <div className="form-group" name="profile-name-group">
                <label htmlFor="profileName">Profile Name:</label>
                <input 
                  type="text" 
                  id="profileName"
                  name="name"
                  placeholder="e.g., Team Alpha Tasks"
                  title="Enter a descriptive name for this profile"
                  required
                />
              </div>
              <div className="form-group" name="task-file-group">
                <label htmlFor="taskFile">Select tasks.json file:</label>
                <input 
                  type="file" 
                  id="taskFile"
                  name="file"
                  accept=".json"
                  title="Choose a tasks.json file from your computer"
                  required
                />
              </div>
              <div className="form-actions" name="modal-form-buttons">
                <button 
                  type="submit" 
                  name="submit-add-profile"
                  className="primary-btn"
                  title="Create the new profile with the provided information"
                >
                  Add Profile
                </button>
                <button 
                  type="button" 
                  name="cancel-add-profile"
                  className="secondary-btn" 
                  onClick={() => setShowAddProfile(false)}
                  title="Cancel and close this dialog"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;