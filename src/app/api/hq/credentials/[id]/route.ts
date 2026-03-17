import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HQCredential from '@/models/HQCredential';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const body = await request.json();
        const resolvedParams = await params;
        
        const credential = await HQCredential.findByIdAndUpdate(resolvedParams.id, body, { new: true, runValidators: true });
        
        if (!credential) {
            return NextResponse.json({ success: false, error: 'Credential not found' }, { status: 404 });
        }
        
        return NextResponse.json({ success: true, data: credential });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 400 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const resolvedParams = await params;
        
        const credential = await HQCredential.findByIdAndDelete(resolvedParams.id);
        
        if (!credential) {
            return NextResponse.json({ success: false, error: 'Credential not found' }, { status: 404 });
        }
        
        return NextResponse.json({ success: true, data: {} });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 400 });
    }
}
