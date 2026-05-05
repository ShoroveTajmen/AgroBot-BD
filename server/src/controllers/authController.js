/**
 * authController.js — Authentication Request Handlers
 *
 * Handles HTTP layer concerns (request parsing, validation, response formatting).
 * Delegates all business logic to authService.
 *
 * Exported handlers:
 *   signup  — POST /api/auth/signup
 *   signin  — POST /api/auth/signin
 *   profile — GET  /api/auth/profile (protected)
 */

import { authService } from '../services/authService.js';

/**
 * signup — Register a new user account.
 *
 * Validates required fields and password length, then delegates to
 * authService.register() which handles uniqueness checks, hashing, and token creation.
 *
 * @param {object} req.body - { name, username, email, password, district }
 * @returns {201} { user, token } on success
 * @returns {400} Validation error or duplicate email/username
 */
export const signup = async (req, res) => {
  try {
    const { name, username, email, password, district } = req.body;

    // Validate required fields
    if (!name || !username || !email || !password)
      return res.status(400).json({ error: 'All fields are required' });

    // Enforce minimum password length
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const result = await authService.register({ name, username, email, password, district });
    res.status(201).json(result);
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(400).json({ error: err.message });
  }
};

/**
 * signin — Authenticate an existing user and return a JWT token.
 *
 * @param {object} req.body - { email, password }
 * @returns {200} { user, token } on success
 * @returns {401} Invalid credentials
 */
export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const result = await authService.login({ email, password });
    res.json(result);
  } catch (err) {
    console.error('Signin error:', err.message);
    res.status(401).json({ error: err.message });
  }
};

/**
 * profile — Return the currently authenticated user's profile.
 *
 * req.user is populated by the authenticate middleware before this handler runs.
 * The password field is excluded by authService.findById().
 *
 * @returns {200} { user }
 */
export const profile = async (req, res) => {
  res.json({ user: req.user });
};
