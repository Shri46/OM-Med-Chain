import { Patient } from '../models/Patient.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { normalizeWallet } from '../utils/normalizeWallet.js';

const patientFields = [
  'name', 'walletAddress', 'hospitalId', 'publicKey', 'dob', 'gender', 'bloodGroup',
  'phoneNumber', 'email', 'guardianName', 'guardianPhone', 'guardianEmail',
  'allergies', 'chronicConditions', 'emergencyNotes',
];

export const registerPatient = asyncHandler(async (req, res) => {
  const payload = Object.fromEntries(patientFields.map((field) => [field, req.body[field]]));
  payload.walletAddress = normalizeWallet(payload.walletAddress);
  const required = patientFields.filter((field) => !['allergies', 'chronicConditions', 'emergencyNotes'].includes(field));
  const missing = required.filter((field) => !payload[field]);
  if (missing.length) {
    res.status(400);
    throw new Error(`Missing patient fields: ${missing.join(', ')}`);
  }

  const patient = await Patient.findOneAndUpdate(
    { walletAddress: payload.walletAddress },
    payload,
    { upsert: true, new: true, runValidators: true }
  ).populate('hospitalId');

  res.status(201).json(patient);
});

export const getPatientByWallet = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ walletAddress: normalizeWallet(req.params.walletAddress) }).populate('hospitalId');
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }
  res.json(patient);
});

export const updatePatient = asyncHandler(async (req, res) => {
  const update = Object.fromEntries(patientFields.filter((field) => field !== 'walletAddress' && field in req.body).map((field) => [field, req.body[field]]));
  const patient = await Patient.findOneAndUpdate(
    { walletAddress: normalizeWallet(req.params.walletAddress) },
    update,
    { new: true, runValidators: true }
  ).populate('hospitalId');

  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  res.json(patient);
});
