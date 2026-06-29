import { Schema, model, Document, Types } from 'mongoose';

export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ITicketMessage {
  senderId: Types.ObjectId;
  senderRole: string;
  message: string;
  attachments: { name: string; url: string; type: string }[];
  isInternal: boolean;
  createdAt: Date;
}

export interface ISupportTicket extends Document {
  ticketNumber: string;
  subject: string;
  description: string;
  restaurantId: Types.ObjectId;
  createdBy: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  messages: ITicketMessage[];
  attachments: { name: string; url: string; type: string }[];
  internalNotes: { note: string; createdBy: Types.ObjectId; createdAt: Date }[];
  resolvedAt?: Date;
  closedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema({ name: String, url: String, type: String }, { _id: false });

const messageSchema = new Schema<ITicketMessage>({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, required: true },
  message: { type: String, required: true },
  attachments: [attachmentSchema],
  isInternal: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    status: {
      type: String,
      enum: ['open', 'assigned', 'in_progress', 'resolved', 'closed', 'reopened'],
      default: 'open',
      index: true,
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium', index: true },
    category: { type: String, default: 'general', trim: true },
    messages: [messageSchema],
    attachments: [attachmentSchema],
    internalNotes: [{
      note: { type: String, required: true },
      createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      createdAt: { type: Date, default: Date.now },
    }],
    resolvedAt: { type: Date },
    closedAt: { type: Date },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

supportTicketSchema.pre('find', function () { this.where({ isDeleted: false }); });
supportTicketSchema.pre('findOne', function () { this.where({ isDeleted: false }); });

export const SupportTicket = model<ISupportTicket>('SupportTicket', supportTicketSchema);
