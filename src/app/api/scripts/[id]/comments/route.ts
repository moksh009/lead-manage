import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const resolvedParams = await params;
        const scriptId = resolvedParams.id;

        if (!scriptId) {
            return NextResponse.json({ success: false, error: 'Script ID is required' }, { status: 400 });
        }

        // Fetch all notifications (acted as comments) for the given scriptId
        const comments = await Notification.find({ scriptId })
            .sort({ createdAt: 1 }) // chronological order for a chat thread
            .populate('scriptId', 'title');

        return NextResponse.json({ success: true, data: comments });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
    }
}
