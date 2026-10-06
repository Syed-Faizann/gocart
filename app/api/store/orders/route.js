import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const authResult = await authSeller(userId);

    if (!authResult || !authResult.isSeller) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const storeId = authResult.storeId;
    const { orderId, status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "orderId and status are required" },
        { status: 400 }
      );
    }

    // Verify the order belongs to this store
    const existingOrder = await prisma.order.findFirst({
      where: { id: orderId, storeId },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found or does not belong to your store" },
        { status: 404 }
      );
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return NextResponse.json({ message: "Order Status updated" });
  } catch (error) {
    console.error("Store order status update error:", error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}

// Get all orders for a seller
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const authResult = await authSeller(userId);

    if (!authResult || !authResult.isSeller) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const storeId = authResult.storeId;

    const orders = await prisma.order.findMany({
      where: { storeId },
      include: {
        user: true,
        address: true,
        orderItems: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Store orders fetch error:", error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}