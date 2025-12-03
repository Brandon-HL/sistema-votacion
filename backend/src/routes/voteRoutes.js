import express from 'express';
import {
  createVote,
  getUserVotes,
  getVoteCounts
} from '../controllers/voteController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createVote);
router.get('/my-votes', getUserVotes);
router.get('/counts/:pollId', getVoteCounts);

export default router;

