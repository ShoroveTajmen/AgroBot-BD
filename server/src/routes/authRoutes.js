/**
 * authRoutes.js — Authentication Route Definitions
 *
 * Mounts under /api/auth (registered in server.js)
 *
 * Public routes (no token required):
 *   POST /api/auth/signup  → register a new user
 *   POST /api/auth/signin  → login and receive a JWT token
 *
 * Protected routes (Bearer token required):
 *   GET  /api/auth/profile → return the currently authenticated user's profile
 */

import express from 'express';
import { signup, signin, profile } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public — no authentication needed
router.post('/signup', signup);
router.post('/signin', signin);

// Protected — requires a valid JWT in the Authorization header
router.get('/profile', authenticate, profile);

export default router;
