import mongoose, { Schema, Document } from 'mongoose';

export interface IOutreach extends Document {
    date: Date;
    dmsSent: number;
    emailsSent: number;
    whatsappSent: number;
    callsMade: number;
    // Per-channel replies
    dmsReplies: number;
    emailReplies: number;
    whatsappReplies: number;
    callReplies: number;
    // Kept for backward compatibility aggregation
    replies: number;
    meetings: number;
    clientsClosed: number;
}

const OutreachSchema: Schema = new Schema({
    date: { type: Date, required: true, unique: true },
    dmsSent: { type: Number, default: 0 },
    emailsSent: { type: Number, default: 0 },
    whatsappSent: { type: Number, default: 0 },
    callsMade: { type: Number, default: 0 },
    // Per-channel replies
    dmsReplies: { type: Number, default: 0 },
    emailReplies: { type: Number, default: 0 },
    whatsappReplies: { type: Number, default: 0 },
    callReplies: { type: Number, default: 0 },
    // meetings & closed
    meetings: { type: Number, default: 0 },
    clientsClosed: { type: Number, default: 0 },
}, {
    timestamps: true,
    // Virtual for total replies
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Virtual to aggregate replies for backward compat
OutreachSchema.virtual('replies').get(function (this: any) {
    return (this.dmsReplies || 0) + (this.emailReplies || 0) + (this.whatsappReplies || 0) + (this.callReplies || 0);
});

export default mongoose.models.Outreach || mongoose.model<IOutreach>('Outreach', OutreachSchema);
