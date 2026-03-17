import mongoose, { Schema, Document } from 'mongoose';

export interface IHQCredential extends Document {
  platform: string;
  username: string;
  password?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HQCredentialSchema: Schema = new Schema({
  platform: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.models.HQCredential || mongoose.model<IHQCredential>('HQCredential', HQCredentialSchema);
