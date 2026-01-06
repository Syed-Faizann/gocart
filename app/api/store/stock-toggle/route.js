
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Toggle stock status of a product
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: "missing details: productId" },
        { status: 400 }
      );
    }

    // ✅ Get the auth result which contains store information
    const authResult = await authSeller(userId);

    if (!authResult || !authResult.isSeller) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    // ✅ Extract the store ID from the auth result
    const storeId = authResult.storeId;

    // Check if product exists and belongs to the store
    const product = await prisma.product.findFirst({
      where: { 
        id: productId, 
        storeId: storeId 
      },
    });

    if (!product) {
      return NextResponse.json({ error: "no product found" }, { status: 404 });
    }

    // Toggle the stock status
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { inStock: !product.inStock },
    });

    return NextResponse.json({ 
      message: "Product stock updated successfully",
      newStatus: updatedProduct.inStock 
    });
  } catch (error) {
    console.error("Stock toggle error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}