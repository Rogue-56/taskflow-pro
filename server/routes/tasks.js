const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const DeletedTask = require('../models/DeletedTask');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/tasks/stats
// @desc    Get task statistics for dashboard
// @access  Private
router.get('/stats', protect, async (req, res, next) => {
  try {
    let matchFilter = {};
    const mineOnly = req.query.mine === 'true';

    // Personal filter: show only tasks assigned to the logged-in user
    if (mineOnly) {
      matchFilter = { assignedTo: req.user._id };
    } else if (req.user.role === 'member') {
      // Members see their team's tasks; admin and manager see all
      const Team = require('../models/Team');
      const team = await Team.findOne({ members: req.user._id });
      if (team) {
        matchFilter = { assignedTo: { $in: [...team.members, team.manager] } };
      } else {
        matchFilter = { assignedTo: req.user._id };
      }
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

// @route   GET /api/tasks/stats/projects
// @desc    Get per-project task breakdown
// @access  Private
router.get('/stats/projects', protect, async (req, res, next) => {
  try {
    let matchFilter = {};
    const mineOnly = req.query.mine === 'true';

    if (mineOnly) {
      matchFilter = { assignedTo: req.user._id };
    } else if (req.user.role === 'member') {
      const Team = require('../models/Team');
      const team = await Team.findOne({ members: req.user._id });
      if (team) {
        matchFilter = { assignedTo: { $in: [...team.members, team.manager] } };
      } else {
        matchFilter = { assignedTo: req.user._id };
      }
    }

    const projectStats = await Task.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { project: '$project', status: '$status' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.project',
          total: { $sum: '$count' },
          statuses: {
            $push: { status: '$_id.status', count: '$count' },
          },
        },
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: '_id',
          as: 'projectInfo',
        },
      },
      { $unwind: '$projectInfo' },
      {
        $project: {
          _id: 1,
          name: '$projectInfo.name',
          total: 1,
          statuses: 1,
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Flatten statuses into keys
    const result = projectStats.map((p) => {
      const obj = { _id: p._id, name: p.name, total: p.total, todo: 0, 'in-progress': 0, done: 0 };
      p.statuses.forEach((s) => { obj[s.status] = s.count; });
      return obj;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/tasks/history
// @desc    Get deleted tasks history
// @access  Private/Admin
router.get('/history', protect, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const deletedTasks = await DeletedTask.find()
      .populate('deletedBy', 'name email')
      .sort({ deletedAt: -1 });
    res.json(deletedTasks);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/tasks
// @desc    Get all tasks (admin=all, member=team tasks)\n// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, priority, project, assignedTo, search, sort, mine } = req.query;
    let filter = {};

    // Personal filter: show only tasks assigned to the logged-in user
    if (mine === 'true') {
      filter.assignedTo = req.user._id;
    } else if (req.user.role === 'member') {
      // Role-based filtering: members see tasks for their entire team
      const Team = require('../models/Team');
      const team = await Team.findOne({ members: req.user._id });
      if (team) {
        // Include all team members + manager
        const teamUserIds = [...team.members, team.manager];
        filter.assignedTo = { $in: teamUserIds };
      } else {
        // No team — fallback to own tasks only
        filter.assignedTo = req.user._id;
      }
    }

    // Optional filters
    if (status && status !== 'all') {
      if (status === 'overdue') {
        filter.dueDate = { $lt: new Date() };
        filter.status = { $ne: 'done' };
      } else {
        filter.status = status;
      }
    }
    if (priority && priority !== 'all') filter.priority = priority;
    if (project) filter.project = project;
    if (assignedTo) filter.assignedTo = { $in: [assignedTo] };
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
router.post('/', protect, authorize('admin', 'manager'), async (req, res, next) => {
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
      assignedTo: assignedTo || [],
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
    const isAssigned = task.assignedTo?.some(u => u._id.toString() === req.user._id.toString());
    if (req.user.role === 'member' && !isAssigned) {
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
    if (req.user.role === 'member') {
      const isMemberAssigned = task.assignedTo?.some(id => id.toString() === req.user._id.toString());
      if (!isMemberAssigned) {
        return res.status(403).json({ message: 'Not authorized to update this task' });
      }

      // Members can only change status
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: 'Only status can be updated' });
      }
      task.status = status;
    } else {
      // Admin and Manager can update everything
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
// @desc    Delete task (archive to history first)
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('project', 'name')
      .populate('createdBy', 'name email');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Archive to deleted tasks history
    await DeletedTask.create({
      originalId: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      assignedTo: Array.isArray(task.assignedTo) ? task.assignedTo.map(u => u.name).join(', ') : (task.assignedTo?.name || ''),
      project: task.project?.name || '',
      createdBy: task.createdBy?.name || '',
      deletedBy: req.user._id,
    });

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
