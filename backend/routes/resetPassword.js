const express    = require('express');
const router     = express.Router();
const crypto     = require('crypto');
const bcrypt     = require('bcryptjs');
const nodemailer = require('nodemailer');
const User       = require('../models/User');

// In-memory reset token store (token -> { userId, expires })
const resetTokens = {};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// POST /api/reset/request
router.post('/request', async (req, res) => {
  try {
    const { rollNo } = req.body;
    const user = await User.findOne({ rollNo: rollNo.toUpperCase() });
    if (!user || !user.email) return res.json({ message: 'If this roll number exists, a reset email has been sent.' });

    const token   = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 30 * 60 * 1000; // 30 minutes
    resetTokens[token] = { userId: user._id, expires };

    const resetUrl = `${process.env.SITE_URL || 'https://250995.xyz'}/reset-password.html?token=${token}`;

    await transporter.sendMail({
      from: `"Sampathirao Edu Portal" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset — Edu Portal',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="color:#F07C3E">Password Reset</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Click the button below to reset your password. This link expires in <strong>30 minutes</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:#F07C3E;color:#111;border-radius:8px;font-weight:700;text-decoration:none;margin:16px 0">Reset Password</a>
          <p style="color:#999;font-size:.85em">If you did not request this, ignore this email.</p>
        </div>`
    });

    res.json({ message: 'If this roll number exists, a reset email has been sent.' });
  } catch (err) {
    console.error('Reset email error:', err.message);
    res.status(500).json({ message: 'Failed to send email. Contact admin.' });
  }
});

// POST /api/reset/confirm
router.post('/confirm', async (req, res) => {
  try {
    const { token, password } = req.body;
    const record = resetTokens[token];
    if (!record || record.expires < Date.now()) {
      return res.status(400).json({ message: 'Reset link is invalid or expired.' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    await User.findByIdAndUpdate(record.userId, { password: hashed });
    delete resetTokens[token];
    res.json({ message: 'Password reset successful. You can now login.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
