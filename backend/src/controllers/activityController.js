import { asyncHandler } from '../middleware/asyncHandler.js';
import { listWalletActivity, recordActivity } from '../services/activityService.js';

export const createActivity = asyncHandler(async (req, res) => {
  const log = await recordActivity(req.body);
  res.status(201).json(log);
});

export const getActivityByWallet = asyncHandler(async (req, res) => {
  const logs = await listWalletActivity(req.params.walletAddress);
  res.json(logs);
});
