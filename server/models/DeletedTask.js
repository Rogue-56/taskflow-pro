const mongoose = require('mongoose');

const deletedTaskSchema = new mongoose.Schema({
  originalId: { type: mongoose.Schema.Types.ObjectId },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  dueDate: { type: Date },
  assignedTo: { type: String, default: '' },
  project: { type: String, default: '' },
  createdBy: { type: String, default: '' },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deletedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('DeletedTask', deletedTaskSchema);
