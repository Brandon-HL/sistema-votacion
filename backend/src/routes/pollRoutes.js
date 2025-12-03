import express from 'express';
import {
  getAllPolls,
  getPollById,
  createPoll,
  updatePoll,
  deletePoll
} from '../controllers/pollController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getAllPolls);
router.get('/:id', getPollById);
router.post('/', requireRole('supervisor', 'admin'), createPoll);
router.put('/:id', updatePoll);
router.delete('/:id', deletePoll);

export default router;

