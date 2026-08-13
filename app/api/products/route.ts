import { NextResponse } from "next/server";

const mockProducts = [
  {
    id: "1",
    title: "Premium Olive Oil",
    category: "Grocery",
    price: 29.99,
    stock: 45,
    imageUrl: "https://via.placeholder.com/150/4A5D3E/FFFFFF?text=Oil",
  },
  {
    id: "2",
    title: "Ceramic Coffee Mug",
    category: "Home",
    price: 14.50,
    stock: 0,
    imageUrl: "https://via.placeholder.com/150/E5E7EB/1A1A1A?text=Mug",
  },
  {
    id: "3",
    title: "Linen Apron",
    category: "Apparel",
    price: 49.00,
    stock: 12,
    imageUrl: "https://via.placeholder.com/150/4A5D3E/FFFFFF?text=Apron",
  },
];

export async function GET() {
  return NextResponse.json(mockProducts);
}
