const express = require('express');
const router  = express.Router();
const Notice  = require('../models/Notice');
const { protect, adminOnly } = require('../middleware/auth');

// ADMIN: Create notice
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, message, type, course } = req.body;
    const notice = await Notice.create({ title, message, type, course });
    res.status(201).json(notice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ADMIN: Delete notice
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notice deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ALL: Get notices (students get their course notices)
router.get('/', protect, async (req, res) => {
  try {
    const userCourse = req.user.course;
    const query = userCourse === 'Both' || req.user.role === 'admin'
      ? {}
      : { course: { $in: [userCourse, 'Both'] } };
    const notices = await Notice.find(query).sort({ createdAt: -1 });
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
