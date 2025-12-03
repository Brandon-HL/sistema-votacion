import { Router } from 'express';
import { signUp, signIn, getProfile, signOut } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/signup', signUp);
router.post('/signin', signIn);
router.get('/profile', authenticate, getProfile);
router.post('/signout', authenticate, signOut);

export default router;

