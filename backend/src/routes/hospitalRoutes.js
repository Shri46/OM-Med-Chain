import { Router } from 'express';
import { createHospital, getHospitals } from '../controllers/hospitalController.js';

const router = Router();

router.route('/').get(getHospitals).post(createHospital);

export default router;
