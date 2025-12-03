import { Router } from 'express';
import { createVote, getUserVotes, getVoteCounts } from '../controllers/votesController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, authorize('voter', 'admin'), createVote);
router.get('/my-votes', authenticate, getUserVotes);
router.get('/poll/:pollId/counts', authenticate, authorize('supervisor', 'admin'), getVoteCounts);

export default router;

