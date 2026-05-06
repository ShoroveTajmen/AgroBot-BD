/**
 * Conversation.js — MongoDB Conversation & Message Schemas
 *
 * A Conversation belongs to one User and contains an ordered array of Messages.
 * Each Message is an embedded sub-document (no separate collection).
 *
 * Conversation fields:
 *   userId    — Reference to the owning User (indexed for fast per-user queries)
 *   title     — Auto-generated from the first 50 chars of the first message
 *   messages  — Ordered array of embedded Message documents
 *
 * Message fields:
 *   role      — "user" (farmer) or "assistant" (AgroBot)
 *   content   — The text content of the message
 *   advisory  — Structured advisory card object (only on assistant messages with a diagnosis)
 *
 * Timestamps are added to both schemas automatically by Mongoose.
 */

import mongoose from 'mongoose';

/**
 * messageSchema — Embedded schema for individual chat messages.
 *
 * The advisory field uses Mixed type to store the flexible advisory card object:
 * { likelyDisease, confidence, causeType, recommendedActions, escalateToAgronomist }
 * It is null for user messages and for bot follow-up questions (no diagnosis yet).
 */
const messageSchema = new mongoose.Schema(
  {
    role:                 { type: String, enum: ['user', 'assistant'], required: true },
    content:              { type: String, required: true },
    advisory:             { type: mongoose.Schema.Types.Mixed, default: null },
    imageAnalyzed:        { type: Boolean, default: false },
    // Stores the full "[Image Analysis: ...]" context string separately from
    // display content so the agent can use it without polluting the UI.
    imageAnalysisSummary: { type: String, default: null }
  },
  { timestamps: true }
);

/**
 * conversationSchema — Top-level schema for a chat session.
 *
 * userId is indexed because the most common query is:
 *   Conversation.find({ userId }) — fetch all conversations for a user
 */
const conversationSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:    { type: String, default: 'New Chat' },
    messages: [messageSchema]
  },
  { timestamps: true }
);

export const Conversation = mongoose.model('Conversation', conversationSchema);
