import { Router } from 'express';
import { getPolls, getPollById, createPoll, updatePoll } from '../controllers/pollsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getPolls);
router.get('/:id', authenticate, getPollById);
router.post('/', authenticate, authorize('supervisor', 'admin'), createPoll);
router.patch('/:id', authenticate, updatePoll);

export default router;

