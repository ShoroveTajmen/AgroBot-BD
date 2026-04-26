import express from 'express';
import { chat } from '../controllers/chatController.js';
import { getSessions, createSession } from '../controllers/sessionController.js';

const router = express.Router();

// Chat endpoint
router.post('/chat', chat);

// Session endpoints
router.get('/sessions', getSessions);
router.post('/sessions', createSession);

export default router;
