import mongoose, { Schema, Document } from 'mongoose';

export interface IService {
    name: string;
    tier: string;
    price: number; // custom price for this client
}

export interface IPayment {
    amount: number;
    date: Date;
    note?: string;
}

export interface IClient extends Document {
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    services: IService[];
    joiningDate: Date;
    monthlyFee: number; // total = sum of all service prices
    isActive: boolean;
    notes?: string;
    payments: IPayment[];
}

const ServiceSchema = new Schema({
    name: { type: String, required: true },
    tier: { type: String, required: true },
    price: { type: Number, required: true },
}, { _id: false });

const PaymentSchema = new Schema({
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    note: { type: String, default: '' },
}, { _id: false });

const ClientSchema: Schema = new Schema({
    name: { type: String, required: true },
    contactName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    services: { type: [ServiceSchema], default: [] },
    joiningDate: { type: Date },
    monthlyFee: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    notes: { type: String, default: '' },
    payments: { type: [PaymentSchema], default: [] },
}, {
    timestamps: true,
});

export default mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);
