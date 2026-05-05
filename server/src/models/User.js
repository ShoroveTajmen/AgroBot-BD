/**
 * User.js — MongoDB User Schema
 *
 * Represents a registered farmer on the AgroBot BD platform.
 *
 * Fields:
 *   name      — Full display name (required)
 *   username  — Unique login handle, stored lowercase (required)
 *   email     — Unique email address, stored lowercase (required)
 *   password  — bcrypt-hashed password, minimum 6 characters (required)
 *   district  — Farmer's Bangladesh district for weather lookups (optional)
 *
 * Timestamps (auto-managed by Mongoose):
 *   createdAt — Account creation date
 *   updatedAt — Last profile update date
 */

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email:    { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 }, // stored as bcrypt hash
    district: { type: String, trim: true, default: '' }       // optional, used for weather context
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

export const User = mongoose.model('User', userSchema);
