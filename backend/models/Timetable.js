const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  day:              { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], required: true },
  time:             { type: String, required: true },
  subject:          { type: String, required: true },
  course:           { type: String, enum: ['JPP','DevOps','Both'], required: true },
  room:             { type: String, default: '' },
  deliveryMethod:   { type: String, default: '' },
  teachingStrategy: { type: String, default: '' }
}, { _id: true });

const timetableSchema = new mongoose.Schema({
  section:   { type: String, enum: ['A','B'], required: true, unique: tru