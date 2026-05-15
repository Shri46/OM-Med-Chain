import { Doctor } from '../models/Doctor.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { normalizeWallet } from '../utils/normalizeWallet.js';

export const registerDoctor = asyncHandler(async (req, res) => {
  const payload = { ...req.body, walletAddress: normalizeWallet(req.body.walletAddress) };
  const required = ['name', 'walletAddress', 'hospitalId', 'publicKey', 'specialization', 'phoneNumber', 'email'];
  const missing = required.filter((field) => !payload[field]);
  if (missing.length) {
    res.status(400);
    throw new Error(`Missing doctor fields: ${missing.join(', ')}`);
  }

  const doctor = await Doctor.findOneAndUpdate(
    { walletAddress: payload.walletAddress },
    payload,
    { upsert: true, new: true, runValidators: true }
  ).populate('hospitalId');

  res.status(201).json(doctor);
});

export const getDoctors = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.hospitalId) filter.hospitalId = req.query.hospitalId;
  const doctors = await Doctor.find(filter).populate('hospitalId').sort({ name: 1 });
  res.json(doctors);
});

export const getDoctorByWallet = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ walletAddress: normalizeWallet(req.params.walletAddress) }).populate('hospitalId');
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }
  res.json(doctor);
});
