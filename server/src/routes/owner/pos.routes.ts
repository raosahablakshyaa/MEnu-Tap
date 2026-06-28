import { Router } from 'express';
import { createBill, listTransactions, getTransaction, voidBill, generateGstInvoice, getDailySummary } from '../../controllers/pos.controller';

const router = Router();

router.get('/', listTransactions);
router.get('/daily-summary', getDailySummary);
router.post('/bill', createBill);
router.get('/:id', getTransaction);
router.patch('/:id/void', voidBill);
router.post('/:id/gst-invoice', generateGstInvoice);

export default router;
