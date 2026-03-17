import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import '@/models/Script'; // Ensure Script model is registered for population

export async function GET(request: Request) {
    try {
        await connectDB();
        
        const { searchParams } = new URL(request.url);
        const recipient = searchParams.get('recipient');

        if (!recipient) {
            return NextResponse.json({ success: false, error: 'Recipient is required' }, { status: 400 });
        }

        const notifications = await Notification.find({ recipient })
            .sort({ createdAt: -1 })
            .limit(50) // Fetch top 50 recent notifications
            .populate('scriptId', 'title');

        return NextResponse.json({ success: true, data: notifications });
    } catch (error: unknown) {
        console.error('Notifications GET error:', error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await connectDB();
        const body = await request.json();
        
        // Ensure required fields
        if (!body.recipient || !body.sender || !body.message) {
             return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const notification = await Notification.create(body);
        return NextResponse.json({ success: true, data: notification }, { status: 201 });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
    }
}
