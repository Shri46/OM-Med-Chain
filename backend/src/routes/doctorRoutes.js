import { Router } from 'express';
import { getDoctorByWallet, getDoctors, registerDoctor } from '../controllers/doctorController.js';

const router = Router();

router.post('/register', registerDoctor);
router.get('/', getDoctors);
router.get('/:walletAddress', getDoctorByWallet);

export default router;
