import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TeamGoal from '@/models/TeamGoal';

export async function GET() {
    try {
        await dbConnect();
        const goals = await TeamGoal.find({}).sort({ date: -1 });
        return NextResponse.json({ success: true, data: goals });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const data = await request.json();
        const goal = await TeamGoal.create(data);
        return NextResponse.json({ success: true, data: goal }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        await dbConnect();
        const { id, ...updates } = await request.json();
        const updated = await TeamGoal.findByIdAndUpdate(id, updates, { new: true });
        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
