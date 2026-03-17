import mongoose, { Schema, Document } from 'mongoose';

export interface IFomoLead extends Document {
    leadId: mongoose.Types.ObjectId;
    fomoSent: boolean;
    sentAt?: Date;
    nextFomoDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const FomoLeadSchema: Schema = new Schema({
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    fomoSent: { type: Boolean, default: false },
    sentAt: { type: Date },
    nextFomoDate: { type: Date },
    notes: { type: String, default: '' },
}, {
    timestamps: true,
});

export default mongoose.models.FomoLead || mongoose.model<IFomoLead>('FomoLead', FomoLeadSchema);
