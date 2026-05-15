import { Router } from 'express';
import { createActivity, getActivityByWallet } from '../controllers/activityController.js';

const router = Router();

router.post('/', createActivity);
router.get('/:walletAddress', getActivityByWallet);

export default router;
