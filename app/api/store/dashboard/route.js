import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const authResult = await authSeller(userId);

    if (!authResult || !authResult.isSeller) {
      return NextResponse.json(
        { error: authResult?.message || "Seller store not found or not active" },
        { status: 404 }
      );
    }

    const storeId = authResult.storeId;

    // Get all orders for the seller
    const orders = await prisma.order.findMany({
      where: { storeId },
      select: {
        id: true,
        total: true,
        createdAt: true,
        status: true,
        paymentMethod: true,
        isPaid: true,
      },
    });

    // Get all products for the seller
    const products = await prisma.product.findMany({
      where: { storeId },
      select: {
        id: true,
        name: true,
      },
    });

    // Get all ratings for the seller's products
    const productIds = products.map((product) => product.id);
    const ratings =
      productIds.length > 0
        ? await prisma.rating.findMany({
            where: {
              productId: { in: productIds },
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  email: true,
                },
              },
              product: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  images: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
          })
        : [];

    // Calculate total earnings
    let totalEarnings = 0;
    orders.forEach((order) => {
      totalEarnings += order.total || 0;
    });

    const dashboardData = {
      ratings,
      totalOrders: orders.length,
      totalEarnings: totalEarnings.toFixed(2),
      totalProducts: products.length,
      recentOrders: orders.slice(0, 5),
    };

    return NextResponse.json({
      success: true,
      dashboardData,
    });
  } catch (error) {
    console.error("Store dashboard error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}