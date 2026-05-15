import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const Hospital = mongoose.model('Hospital', hospitalSchema);
