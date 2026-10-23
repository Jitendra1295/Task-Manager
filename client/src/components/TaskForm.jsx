import { useState } from 'react';

function TaskForm({ onTaskCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError('Task title is required');
      return;
    }

    if (trimmedTitle.length > 100) {
      setError('Title cannot exceed 100 characters');
      return;
    }

    if (description.trim().length > 500) {
      setError('Description cannot exceed 500 characters');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await onTaskCreated({
        title: trimmedTitle,
        description: description.trim(),
      });
      setTitle('');
      setDescription('');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create task';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <input
          type="text"
          className="form-input"
          placeholder="What needs to be done? *"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError('');
          }}
          maxLength={100}
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="form-group">
        <textarea
          className="form-textarea"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={2}
          disabled={isSubmitting}
        />
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting || !title.trim()}
        >
          {isSubmitting ? 'Adding...' : 'Add Task'}
        </button>
      </div>
    </form>
  );
}

export default TaskForm;
