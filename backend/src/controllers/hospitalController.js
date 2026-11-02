import { Hospital } from '../models/Hospital.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const getHospitals = asyncHandler(async (_req, res) => {
  const hospitals = await Hospital.find().sort({ name: 1 });
  res.json(hospitals);
});

export const createHospital = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim().replace(/\s+/g, ' ');
  if (!name) {
    res.status(400);
    throw new Error('Hospital name is required');
  }

  // The same name is the same hospital whatever its case or internal spacing.
  // Oldest match wins so every registration converges on one row.
  const pattern = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+')}$`, 'i');
  const hospital = await Hospital.findOneAndUpdate(
    { name: pattern },
    { $setOnInsert: { name } },
    { upsert: true, new: true, sort: { createdAt: 1 } }
  );

  res.status(201).json(hospital);
});
