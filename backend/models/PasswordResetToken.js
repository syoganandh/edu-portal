const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token:   { type: String, required: true, unique: true },
  expires: { type: Date,   required: true }
});

// Auto-delete expired tokens (MongoDB TTL index)
passwordResetTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
