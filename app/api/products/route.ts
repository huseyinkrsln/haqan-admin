import { NextResponse } from "next/server";

declare global {
  var mockProducts: any[] | undefined;
}

if (!global.mockProducts) {
  global.mockProducts = Array.from({ length: 20 }, (_, i) => ({
    id: `${i + 1}`,
    title: `Test Product ${i + 1}`,
    category: i % 3 === 0 ? "Grocery" : i % 3 === 1 ? "Home" : "Apparel",
    price: parseFloat(((Math.random() * 100) + 10).toFixed(2)),
    stock: Math.floor(Math.random() * 50),
    imageUrl: "https://static.ticimax.cloud/52816/uploads/urunresimleri/buyuk/erkek-regular-fit-basic-jean-acik-mavi-fc447a.jpg",
  }));
}

export async function GET() {
  return NextResponse.json(global.mockProducts);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newProduct = {
      ...body,
      id: `${Date.now()}`,
    };
    
    global.mockProducts!.unshift(newProduct);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
