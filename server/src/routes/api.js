import express from 'express';
import { chat, getConversations, getConversation } from '../controllers/chatController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// All chat routes require authentication
router.post('/chat', authenticate, chat);
router.get('/conversations', authenticate, getConversations);
router.get('/conversations/:id', authenticate, getConversation);

export default router;
