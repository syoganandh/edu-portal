const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use(express.static('../')); // Serve static HTML files from root

// ── Routes ──
app.use('/api/auth',  require('./routes/auth'));
app.use('/api/quiz',  require('./routes/quiz'));
app.use('/api/admin', require('./routes/admin'));

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sampathirao Edu Portal API running' });
});

// ── Connect to MongoDB ──
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
