const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  type:      { type: String, enum: ['info', 'warning', 'success'], default: 'info' },
  course:    { type: String, enum: ['JPP', 'DevOps', 'Both'], default: 'Both' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notice', noticeSchema);
