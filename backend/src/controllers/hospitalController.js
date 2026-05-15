import { Hospital } from '../models/Hospital.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const getHospitals = asyncHandler(async (_req, res) => {
  const hospitals = await Hospital.find().sort({ name: 1 });
  res.json(hospitals);
});

export const createHospital = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim();
  if (!name) {
    res.status(400);
    throw new Error('Hospital name is required');
  }

  const hospital = await Hospital.findOneAndUpdate(
    { name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    { $setOnInsert: { name } },
    { upsert: true, new: true }
  );

  res.status(201).json(hospital);
});
