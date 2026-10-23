import TaskItem from './TaskItem';

function TaskList({ tasks, isLoading, onUpdate, onDelete }) {
  if (isLoading && tasks.length === 0) {
    return <div className="state-message">Loading tasks...</div>;
  }

  if (tasks.length === 0) {
    return <div className="state-message">No tasks found.</div>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task._id}
          task={task}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

export default TaskList;
