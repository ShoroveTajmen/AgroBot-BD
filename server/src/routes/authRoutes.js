import express from 'express';
import { signup, signin, profile } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/profile', authenticate, profile);

export default router;
