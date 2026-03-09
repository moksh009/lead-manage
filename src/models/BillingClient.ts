import mongoose, { Schema, Document } from 'mongoose';

export interface IService {
    category: string;
    name: string;
    price: number;
}

export interface IPayment {
    amount: number;
    date: Date;
    note?: string;
}

export interface IBillingClient extends Document {
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    services: IService[];
    joiningDate?: Date;
    monthlyFee: number;
    isActive: boolean;
    notes?: string;
    payments: IPayment[];
}

const ServiceSchema = new Schema({
    category: { type: String, default: '' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
}, { _id: false });

const PaymentSchema = new Schema({
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    note: { type: String, default: '' },
}, { _id: false });

const BillingClientSchema: Schema = new Schema({
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
    // Explicit collection name — avoids collision with the chatbot clients collection
    collection: 'billing_clients',
});

export default mongoose.models.BillingClient
    || mongoose.model<IBillingClient>('BillingClient', BillingClientSchema);
