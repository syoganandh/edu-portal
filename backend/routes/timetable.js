const express   = require('express');
const router    = express.Router();
const Timetable = require('../models/Timetable');
const { protect, adminOnly } = require('../middleware/auth');

// GET timetable — students get their section, admin can pass ?section=A or ?section=B
router.get('/', protect, async (req, res) => {
  try {
    let section = req.query.section;
    // For students, use their own section
    if (!section && req.user.role !== 'admin') section = req.user.section;
    if (!section) return res.status(400).json({ message: 'section required' });
    let tt = await Timetable.findOne({ section });
    if (!tt) tt = { section, slots: [] };
    res.json(tt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Save timetable for a specific section
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { section, slots } = req.body;
    if (!section || !['A','B'].includes(section)) return res.status(400).json({ message: 'section A or B required' });
    let tt = await Timetable.findOne({ section });
    if (tt) {
      tt.slots = slots;
      tt.updatedAt = Date.now();
      await tt.save();
    } else {
      tt = await Timetable.create({ section, slots });
    }
    res.json(tt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
