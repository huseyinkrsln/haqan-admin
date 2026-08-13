import { NextResponse } from "next/server";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (global.mockProducts) {
      const index = global.mockProducts.findIndex(p => p.id === id);
      if (index !== -1) {
        global.mockProducts[index] = { ...global.mockProducts[index], ...body };
        return NextResponse.json(global.mockProducts[index]);
      }
    }
    
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (global.mockProducts) {
      const index = global.mockProducts.findIndex(p => p.id === id);
      if (index !== -1) {
        global.mockProducts.splice(index, 1);
        return NextResponse.json({ success: true });
      }
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
