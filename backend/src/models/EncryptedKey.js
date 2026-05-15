import mongoose from 'mongoose';

const encryptedKeySchema = new mongoose.Schema({
  patientWallet: { type: String, required: true, lowercase: true, trim: true, index: true },
  doctorWallet: { type: String, required: true, lowercase: true, trim: true, index: true },
  cid: { type: String, required: true, trim: true, index: true },
  encryptedAESKeyForPatient: { type: String, required: true },
  encryptedAESKeyForDoctor: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: true } });

encryptedKeySchema.index({ patientWallet: 1, doctorWallet: 1, cid: 1 }, { unique: true });

export const EncryptedKey = mongoose.model('EncryptedKey', encryptedKeySchema);
