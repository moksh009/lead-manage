import mongoose, { Schema, Document } from 'mongoose';

export interface IScript extends Document {
    title: string;
    content: string;
    channel: 'instagram' | 'whatsapp' | 'email' | 'call' | 'other';
    createdAt: Date;
    updatedAt: Date;
}

const ScriptSchema: Schema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    channel: {
        type: String,
        enum: ['instagram', 'whatsapp', 'email', 'call', 'other'],
        default: 'other'
    },
}, { timestamps: true });

export default mongoose.models.Script || mongoose.model<IScript>('Script', ScriptSchema);
