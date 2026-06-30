const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, rollNo, email, password, section, course } = req.body;

    if (!name || !rollNo || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const exists = await User.findOne({ $or: [{ email }, { rollNo }] });
    if (exists) return res.status(400).json({ message: 'Roll No or Email already registered' });

    const user = await User.create({ name, rollNo, email, password, section, course });

    res.status(201).json({
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, rollNo: user.rollNo, email: user.email, role: user.role, course: user.course }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { rollNo, password } = req.body;

    const user = await User.findOne({ rollNo });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid Roll No or Password' });

    res.json({
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, rollNo: user.rollNo, email: user.email, role: user.role, course: user.course }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
