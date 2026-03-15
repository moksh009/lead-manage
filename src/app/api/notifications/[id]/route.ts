import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await request.json();
        
        const notification = await Notification.findByIdAndUpdate(
            id,
            body,
            { new: true, runValidators: true }
        );

        if (!notification) {
            return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: notification });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        const notification = await Notification.findByIdAndDelete(id);

        if (!notification) {
            return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: {} });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
    }
}
