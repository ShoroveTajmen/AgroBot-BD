/**
 * api.js — Chat & Conversation Route Definitions
 *
 * Mounts under /api (registered in server.js)
 * All routes require a valid JWT token via the authenticate middleware.
 *
 * Routes:
 *   POST   /api/chat                  → send a message, receive AI advisory response
 *   GET    /api/conversations         → list all conversations for the logged-in user
 *   GET    /api/conversations/:id     → get a single conversation with full message history
 *   DELETE /api/conversations/:id     → permanently delete a conversation
 */

import express from 'express';
import { chat, getConversations, getConversation, deleteConversation } from '../controllers/chatController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// All chat routes require authentication
router.post('/chat', authenticate, chat);
router.get('/conversations', authenticate, getConversations);
router.get('/conversations/:id', authenticate, getConversation);
router.delete('/conversations/:id', authenticate, deleteConversation);

export default router;
