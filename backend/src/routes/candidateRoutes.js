import express from 'express';
import {
  getCandidatesByPoll,
  createCandidate,
  deleteCandidate
} from '../controllers/candidateController.js';
import { authenticateToken } from '../middleware/auth.js';

import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/poll/:pollId', getCandidatesByPoll);
router.post('/poll/:pollId', upload.single('photo'), createCandidate);
router.delete('/:id', deleteCandidate);

export default router;

