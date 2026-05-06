const express = require('express');
const Team = require('../models/Team');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/teams
// @desc    Get teams based on role
//          Admin: all teams with managers + members
//          Manager: only teams they manage
//          Member: only the team they belong to
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    let teams;

    if (req.user.role === 'admin') {
      // Admin sees ALL teams
      teams = await Team.find()
        .populate('manager', 'name email avatar role')
        .populate('members', 'name email avatar role')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'manager') {
      // Manager sees only teams they manage
      teams = await Team.find({ manager: req.user._id })
        .populate('manager', 'name email avatar role')
        .populate('members', 'name email avatar role')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    } else {
      // Member sees only the team they belong to
      teams = await Team.find({ members: req.user._id })
        .populate('manager', 'name email avatar role')
        .populate('members', 'name email avatar role')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    }

    res.json(teams);
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/teams
// @desc    Create a new team
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { name, description, manager, members } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Team name is required' });
    }
    if (!manager) {
      return res.status(400).json({ message: 'Team must have a manager' });
    }

    // Verify manager exists and has manager role
    const managerUser = await User.findById(manager);
    if (!managerUser) {
      return res.status(400).json({ message: 'Manager user not found' });
    }
    if (managerUser.role !== 'manager' && managerUser.role !== 'admin') {
      return res.status(400).json({ message: 'Selected user must have manager or admin role' });
    }

    const team = await Team.create({
      name,
      description: description || '',
      manager,
      members: members || [],
      createdBy: req.user._id,
    });

    const populated = await Team.findById(team._id)
      .populate('manager', 'name email avatar role')
      .populate('members', 'name email avatar role')
      .populate('createdBy', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/teams/:id
// @desc    Get single team
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('manager', 'name email avatar role')
      .populate('members', 'name email avatar role')
      .populate('createdBy', 'name email');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check access: admin sees all, manager sees their teams, member sees their team
    if (req.user.role === 'member') {
      const isMember = team.members.some(m => m._id.toString() === req.user._id.toString());
      if (!isMember) {
        return res.status(403).json({ message: 'Not authorized to view this team' });
      }
    } else if (req.user.role === 'manager') {
      if (team.manager._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this team' });
      }
    }

    res.json(team);
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/teams/:id
// @desc    Update team
// @access  Private/Admin or Manager (own team)
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Manager can only edit their own teams
    if (req.user.role === 'manager' && team.manager.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this team' });
    }

    const { name, description, manager, members } = req.body;
    if (name !== undefined) team.name = name;
    if (description !== undefined) team.description = description;
    if (manager !== undefined && req.user.role === 'admin') team.manager = manager;
    if (members !== undefined) team.members = members;

    await team.save();

    const updated = await Team.findById(team._id)
      .populate('manager', 'name email avatar role')
      .populate('members', 'name email avatar role')
      .populate('createdBy', 'name email');

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/teams/:id
// @desc    Delete team
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    await Team.findByIdAndDelete(req.params.id);
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
