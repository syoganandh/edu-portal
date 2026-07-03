const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:   { type: String, required: true },
  date:     { type: Date, required: true },
  status:   { type: String, enum: ['present', 'absent'], required: true },
  topic:    { type: String, default: '' }
});

attendanceSchema.index({ student: 1, course: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
