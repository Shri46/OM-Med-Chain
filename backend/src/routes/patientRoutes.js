import { Router } from 'express';
import { getPatientByWallet, registerPatient, updatePatient } from '../controllers/patientController.js';

const router = Router();

router.post('/register', registerPatient);
router.get('/:walletAddress', getPatientByWallet);
router.put('/update/:walletAddress', updatePatient);

export default router;
