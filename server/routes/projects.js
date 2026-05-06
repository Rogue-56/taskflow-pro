const express = require('express');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/projects
// @desc    Get all projects (admin gets all, member gets assigned ones)
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    let projects;

    if (req.user.role === 'admin') {
      projects = await Project.find()
        .populate('members', 'name email avatar role')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'manager') {
      projects = await Project.find({ $or: [{ createdBy: req.user._id }, { members: req.user._id }] })
        .populate('members', 'name email avatar role')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    } else {
      projects = await Project.find({ members: req.user._id })
        .populate('members', 'name email avatar role')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    }

    // Attach task counts to each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCounts = await Task.aggregate([
          { $match: { project: project._id } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]);

        const counts = { todo: 0, 'in-progress': 0, done: 0, total: 0 };
        taskCounts.forEach((tc) => {
          counts[tc._id] = tc.count;
          counts.total += tc.count;
        });

        return { ...project.toJSON(), taskCounts: counts };
      })
    );

    res.json(projectsWithCounts);
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private/Admin
router.post('/', protect, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { name, description, members } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const project = await Project.create({
      name,
      description: description || '',
      members: members || [],
      createdBy: req.user._id,
    });

    const populated = await Project.findById(project._id)
      .populate('members', 'name email avatar role')
      .populate('createdBy', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/projects/:id
// @desc    Get single project with its tasks
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members', 'name email avatar role')
      .populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Members can only view their own projects
    if (req.user.role === 'member' && !project.members.some((m) => m._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this project' });
    }

    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ project, tasks });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private/Admin
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { name, description, status, members } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;
    if (members !== undefined) project.members = members;

    await project.save();

    const updated = await Project.findById(project._id)
      .populate('members', 'name email avatar role')
      .populate('createdBy', 'name email');

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project and all its tasks
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Delete all tasks in this project
    await Task.deleteMany({ project: project._id });

    // Delete the project
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project and all associated tasks deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
