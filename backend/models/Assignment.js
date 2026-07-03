const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  course:      { type: String, enum: ['JPP', 'DevOps', 'Both'], required: true },
  dueDate:     { type: Date, required: true },
  driveLink:   { type: String, default: '' },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assignment', assignmentSchema);
