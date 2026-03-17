import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HQMessage from '@/models/HQMessage';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { content } = await request.json();
        const { id } = await params;

        const message = await HQMessage.findByIdAndUpdate(
            id,
            { content, edited: true },
            { new: true }
        ).populate('replyTo');

        if (!message) {
            return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: message });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;

        const message = await HQMessage.findByIdAndDelete(id);

        if (!message) {
            return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
    }
}
