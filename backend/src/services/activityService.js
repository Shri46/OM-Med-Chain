import { ActivityLog } from '../models/ActivityLog.js';
import { normalizeWallet } from '../utils/normalizeWallet.js';

export const recordActivity = (payload) => ActivityLog.create({
  walletAddress: normalizeWallet(payload.walletAddress),
  role: payload.role,
  activityType: payload.activityType,
  relatedUser: normalizeWallet(payload.relatedUser || ''),
  relatedName: payload.relatedName || '',
  timestamp: payload.timestamp || new Date(),
});

export const listWalletActivity = (walletAddress) => {
  const wallet = normalizeWallet(walletAddress);
  return ActivityLog.find({
    $or: [{ walletAddress: wallet }, { relatedUser: wallet }],
  }).sort({ timestamp: -1 }).limit(100);
};
