const express = require('express');
const QuizResult = require('../models/QuizResult');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/quiz/save  — save a quiz result
router.post('/save', protect, async (req, res) => {
  try {
    const { course, topic, quizType, score, total, timeTaken } = req.body;
    const percentage = Math.round((score / total) * 100);

    const result = await QuizResult.create({
      student: req.user._id,
      course, topic, quizType, score, total, percentage, timeTaken
    });

    res.status(201).json({ message: 'Result saved', result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/quiz/my  — get logged-in student's results
router.get('/my', protect, async (req, res) => {
  try {
    const results = await QuizResult.find({ student: req.user._id })
      .sort({ takenAt: -1 });

    // Build summary per topic
    const summary = {};
    results.forEach(r => {
      const key = `${r.course}::${r.topic}`;
      if (!summary[key]) summary[key] = { course: r.course, topic: r.topic, attempts: 0, bestScore: 0, bestPct: 0 };
      summary[key].attempts++;
      if (r.percentage > summary[key].bestPct) {
        summary[key].bestPct = r.percentage;
        summary[key].bestScore = r.score;
        summary[key].total = r.total;
      }
    });

    res.json({ results, summary: Object.values(summary) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/quiz/leaderboard/:course
router.get('/leaderboard/:course', protect, async (req, res) => {
  try {
    const data = await QuizResult.aggregate([
      { $match: { course: req.params.course } },
      { $group: {
          _id: '$student',
          avgPct: { $avg: '$percentage' },
          totalAttempts: { $sum: 1 },
          bestPct: { $max: '$percentage' }
        }
      },
      { $sort: { avgPct: -1 } },
      { $limit: 20 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'student' } },
      { $unwind: '$student' },
      { $project: { name: '$student.name', rollNo: '$student.rollNo', avgPct: 1, bestPct: 1, totalAttempts: 1 } }
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
