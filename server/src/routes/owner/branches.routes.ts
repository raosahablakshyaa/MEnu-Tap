import { Router } from 'express';
import { listBranches, getBranch, createBranch, updateBranch, deleteBranch, getBranchComparison } from '../../controllers/branch.controller';

const router = Router();

router.get('/', listBranches);
router.get('/comparison', getBranchComparison);
router.post('/', createBranch);
router.get('/:id', getBranch);
router.put('/:id', updateBranch);
router.delete('/:id', deleteBranch);

export default router;
