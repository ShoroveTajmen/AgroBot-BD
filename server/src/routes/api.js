import express from 'express';
import { chat } from '../controllers/chatController.js';
import { getSessions, createSession } from '../controllers/sessionController.js';

const router = express.Router();

console.log('Routes loaded');

// Chat endpoint
router.post('/chat', (req, res) => {
  console.log(`[POST /api/chat] ${req.body.message?.substring(0, 50)}...`);
  chat(req, res);
});

// Session endpoints
router.get('/sessions', (req, res) => {
  console.log('[GET /api/sessions]');
  getSessions(req, res);
});

router.post('/sessions', (req, res) => {
  console.log('[POST /api/sessions]');
  createSession(req, res);
});

export default router;
