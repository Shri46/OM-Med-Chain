import { Router } from 'express';
import { getEncryptedKeysByCid, storeEncryptedKey } from '../controllers/keyController.js';

const router = Router();

router.post('/store', storeEncryptedKey);
router.get('/:cid', getEncryptedKeysByCid);

export default router;
