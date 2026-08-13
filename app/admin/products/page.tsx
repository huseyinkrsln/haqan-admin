"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";

type Product = {
  id: string;
  title: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
};

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await axiosInstance.get<Product[]>("/products");
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // In a real app we'd DELETE to /api/products/:id
      // await axiosInstance.delete(`/products/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      alert("Product deleted (Mocked)");
    },
  });

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "imageUrl",
      header: "Image",
      cell: ({ row }) => (
        <img
          src={row.original.imageUrl}
          alt={row.original.title}
          className="w-10 h-10 rounded object-cover"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("price"));
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount);
        return <div>{formatted}</div>;
      },
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => {
        const stock = parseInt(row.getValue("stock"));
        return (
          <Badge variant={stock > 0 ? "outline" : "destructive"}>
            {stock > 0 ? `${stock} in stock` : "Out of stock"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const product = row.original;
        // VIEWER role cannot edit or delete
        if (role === "VIEWER") {
          return null;
        }
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => alert(`Edit ${product.title}`)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => deleteMutation.mutate(product.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground font-playfair">Products</h2>
        <p className="text-muted-foreground">
          Manage your store's products.
        </p>
      </div>
      
      {isLoading ? (
        <div className="text-center py-10">Loading products...</div>
      ) : (
        <DataTable columns={columns} data={products || []} />
      )}
    </div>
  );
}
