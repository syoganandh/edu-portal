const express = require('express');
const User = require('../models/User');
const QuizResult = require('../models/QuizResult');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All admin routes require login + admin role
router.use(protect, adminOnly);

// GET /api/admin/students — all users (students + admins)
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({}).select('-password').sort({ section: 1, rollNo: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/results — first attempt only per student+topic+quizType
router.get('/results', async (req, res) => {
  try {
    const results = await QuizResult.aggregate([
      { $sort: { takenAt: 1 } },                              // oldest first
      { $group: {
          _id: { student: '$student', topic: '$topic', quizType: '$quizType' },
          doc: { $first: '$$ROOT' }                           // keep first attempt
        }
      },
      { $replaceRoot: { newRoot: '$doc' } },
      { $lookup: { from: 'users', localField: 'student', foreignField: '_id', as: 'studentArr' } },
      { $addFields: { student: { $arrayElemAt: ['$studentArr', 0] } } },
      { $project: { studentArr: 0, 'student.password': 0, 'student.__v': 0 } },
      { $sort: { 'student.section': 1, 'student.rollNo': 1, takenAt: 1 } }
    ]);
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

// PUT /api/admin/student/:id/role — promote to admin or demote to student
router.put('/student/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Role must be admin or student.' });
    }
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, select: '-password' }
    );
    if (!updated) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: `Role updated to ${role}`, user: updated });
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
