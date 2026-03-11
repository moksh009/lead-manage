import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Point from '@/models/Point';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        
        // Fetch all points, sorted by newest first
        const points = await Point.find({}).sort({ createdAt: -1 });
        
        return NextResponse.json({ success: true, data: points });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
