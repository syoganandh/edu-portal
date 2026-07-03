const express = require('express');
const router  = express.Router();
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { protect, adminOnly } = require('../middleware/auth');

// ── ADMIN: Create assignment ──
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, description, course, dueDate, driveLink } = req.body;
    const assignment = await Assignment.create({ title, description, course, dueDate, driveLink });
    res.status(201).json(assignment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── ADMIN: Get all assignments with submission counts ──
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    const withCounts = await Promise.all(assignments.map(async a => {
      const count = await Submission.countDocuments({ assignment: a._id });
      return { ...a.toObject(), submissionCount: count };
    }));
    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── ADMIN: Get submissions for an assignment ──
router.get('/:id/submissions', protect, adminOnly, async (req, res) => {
  try {
    const submissions = await Submission.find({ assignment: req.params.id })
      .populate('student', 'name rollNo section course')
      .sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── ADMIN: Grade a submission ──
router.put('/submission/:id/grade', protect, adminOnly, async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const sub = await Submission.findByIdAndUpdate(
      req.params.id,
      { grade, feedback },
      { new: true }
    );
    res.json(sub);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── ADMIN: Delete assignment ──
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    await Submission.deleteMany({ assignment: req.params.id });
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── STUDENT: Get assignments for their course ──
router.get('/', protect, async (req, res) => {
  try {
    const userCourse = req.user.course;
    const query = userCourse === 'Both'
      ? {}
      : { course: { $in: [userCourse, 'Both'] } };
    const assignments = await Assignment.find(query).sort({ dueDate: 1 });

    // Attach student's own submission status
    const result = await Promise.all(assignments.map(async a => {
      const sub = await Submission.findOne({ assignment: a._id, student: req.user._id });
      return { ...a.toObject(), mySubmission: sub || null };
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── STUDENT: Submit assignment ──
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const { driveLink, note } = req.body;
    const existing = await Submission.findOne({ assignment: req.params.id, student: req.user._id });
    if (existing) {
      existing.driveLink = driveLink;
      existing.note = note || '';
      existing.submittedAt = Date.now();
      await existing.save();
      return res.json(existing);
    }
    const sub = await Submission.create({
      assignment: req.params.id,
      student: req.user._id,
      driveLink,
      note: note || ''
    });
    res.status(201).json(sub);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
