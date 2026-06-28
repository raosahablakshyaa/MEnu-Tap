import { Router } from 'express';
import { listSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } from '../../controllers/supplier.controller';

const router = Router();

router.get('/', listSuppliers);
router.post('/', createSupplier);
router.get('/:id', getSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;
