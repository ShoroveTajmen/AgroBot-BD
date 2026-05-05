/**
 * authService.js — Authentication Business Logic
 *
 * Centralises all auth operations: user registration, login,
 * JWT signing/verification, and safe user serialisation.
 *
 * Keeping this logic in a service (rather than the controller) makes it
 * independently testable and reusable across routes.
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

// Read secrets at call time (not at import time) so dotenv.config() has already run
const getSecret = () => process.env.JWT_SECRET;
const getExpiry = () => process.env.JWT_EXPIRY || '7d';

export const authService = {

  /**
   * register — Create a new user account.
   *
   * Checks for duplicate email and username, hashes the password with bcrypt,
   * persists the user, and returns a signed JWT alongside the safe user object.
   *
   * @param {object} params - { name, username, email, password, district }
   * @throws {Error} If email or username is already taken
   * @returns {{ user: object, token: string }}
   */
  async register({ name, username, email, password, district }) {
    // Uniqueness checks — throw descriptive errors for the controller to forward
    if (await User.findOne({ email })) throw new Error('Email already registered');
    if (await User.findOne({ username })) throw new Error('Username already taken');

    // Hash password with bcrypt (10 salt rounds ≈ ~100ms, good balance of security/speed)
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, username, email, password: hashed, district: district || '' });
    console.log('✓ User created:', user._id, user.email);

    return { user: this._safe(user), token: this.sign(user._id) };
  },

  /**
   * login — Authenticate an existing user.
   *
   * Uses bcrypt.compare() for timing-safe password verification.
   * Returns a generic error message for both "user not found" and "wrong password"
   * to prevent user enumeration attacks.
   *
   * @param {object} params - { email, password }
   * @throws {Error} If credentials are invalid
   * @returns {{ user: object, token: string }}
   */
  async login({ email, password }) {
    const user = await User.findOne({ email });
    if (!user) throw new Error('Invalid email or password');

    // bcrypt.compare is timing-safe — prevents timing attacks
    if (!(await bcrypt.compare(password, user.password))) throw new Error('Invalid email or password');

    return { user: this._safe(user), token: this.sign(user._id) };
  },

  /**
   * sign — Create a signed JWT for a given userId.
   *
   * @param {string} userId - MongoDB ObjectId of the user
   * @returns {string} Signed JWT token
   */
  sign(userId) {
    return jwt.sign({ userId }, getSecret(), { expiresIn: getExpiry() });
  },

  /**
   * verify — Decode and verify a JWT token.
   *
   * @param {string} token - JWT string (without "Bearer " prefix)
   * @throws {JsonWebTokenError} If token is invalid or expired
   * @returns {object} Decoded payload { userId }
   */
  verify(token) {
    return jwt.verify(token, getSecret());
  },

  /**
   * findById — Fetch a user by ID, excluding the password field.
   *
   * @param {string} id - MongoDB ObjectId
   * @returns {object|null} User document without password
   */
  async findById(id) {
    return User.findById(id).select('-password');
  },

  /**
   * _safe — Strip sensitive fields before sending user data to the client.
   *
   * Never returns the hashed password in API responses.
   *
   * @param {object} u - Mongoose User document
   * @returns {object} Safe user object { _id, name, username, email, district }
   */
  _safe(u) {
    return { _id: u._id, name: u.name, username: u.username, email: u.email, district: u.district };
  }
};
