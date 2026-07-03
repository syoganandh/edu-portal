const express    = require('express');
const router     = express.Router();
const Attendance = require('../models/Attendance');
const User       = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// ADMIN: Mark attendance for a class (bulk)
// Body: { course, date, topic, records: [{ studentId, status }] }
router.post('/mark', protect, adminOnly, async (req, res) => {
  try {
    const { course, date, topic, records } = req.body;
    const ops = records.map(r => ({
      updateOne: {
        filter: { student: r.studentId, course, date: new Date(date) },
        update: { $set: { status: r.status, topic: topic||'' } },
        upsert: true
      }
    }));
    await Attendance.bulkWrite(ops);
    res.json({ message: 'Attendance marked', count: records.length });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ADMIN: Get students list for marking attendance
router.get('/students/:course', protect, adminOnly, async (req, res) => {
  try {
    const course = req.params.course;
    const query  = course === 'Both' ? {} : { course: { $in: [course, 'Both'] } };
    const students = await User.find({ ...query, role: 'student' })
      .select('name rollNo section course').sort({ rollNo: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: Get attendance records (filterable by course/date)
router.get('/records', protect, adminOnly, async (req, res) => {
  try {
    const { course, date } = req.query;
    const filter = {};
    if (course && course !== 'All') filter.course = course;
    if (date) { const d = new Date(date); filter.date = { $gte: new Date(d.setHours(0,0,0,0)), $lte: new Date(d.setHours(23,59,59,999)) }; }
    const records = await Attendance.find(filter)
      .populate('student', 'name rollNo section')
      .sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// STUDENT: Get my attendance summary
router.get('/my', protect, async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.user._id });
    const summary = {};
    records.forEach(r => {
      if (!summary[r.course]) summary[r.course] = { present: 0, absent: 0, total: 0 };
      summary[r.course][r.status]++;
      summary[r.course].total++;
    });
    const result = Object.entries(summary).map(([course, s]) => ({
      course, present: s.present, absent: s.absent, total: s.total,
      percentage: s.total ? Math.round((s.present/s.total)*100) : 0
    }));
    res.json({ summary: result, records: records.sort((a,b) => b.date - a.date).slice(0,30) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
