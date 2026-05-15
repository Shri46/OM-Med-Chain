import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  walletAddress: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
  publicKey: { type: String, required: true },
  specialization: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const Doctor = mongoose.model('Doctor', doctorSchema);
