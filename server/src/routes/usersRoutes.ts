import { Router } from 'express';
import { getAllUsers, getPendingUsers, updateUserStatus } from '../controllers/usersController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, authorize('admin'), getAllUsers);
router.get('/pending', authenticate, authorize('admin'), getPendingUsers);
router.patch('/:userId/status', authenticate, authorize('admin'), updateUserStatus);

export default router;

