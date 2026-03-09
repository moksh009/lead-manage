import mongoose, { Schema, Document } from 'mongoose';

export interface ILead extends Document {
    companyName: string;
    prospectName: string;
    link: string;
    phoneNumber: string;
    notes: string;
    leadType: 'Qualified' | 'Soft Lead' | 'UN-QUALIFIED' | 'Pending';
    followUpDate?: Date;
    pipelineStage?: string;
    // Source channel — which outreach channel this lead came from
    channel: 'dm' | 'email' | 'whatsapp' | 'call';
    // Date the outreach for this lead happened (ties to daily log date)
    leadDate: Date;
    // Tracking flags to prevent double-counting in outreach log
    countedAsReply: boolean;
    countedAsMeeting: boolean;
    countedAsClosed: boolean;
}

const LeadSchema: Schema = new Schema({
    companyName: { type: String, required: true },
    prospectName: { type: String, default: '' },
    link: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
    notes: { type: String, default: '' },
    leadType: {
        type: String,
        enum: ['Qualified', 'Soft Lead', 'UN-QUALIFIED', 'Pending'],
        default: 'Pending'
    },
    followUpDate: { type: Date },
    pipelineStage: { type: String, default: 'new' },
    // Source tracking
    channel: {
        type: String,
        enum: ['dm', 'email', 'whatsapp', 'call'],
        default: 'call'
    },
    leadDate: { type: Date, default: () => new Date() },
    // Auto-sync flags (prevent double-counting)
    countedAsReply: { type: Boolean, default: false },
    countedAsMeeting: { type: Boolean, default: false },
    countedAsClosed: { type: Boolean, default: false },
}, {
    timestamps: true,
});

export default mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
