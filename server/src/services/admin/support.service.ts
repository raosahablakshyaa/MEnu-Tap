import { SupportTicket } from '../../models';
import { auditLogService } from '../auditLog.service';
import { getPaginationParams, paginateResult, buildSearchFilter, QueryOptions } from '../../utils/pagination';
import { NotFoundError } from '../../utils/errors';
import { AuthenticatedRequest } from '../../types';
import { Types } from 'mongoose';

export class AdminSupportService {
  async list(options: QueryOptions & { status?: string; priority?: string; assignedTo?: string }) {
    const { page, limit, skip, sort } = getPaginationParams(options);
    const filter: Record<string, unknown> = { isDeleted: false };
    if (options.status) filter.status = options.status;
    if (options.priority) filter.priority = options.priority;
    if (options.assignedTo) filter.assignedTo = new Types.ObjectId(options.assignedTo);
    Object.assign(filter, buildSearchFilter(options.search, ['ticketNumber', 'subject']));

    const [items, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate('restaurantId', 'name slug')
        .populate('createdBy', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName email')
        .skip(skip).limit(limit).sort(sort).lean(),
      SupportTicket.countDocuments(filter),
    ]);
    return paginateResult(items, total, page, limit);
  }

  async getById(id: string) {
    const ticket = await SupportTicket.findById(id)
      .populate('restaurantId', 'name slug contact')
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('messages.senderId', 'firstName lastName email');
    if (!ticket) throw new NotFoundError('Ticket not found');
    return ticket;
  }

  async assign(id: string, assignedTo: string, req: AuthenticatedRequest) {
    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      { assignedTo: new Types.ObjectId(assignedTo), status: 'assigned', updatedBy: req.user!._id },
      { new: true }
    );
    if (!ticket) throw new NotFoundError('Ticket not found');
    await auditLogService.logFromRequest(req, 'ticket_assigned', 'support_ticket', id);
    return ticket;
  }

  async reply(id: string, message: string, req: AuthenticatedRequest, isInternal = false) {
    const ticket = await SupportTicket.findById(id);
    if (!ticket) throw new NotFoundError('Ticket not found');

    ticket.messages.push({
      senderId: req.user!._id,
      senderRole: req.user!.roleSlug,
      message,
      attachments: [],
      isInternal,
      createdAt: new Date(),
    });
    if (ticket.status === 'open' || ticket.status === 'assigned') {
      ticket.status = 'in_progress';
    }
    await ticket.save();

    await auditLogService.logFromRequest(req, 'ticket_replied', 'support_ticket', id);
    return ticket;
  }

  async close(id: string, req: AuthenticatedRequest) {
    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      { status: 'closed', closedAt: new Date(), updatedBy: req.user!._id },
      { new: true }
    );
    if (!ticket) throw new NotFoundError('Ticket not found');
    await auditLogService.logFromRequest(req, 'ticket_closed', 'support_ticket', id);
    return ticket;
  }

  async reopen(id: string, req: AuthenticatedRequest) {
    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      { status: 'reopened', closedAt: undefined, updatedBy: req.user!._id },
      { new: true }
    );
    if (!ticket) throw new NotFoundError('Ticket not found');
    await auditLogService.logFromRequest(req, 'ticket_reopened', 'support_ticket', id);
    return ticket;
  }

  async addInternalNote(id: string, note: string, req: AuthenticatedRequest) {
    const ticket = await SupportTicket.findById(id);
    if (!ticket) throw new NotFoundError('Ticket not found');

    ticket.internalNotes.push({
      note,
      createdBy: req.user!._id,
      createdAt: new Date(),
    });
    await ticket.save();
    return ticket;
  }
}

export const adminSupportService = new AdminSupportService();
