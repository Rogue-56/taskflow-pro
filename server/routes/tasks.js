const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/tasks/stats
// @desc    Get task statistics for dashboard
// @access  Private
router.get('/stats', protect, async (req, res, next) => {
  try {
    let matchFilter = {};

    // Members only see their assigned tasks
    if (req.user.role !== 'admin') {
      matchFilter = { assignedTo: req.user._id };
    }

    const statusCounts = await Task.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const priorityCounts = await Task.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const overdueTasks = await Task.countDocuments({
      ...matchFilter,
      dueDate: { $lt: new Date() },
      status: { $ne: 'done' },
    });

    const totalTasks = await Task.countDocuments(matchFilter);

    const stats = {
      total: totalTasks,
      todo: 0,
      'in-progress': 0,
      done: 0,
      overdue: overdueTasks,
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };

    statusCounts.forEach((s) => {
      stats[s._id] = s.count;
    });

    priorityCounts.forEach((p) => {
      stats[p._id] = p.count;
    });

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/tasks
// @desc    Get all tasks (admin=all, member=assigned only)
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, priority, project, assignedTo, search, sort } = req.query;
    let filter = {};

    // Role-based filtering
    if (req.user.role !== 'admin') {
      filter.assignedTo = req.user._id;
    }

    // Optional filters
    if (status && status !== 'all') filter.status = status;
    if (priority && priority !== 'all') filter.priority = priority;
    if (project) filter.project = project;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'dueDate') sortOption = { dueDate: 1 };
    if (sort === 'priority') sortOption = { priority: -1 };
    if (sort === 'status') sortOption = { status: 1 };

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('project', 'name')
      .populate('createdBy', 'name email')
      .sort(sortOption);

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, assignedTo, project } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    if (!project) {
      return res.status(400).json({ message: 'Project is required' });
    }

    // Verify project exists
    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const task = await Task.create({
      title,
      description: description || '',
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      assignedTo: assignedTo || null,
      project,
      createdBy: req.user._id,
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('project', 'name')
      .populate('createdBy', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('project', 'name')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Members can only view tasks assigned to them
    if (req.user.role !== 'admin' && task.assignedTo?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this task' });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task (admin=full, member=status only)
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Members can only update status of their assigned tasks
    if (req.user.role !== 'admin') {
      if (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this task' });
      }

      // Members can only change status
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: 'Only status can be updated' });
      }
      task.status = status;
    } else {
      // Admin can update everything
      const { title, description, status, priority, dueDate, assignedTo, project } = req.body;
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (assignedTo !== undefined) task.assignedTo = assignedTo;
      if (project !== undefined) task.project = project;
    }

    await task.save();

    const updated = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('project', 'name')
      .populate('createdBy', 'name email');

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
