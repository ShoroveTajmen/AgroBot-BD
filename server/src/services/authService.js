import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

// Read at call time (not at import time) so dotenv.config() has already run
const getSecret = () => process.env.JWT_SECRET;
const getExpiry = () => process.env.JWT_EXPIRY || '7d';

export const authService = {
  async register({ name, username, email, password, district }) {
    if (await User.findOne({ email })) throw new Error('Email already registered');
    if (await User.findOne({ username })) throw new Error('Username already taken');

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, username, email, password: hashed, district: district || '' });
    console.log('✓ User created:', user._id, user.email);

    return { user: this._safe(user), token: this.sign(user._id) };
  },

  async login({ email, password }) {
    const user = await User.findOne({ email });
    if (!user) throw new Error('Invalid email or password');
    if (!(await bcrypt.compare(password, user.password))) throw new Error('Invalid email or password');
    return { user: this._safe(user), token: this.sign(user._id) };
  },

  sign(userId) {
    return jwt.sign({ userId }, getSecret(), { expiresIn: getExpiry() });
  },

  verify(token) {
    return jwt.verify(token, getSecret());
  },

  async findById(id) {
    return User.findById(id).select('-password');
  },

  _safe(u) {
    return { _id: u._id, name: u.name, username: u.username, email: u.email, district: u.district };
  }
};
