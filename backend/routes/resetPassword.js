const express    = require('express');
const router     = express.Router();
const crypto     = require('crypto');
const bcrypt     = require('bcryptjs');
const nodemailer = require('nodemailer');
const User                = require('../models/User');
const PasswordResetToken  = require('../models/PasswordResetToken');

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
    if (!rollNo) return res.status(400).json({ message: 'Roll number is required.' });

    const user = await User.findOne({ rollNo: rollNo.trim().toUpperCase() });

    // Always respond the same way (security: don't reveal if roll number exists)
    const genericMsg = 'If this roll number exists, a reset link has been sent to the registered email.';

    if (!user || !user.email) return res.json({ message: genericMsg });

    // Remove any existing tokens for this user
    await PasswordResetToken.deleteMany({ userId: user._id });

    // Create new token stored in MongoDB (survives server restarts)
    const token   = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await PasswordResetToken.create({ userId: user._id, token, expires });

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
          <p style="color:#888;font-size:.85em">If the button doesn't work, copy this link:<br><a href="${resetUrl}" style="color:#F07C3E;word-break:break-all">${resetUrl}</a></p>
          <p style="color:#999;font-size:.82em;margin-top:20px">If you did not request this, ignore this email.</p>
        </div>`
    });

    res.json({ message: genericMsg });
  } catch (err) {
    console.error('Reset email error:', err.message);
    res.status(500).json({ message: 'Failed to send reset email. Please contact admin.' });
  }
});

// POST /api/reset/confirm
router.post('/confirm', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and password are required.' });

    // Look up token in MongoDB
    const record = await PasswordResetToken.findOne({ token });

    if (!record) {
      return res.status(400).json({ message: 'Reset link is invalid or has already been used.' });
    }
    if (record.expires < new Date()) {
      await PasswordResetToken.deleteOne({ token });
      return res.status(400).json({ message: 'Reset link has expired. Please request a new one.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const salt   = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    await User.findByIdAndUpdate(record.userId, { password: hashed });

    // Delete the token so it can't be reused
    await PasswordResetToken.deleteOne({ token });

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    console.error('Reset confirm error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
