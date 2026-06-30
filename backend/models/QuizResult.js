const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
  student:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:     { type: String, enum: ['JPP', 'DevOps'], required: true },
  topic:      { type: String, required: true },   // e.g. "OOP Fundamentals"
  quizType:   { type: String, enum: ['mcq', 'trace', 'usecase', 'debug', 'cmdOutput'], required: true },
  score:      { type: Number, required: true },
  total:      { type: Number, required: true },
  percentage: { type: Number, required: true },
  timeTaken:  { type: Number, default: 0 },       // seconds
  takenAt:    { type: Date, default: Date.now }
});

module.exports = mongoose.model('QuizResult', quizResultSchema);
