import { useState } from 'react';

function TaskItem({ task, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [itemError, setItemError] = useState('');

  const isCompleted = task.status === 'completed';

  const handleToggleStatus = async () => {
    setIsProcessing(true);
    setItemError('');
    try {
      const nextStatus = isCompleted ? 'pending' : 'completed';
      await onUpdate(task._id, { status: nextStatus });
    } catch (err) {
      setItemError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const trimmedTitle = editTitle.trim();

    if (!trimmedTitle) {
      setItemError('Title cannot be empty');
      return;
    }

    if (trimmedTitle.length > 100) {
      setItemError('Title cannot exceed 100 characters');
      return;
    }

    if (editDescription.trim().length > 500) {
      setItemError('Description cannot exceed 500 characters');
      return;
    }

    setIsProcessing(true);
    setItemError('');

    try {
      await onUpdate(task._id, {
        title: trimmedTitle,
        description: editDescription.trim(),
      });
      setIsEditing(false);
    } catch (err) {
      setItemError(err.response?.data?.message || 'Failed to update task');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setItemError('');
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setIsProcessing(true);
    setItemError('');
    try {
      await onDelete(task._id);
    } catch (err) {
      setItemError(err.response?.data?.message || 'Failed to delete task');
      setIsProcessing(false);
    }
  };

  // Format date simply
  const formattedDate = task.createdAt
    ? new Date(task.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <li className={`task-item ${isCompleted ? 'is-completed' : ''}`}>
      {itemError && <div className="item-error">{itemError}</div>}

      {isEditing ? (
        <form className="inline-edit-form" onSubmit={handleSaveEdit}>
          <input
            type="text"
            className="form-input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            maxLength={100}
            disabled={isProcessing}
            required
            autoFocus
          />
          <textarea
            className="form-textarea"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            maxLength={500}
            rows={2}
            disabled={isProcessing}
          />
          <div className="inline-edit-actions">
            <button
              type="submit"
              className="btn btn-sm btn-primary"
              disabled={isProcessing || !editTitle.trim()}
            >
              {isProcessing ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={handleCancelEdit}
              disabled={isProcessing}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="task-content-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              className="task-checkbox"
              checked={isCompleted}
              onChange={handleToggleStatus}
              disabled={isProcessing}
            />
          </label>

          <div className="task-body">
            <div className="task-title-line">
              <span className="task-title">{task.title}</span>
              {formattedDate && <span className="task-date">{formattedDate}</span>}
            </div>

            {task.description && (
              <p className="task-description">{task.description}</p>
            )}
          </div>

          <div className="task-actions">
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => setIsEditing(true)}
              disabled={isProcessing}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={handleDelete}
              disabled={isProcessing}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default TaskItem;
