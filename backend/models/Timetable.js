const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  day:     { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], required: true },
  time:    { type: String, required: true },   // e.g. "9:00 AM - 10:00 AM"
  subject: { type: String, required: true },
  course:  { type: String, enum: ['JPP','DevOps','Both'], required: true },
  room:    { type: String, default: '' }
}, { _id: true });

const timetableSchema = new mongoose.Schema({
  slots:     [slotSchema],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Timetable', timetableSchema);
