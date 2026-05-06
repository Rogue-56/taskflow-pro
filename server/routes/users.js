const express = require('express');
const User = require('../models/User');
const Team = require('../models/Team');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get users based on role
//          Admin: all users
//          Manager: members in their teams + themselves
//          Member: teammates + their manager
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      // Admin sees everyone
      const users = await User.find().select('-__v').sort({ createdAt: -1 });
      return res.json(users);
    }

    if (req.user.role === 'manager') {
      // Manager sees members from their teams + themselves
      const teams = await Team.find({ manager: req.user._id });
      const memberIds = new Set();
      memberIds.add(req.user._id.toString());
      teams.forEach(team => {
        team.members.forEach(m => memberIds.add(m.toString()));
      });
      const users = await User.find({ _id: { $in: Array.from(memberIds) } })
        .select('-__v')
        .sort({ createdAt: -1 });
      return res.json(users);
    }

    // Member: sees teammates + their manager
    const teams = await Team.find({ members: req.user._id }).populate('manager', 'name email avatar role');
    const userIds = new Set();
    userIds.add(req.user._id.toString());
    teams.forEach(team => {
      if (team.manager) userIds.add(team.manager._id.toString());
      team.members.forEach(m => userIds.add(m.toString()));
    });
    const users = await User.find({ _id: { $in: Array.from(userIds) } })
      .select('-__v')
      .sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/:id
// @desc    Get single user by ID
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/:id/role
// @desc    Update user role
// @access  Private/Admin
router.put('/:id/role', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['admin', 'manager', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be admin, manager, or member' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from demoting themselves
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    user.role = role;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
