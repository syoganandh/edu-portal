const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driveLink:  { type: String, required: true },
  note:       { type: String, default: '' },
  grade:      { type: String, default: '' },
  feedback:   { type: String, default: '' },
  submittedAt:{ type: Date, default: Date.now }
});

// One submission per student per assignment
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
