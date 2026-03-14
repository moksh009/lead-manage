import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  recipient: 'Moksh' | 'smit';
  sender: 'Moksh' | 'smit';
  message: string;
  scriptId?: mongoose.Types.ObjectId;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
    recipient: { type: String, enum: ['Moksh', 'smit'], required: true },
    sender: { type: String, enum: ['Moksh', 'smit'], required: true },
    message: { type: String, required: true },
    scriptId: { type: Schema.Types.ObjectId, ref: 'Script' },
    read: { type: Boolean, default: false },
}, { timestamps: true });

// Prevent mongoose from recompiling the model if it already exists
const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
