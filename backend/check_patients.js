import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Patient } from './src/models/Patient.js';
import dns from 'dns';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      family: 4
    });
    const count = await Patient.countDocuments();
    const patients = await Patient.find();
    console.log(`Patients count: ${count}`);
    console.log(`Patients:`, patients);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
