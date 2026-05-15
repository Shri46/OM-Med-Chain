import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  walletAddress: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
  publicKey: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, required: true, trim: true },
  bloodGroup: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  guardianName: { type: String, required: true, trim: true },
  guardianPhone: { type: String, required: true, trim: true },
  guardianEmail: { type: String, required: true, trim: true, lowercase: true },
  allergies: { type: String, default: '', trim: true },
  chronicConditions: { type: String, default: '', trim: true },
  emergencyNotes: { type: String, default: '', trim: true },
}, { timestamps: { createdAt: true, updatedAt: true } });

export const Patient = mongoose.model('Patient', patientSchema);
