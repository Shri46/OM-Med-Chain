import { EncryptedKey } from '../models/EncryptedKey.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { normalizeWallet } from '../utils/normalizeWallet.js';

export const storeEncryptedKey = asyncHandler(async (req, res) => {
  const payload = {
    patientWallet: normalizeWallet(req.body.patientWallet),
    doctorWallet: normalizeWallet(req.body.doctorWallet),
    cid: req.body.cid,
    encryptedAESKeyForPatient: req.body.encryptedAESKeyForPatient,
    encryptedAESKeyForDoctor: req.body.encryptedAESKeyForDoctor,
  };

  const missing = Object.entries(payload).filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) {
    res.status(400);
    throw new Error(`Missing encrypted key fields: ${missing.join(', ')}`);
  }

  const encryptedKey = await EncryptedKey.findOneAndUpdate(
    { patientWallet: payload.patientWallet, doctorWallet: payload.doctorWallet, cid: payload.cid },
    payload,
    { upsert: true, new: true, runValidators: true }
  );

  res.status(201).json(encryptedKey);
});

export const getEncryptedKeysByCid = asyncHandler(async (req, res) => {
  const keys = await EncryptedKey.find({ cid: req.params.cid });
  res.json(keys);
});
