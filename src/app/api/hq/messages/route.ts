import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HQMessage from '@/models/HQMessage';

export async function GET(request: Request) {
    try {
        await connectDB();
        
        const { searchParams } = new URL(request.url);
        const channel = searchParams.get('channel');

        if (!channel) {
            return NextResponse.json({ success: false, error: 'Channel is required' }, { status: 400 });
        }

        const messages = await HQMessage.find({ channel })
            .sort({ createdAt: 1 })
            .populate('replyTo');

        return NextResponse.json({ success: true, data: messages });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
    }
}

export const maxDuration = 60; // Allows up to 60 seconds (useful for file uploads)

export async function POST(request: Request) {
    try {
        await connectDB();
        
        // Use standard Request.json(), however Next.js body parser limits apply
        // Since we are taking base64, size could be large. Next.js 13+ app router doesn't use the standard config above easily.
        // We will receive JSON payload.
        const body = await request.json();
        
        if (!body.channel || !body.sender) {
             return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const message = await HQMessage.create(body);
        
        // Populate replyTo if it exists so the client can immediately render the quote
        const populatedMessage = await HQMessage.findById(message._id).populate('replyTo');

        return NextResponse.json({ success: true, data: populatedMessage }, { status: 201 });
    } catch (error: unknown) {
        console.error('HQ POST error:', error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
    }
}
