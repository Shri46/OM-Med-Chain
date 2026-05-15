import dotenv from 'dotenv';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Med-Chain API running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Unable to start API:', error);
    process.exit(1);
  });
