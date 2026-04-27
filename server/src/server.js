import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

// Load env FIRST
dotenv.config();

console.log('\n=== SERVER STARTUP ===');
console.log(`OpenAI Key: ${process.env.OPENAI_API_KEY ? '✓' : '✗ Missing'}`);
console.log(`MongoDB URI: ${process.env.MONGODB_URI ? '✓' : '✗ Missing'}`);
console.log(`JWT Secret: ${process.env.JWT_SECRET ? '✓' : '✗ Missing'}`);

import apiRoutes from './routes/api.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Too many requests, please try again later.' }
}));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Auth routes MUST come before /api to avoid route conflict
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✓ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log('=== SERVER READY ===\n');
    });
  })
  .catch(err => {
    console.error('✗ MongoDB connection error:', err);
    process.exit(1);
  });
