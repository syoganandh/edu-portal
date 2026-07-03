const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:    { type: String, required: true },
  section:   { type: String, enum: ['A','B'], required: true },
  date:      { type: Date, required: true },
  classType: { type: String, enum: ['Theory','Lab'], default: 'Theory' },
  periods:   { type: Number, default: 1 }, // Theory=1, Lab=3
  status:           { type: String, enum: ['present', 'absent'], required: true },
  topic:            { type: String, default: '' },
  deliveryMethod:   { type: String, default: '' },
  teachingStrategy: { type: String, default: '' }
});

// unique per student + course + date + classType
attendanceSchema.index({ student: 1, course: 1, date: 1, classType: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
