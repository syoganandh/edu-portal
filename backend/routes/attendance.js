const express    = require('express');
const router     = express.Router();
const Attendance = require('../models/Attendance');
const User       = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// ADMIN: Mark attendance for a class (bulk)
// Body: { course, section, date, classType, periods, topic, records: [{ studentId, status }] }
router.post('/mark', protect, adminOnly, async (req, res) => {
  try {
    const { course, section, date, classType = 'Theory', periods = 1, topic, deliveryMethod, teachingStrategy, records } = req.body;
    const ops = records.map(r => ({
      updateOne: {
        filter: { student: r.studentId, course, date: new Date(date), classType },
        update: { $set: { status: r.status, topic: topic||'', section, periods: Number(periods), deliveryMethod: deliveryMethod||'', teachingStrategy: teachingStrategy||'' } },
        upsert: true
      }
    }));
    await Attendance.bulkWrite(ops);
    res.json({ message: 'Attendance marked', count: records.length });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ADMIN: Get students list for a section
router.get('/students/:course', protect, adminOnly, async (req, res) => {
  try {
    const course   = req.params.course;
    const section  = req.query.section; // optional filter by section
    const query    = course === 'Both' ? {} : { course: { $in: [course, 'Both'] } };
    if (section) query.section = section;
    query.role = 'student';
    const students = await User.find(query)
      .select('name rollNo section course').sort({ rollNo: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: Get attendance records (filterable)
router.get('/records', protect, adminOnly, async (req, res) => {
  try {
    const { course, date, section, classType } = req.query;
    const filter = {};
    if (course && course !== 'All') filter.course = course;
    if (section) filter.section = section;
    if (classType) filter.classType = classType;
    if (date) {
      const d = new Date(date);
      filter.date = { $gte: new Date(d.setHours(0,0,0,0)), $lte: new Date(d.setHours(23,59,59,999)) };
    }
    const records = await Attendance.find(filter)
      .populate('student', 'name rollNo section')
      .sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// STUDENT: Get my attendance summary (periods-weighted)
router.get('/my', protect, async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.user._id });
    const summary = {};
    records.forEach(r => {
      const key = r.course;
      if (!summary[key]) summary[key] = { presentPeriods: 0, totalPeriods: 0, sessions: 0 };
      const p = r.periods || 1;
      summary[key].totalPeriods += p;
      summary[key].sessions++;
      if (r.status === 'present') summary[key].presentPeriods += p;
    });
    const result = Object.entries(summary).map(([course, s]) => ({
      course,
      presentPeriods: s.presentPeriods,
      totalPeriods:   s.totalPeriods,
      sessions:       s.sessions,
      percentage: s.totalPeriods ? Math.round((s.presentPeriods / s.totalPeriods) * 100) : 0
    }));
    res.json({ summary: result, records: records.sort((a,b) => b.date - a.date).slice(0,30) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
