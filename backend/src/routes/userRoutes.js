import express from 'express';
import {
  getAllUsers,
  getPendingUsers,
  updateUserStatus
} from '../controllers/userController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/', getAllUsers);
router.get('/pending', getPendingUsers);
router.put('/:userId/status', updateUserStatus);

export default router;

