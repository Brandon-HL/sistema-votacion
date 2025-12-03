import { Router } from 'express';
import { getCandidates, createCandidate, deleteCandidate } from '../controllers/candidatesController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/poll/:pollId', authenticate, getCandidates);
router.post('/poll/:pollId', authenticate, authorize('supervisor', 'admin'), createCandidate);
router.delete('/:id', authenticate, authorize('supervisor', 'admin'), deleteCandidate);

export default router;

