import express from 'express';
import { signUp, signIn, getProfile } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', signUp);
router.post('/signin', signIn);
router.get('/profile', authenticateToken, getProfile);

export default router;

