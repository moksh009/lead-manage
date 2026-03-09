import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Script from '@/models/Script';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const data = await request.json();
        const script = await Script.findByIdAndUpdate(id, data, { new: true });
        if (!script) {
            return NextResponse.json({ success: false, error: 'Script not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: script });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const script = await Script.findByIdAndDelete(id);
        if (!script) {
            return NextResponse.json({ success: false, error: 'Script not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: script });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
