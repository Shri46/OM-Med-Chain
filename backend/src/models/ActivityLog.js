import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, lowercase: true, trim: true, index: true },
  role: { type: String, enum: ['patient', 'doctor', 'hospital', 'system'], required: true },
  activityType: { type: String, required: true, trim: true },
  relatedUser: { type: String, default: '', lowercase: true, trim: true },
  relatedName: { type: String, default: '', trim: true },
  timestamp: { type: Date, default: Date.now, index: true },
}, { versionKey: false });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
