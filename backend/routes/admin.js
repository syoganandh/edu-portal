const express = require('express');
const User = require('../models/User');
const QuizResult = require('../models/QuizResult');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All admin routes require login + admin role
router.use(protect, adminOnly);

// GET /api/admin/students — all students
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').sort({ rollNo: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/results — all quiz results
router.get('/results', async (req, res) => {
  try {
    const results = await QuizResult.find()
      .populate('student', 'name rollNo section')
      .sort({ takenAt: -1 })
      .limit(500);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/stats — overall stats
router.get('/stats', async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalAttempts = await QuizResult.countDocuments();
    const avgPct = await QuizResult.aggregate([
      { $group: { _id: null, avg: { $avg: '$percentage' } } }
    ]);
    const courseBreakdown = await QuizResult.aggregate([
      { $group: { _id: '$course', count: { $sum: 1 }, avgPct: { $avg: '$percentage' } } }
    ]);
    res.json({
      totalStudents,
      totalAttempts,
      avgPct: avgPct[0]?.avg?.toFixed(1) || 0,
      courseBreakdown
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/student/:id
router.delete('/student/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await QuizResult.deleteMany({ student: req.params.id });
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
