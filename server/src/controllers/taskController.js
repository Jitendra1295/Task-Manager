const mongoose = require('mongoose');
const Task = require('../models/Task');

/**
 * @desc   Get all tasks for the logged-in user, optionally filtered by status ('all', 'pending', 'completed')
 * @route  GET /api/tasks
 * @access Private
 */
const getTasks = async (req, res, next) => {
  try {
    const { status } = req.query;
    // Strictly isolate tasks to the authenticated user
    const filter = { user: req.user._id };

    if (status && (status === 'pending' || status === 'completed')) {
      filter.status = status;
    }

    // Sort newest first
    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Create a new task owned by the logged-in user
 * @route  POST /api/tasks
 * @access Private
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    // Validate title presence and type
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required',
      });
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Title cannot exceed 100 characters',
      });
    }

    let trimmedDescription = '';
    if (description !== undefined && description !== null) {
      if (typeof description !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Description must be text',
        });
      }
      trimmedDescription = description.trim();
      if (trimmedDescription.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Description cannot exceed 500 characters',
        });
      }
    }

    const task = await Task.create({
      title: trimmedTitle,
      description: trimmedDescription,
      status: 'pending',
      user: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Update an existing task with ownership verification
 * @route  PATCH /api/tasks/:id
 * @access Private
 */
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Strict ownership authorization check
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify this task',
      });
    }

    // Validate and update title if provided
    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Task title cannot be empty',
        });
      }
      const trimmedTitle = title.trim();
      if (trimmedTitle.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Title cannot exceed 100 characters',
        });
      }
      task.title = trimmedTitle;
    }

    // Validate and update description if provided
    if (description !== undefined) {
      if (description === null) {
        task.description = '';
      } else if (typeof description !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Description must be text',
        });
      } else {
        const trimmedDesc = description.trim();
        if (trimmedDesc.length > 500) {
          return res.status(400).json({
            success: false,
            message: 'Description cannot exceed 500 characters',
          });
        }
        task.description = trimmedDesc;
      }
    }

    // Validate and update status if provided
    if (status !== undefined) {
      if (status !== 'pending' && status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Status must be either pending or completed',
        });
      }
      task.status = status;
    }

    const updatedTask = await task.save();

    res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Delete a task with ownership verification
 * @route  DELETE /api/tasks/:id
 * @access Private
 */
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Strict ownership authorization check
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to delete this task',
      });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};
