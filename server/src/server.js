/**
 * server.js — Application Entry Point
 *
 * Bootstraps the Express server:
 *  1. Loads environment variables from .env
 *  2. Configures middleware (CORS, JSON parser, rate limiter)
 *  3. Registers route handlers
 *  4. Connects to MongoDB Atlas
 *  5. Starts listening on the configured port
 */

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

// Load .env FIRST — must happen before any process.env reads
dotenv.config();

// Startup diagnostics — confirm critical env vars are present
console.log('\n=== SERVER STARTUP ===');
console.log(`OpenAI Key: ${process.env.OPENAI_API_KEY ? '✓' : '✗ Missing'}`);
console.log(`MongoDB URI: ${process.env.MONGODB_URI ? '✓' : '✗ Missing'}`);
console.log(`JWT Secret: ${process.env.JWT_SECRET ? '✓' : '✗ Missing'}`);

import apiRoutes from './routes/api.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────

// Allow cross-origin requests (required for Vite dev server on port 3000)
app.use(cors());

// Parse JSON bodies; 10MB limit to support base64 image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiter — prevents abuse and brute-force attacks
// Defaults: 100 req / 15 min in production; overridden via .env for development
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Too many requests, please try again later.' }
}));

// ── Health check ──────────────────────────────────────────────────────────────
// Used by CI/CD (GitHub Actions wait-on) and load balancers to verify the server is alive
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Routes ────────────────────────────────────────────────────────────────────
// Auth routes MUST be registered before /api to avoid the /api prefix catching /api/auth/*
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// ── Global error handler ──────────────────────────────────────────────────────
// Catches any error passed via next(err) from controllers
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Database connection → then start server ───────────────────────────────────
// Server only starts listening after MongoDB is confirmed connected
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
    process.exit(1); // Exit with failure code so process managers can restart
  });
