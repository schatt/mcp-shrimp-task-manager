import React from 'react';

function TaskDetailModal({ task, onClose }) {
  if (!task) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffa500',
      in_progress: '#3498db',
      completed: '#27ae60',
      blocked: '#e74c3c'
    };
    return colors[status] || '#666';
  };

  const getFileTypeIcon = (type) => {
    const icons = {
      CREATE: '➕',
      TO_MODIFY: '✏️',
      REFERENCE: '📖',
      DEPENDENCY: '🔗',
      OTHER: '📄'
    };
    return icons[type] || '📄';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content task-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="task-detail-section">
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className={`status-badge status-${task.status}`} style={{ backgroundColor: getStatusColor(task.status) }}>
                {task.status?.replace('_', ' ')}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">ID:</span>
              <span className="detail-value monospace">{task.id}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Created:</span>
              <span className="detail-value">{formatDate(task.createdAt)}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Updated:</span>
              <span className="detail-value">{formatDate(task.updatedAt)}</span>
            </div>
            
            {task.completedAt && (
              <div className="detail-row">
                <span className="detail-label">Completed:</span>
                <span className="detail-value">{formatDate(task.completedAt)}</span>
              </div>
            )}
          </div>

          <div className="task-detail-section">
            <h3>Description</h3>
            <div className="detail-content">{task.description || 'No description provided'}</div>
          </div>

          {task.notes && (
            <div className="task-detail-section">
              <h3>Notes</h3>
              <div className="detail-content">{task.notes}</div>
            </div>
          )}

          {task.implementationGuide && (
            <div className="task-detail-section">
              <h3>Implementation Guide</h3>
              <div className="detail-content">{task.implementationGuide}</div>
            </div>
          )}

          {task.verificationCriteria && (
            <div className="task-detail-section">
              <h3>Verification Criteria</h3>
              <div className="detail-content">{task.verificationCriteria}</div>
            </div>
          )}

          {task.summary && (
            <div className="task-detail-section">
              <h3>Completion Summary</h3>
              <div className="detail-content">{task.summary}</div>
            </div>
          )}

          {task.analysisResult && (
            <div className="task-detail-section">
              <h3>Analysis Result</h3>
              <div className="detail-content">{task.analysisResult}</div>
            </div>
          )}

          {task.dependencies && task.dependencies.length > 0 && (
            <div className="task-detail-section">
              <h3>Dependencies</h3>
              <ul className="dependency-list">
                {task.dependencies.map((dep, idx) => (
                  <li key={idx} className="monospace">{dep.taskId}</li>
                ))}
              </ul>
            </div>
          )}

          {task.relatedFiles && task.relatedFiles.length > 0 && (
            <div className="task-detail-section">
              <h3>Related Files</h3>
              <div className="related-files-list">
                {task.relatedFiles.map((file, idx) => (
                  <div key={idx} className="related-file-item">
                    <span className="file-type-icon">{getFileTypeIcon(file.type)}</span>
                    <div className="file-info">
                      <div className="file-path monospace">{file.path}</div>
                      {file.description && (
                        <div className="file-description">{file.description}</div>
                      )}
                      {(file.lineStart || file.lineEnd) && (
                        <div className="file-lines">
                          Lines: {file.lineStart || '?'} - {file.lineEnd || '?'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskDetailModal;