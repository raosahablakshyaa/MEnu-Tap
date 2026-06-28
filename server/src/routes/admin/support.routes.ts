import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { validateQuery, validateBody, validateParams } from '../../middlewares';
import { paginationSchema, replyTicketSchema, internalNoteSchema } from '../../validators/admin.validator';
import { adminSupportService } from '../../services/admin/support.service';
import { z } from 'zod';

const router = Router();

router.get('/', validateQuery(paginationSchema.extend({
  status: z.string().optional(),
  priority: z.string().optional(),
  assignedTo: z.string().optional(),
})),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tickets = await adminSupportService.list(req.query as never);
    sendSuccess(res, 'Tickets retrieved', tickets);
  })
);

router.get('/:id', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const ticket = await adminSupportService.getById(req.params.id as string);
    sendSuccess(res, 'Ticket retrieved', ticket);
  })
);

router.post('/:id/assign', validateParams(z.object({ id: z.string() })),
  validateBody(z.object({ assignedTo: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const ticket = await adminSupportService.assign(req.params.id as string, req.body.assignedTo, req);
    sendSuccess(res, 'Ticket assigned', ticket);
  })
);

router.post('/:id/reply', validateParams(z.object({ id: z.string() })), validateBody(replyTicketSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const ticket = await adminSupportService.reply(req.params.id as string, req.body.message, req, req.body.isInternal);
    sendSuccess(res, 'Reply sent', ticket);
  })
);

router.post('/:id/close', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const ticket = await adminSupportService.close(req.params.id as string, req);
    sendSuccess(res, 'Ticket closed', ticket);
  })
);

router.post('/:id/reopen', validateParams(z.object({ id: z.string() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const ticket = await adminSupportService.reopen(req.params.id as string, req);
    sendSuccess(res, 'Ticket reopened', ticket);
  })
);

router.post('/:id/notes', validateParams(z.object({ id: z.string() })), validateBody(internalNoteSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const ticket = await adminSupportService.addInternalNote(req.params.id as string, req.body.note, req);
    sendSuccess(res, 'Note added', ticket);
  })
);

export default router;
