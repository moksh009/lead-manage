import mongoose, { Schema, Document } from 'mongoose';

export interface IPoint extends Document {
    user: 'Moksh' | 'smit';
    action: string;
    points: number;
    description: string;
    date: Date;
}

const PointSchema: Schema = new Schema({
    user: { type: String, enum: ['Moksh', 'smit'], required: true },
    action: { type: String, required: true },
    points: { type: Number, required: true },
    description: { type: String, required: true },
    date: { type: Date, default: () => new Date() },
}, {
    timestamps: true,
});

delete mongoose.models.Point;
export default mongoose.model<IPoint>('Point', PointSchema);
