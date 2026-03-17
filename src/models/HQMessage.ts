import mongoose, { Schema, Document } from 'mongoose';

export interface IHQMessage extends Document {
  channel: string;
  sender: 'Moksh' | 'smit';
  content: string;
  attachmentData?: string;
  attachmentType?: string;
  attachmentName?: string;
  replyTo?: mongoose.Types.ObjectId;
  edited?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HQMessageSchema: Schema = new Schema({
  channel: { 
    type: String, 
    required: true,
    enum: ['Scripts-Video Inventory', 'Saves', 'Finance', 'General', 'Passwords and Accounts', 'Blueprints/Resources Save', 'Everyday Logs 2026', 'Rough Fluff', 'Client Fluff']
  },
  sender: { type: String, enum: ['Moksh', 'smit'], required: true },
  content: { type: String, default: '' },
  attachmentData: { type: String },
  attachmentType: { type: String },
  attachmentName: { type: String },
  replyTo: { type: Schema.Types.ObjectId, ref: 'HQMessage' },
  edited: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.HQMessage || mongoose.model<IHQMessage>('HQMessage', HQMessageSchema);
