import { NextResponse } from "next/server";

const mockUsers = [
  {
    id: "1",
    name: "Admin User",
    email: "super_admin@example.com",
    role: "SUPER_ADMIN",
    status: "Active",
  },
  {
    id: "2",
    name: "Editor User",
    email: "editor@example.com",
    role: "EDITOR",
    status: "Active",
  },
  {
    id: "3",
    name: "Viewer User",
    email: "viewer@example.com",
    role: "VIEWER",
    status: "Inactive",
  },
];

export async function GET() {
  return NextResponse.json(mockUsers);
}
