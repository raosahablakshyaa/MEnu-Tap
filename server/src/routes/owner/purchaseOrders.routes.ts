import { Router } from 'express';
import { listPOs, getPO, createPO, updatePOStatus, receiveItems } from '../../controllers/purchaseOrder.controller';

const router = Router();

router.get('/', listPOs);
router.post('/', createPO);
router.get('/:id', getPO);
router.patch('/:id/status', updatePOStatus);
router.post('/:id/receive', receiveItems);

export default router;
