import { Router } from 'express';
import { listExpenses, getExpense, createExpense, updateExpense, deleteExpense, getExpenseSummary } from '../../controllers/expense.controller';

const router = Router();

router.get('/', listExpenses);
router.get('/summary', getExpenseSummary);
router.post('/', createExpense);
router.get('/:id', getExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
