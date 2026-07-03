const express   = require('express');
const router    = express.Router();
const Timetable = require('../models/Timetable');
const { protect, adminOnly } = require('../middleware/auth');

// Get timetable (all users)
router.get('/', protect, async (req, res) => {
  try {
    let tt = await Timetable.findOne();
    if (!tt) tt = { slots: [] };
    res.json(tt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Save full timetable (replace all slots)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { slots } = req.body;
    let tt = await Timetable.findOne();
    if (tt) {
      tt.slots = slots;
      tt.updatedAt = Date.now();
      await tt.save();
    } else {
      tt = await Timetable.create({ slots });
    }
    res.json(tt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
