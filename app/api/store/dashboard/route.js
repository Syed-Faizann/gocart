import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    console.log("=== STORE DASHBOARD API CALLED ===");
    
    const { userId } = getAuth(request);
    console.log("User ID:", userId);
    
    if (!userId) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const { storeId } = await authSeller(userId);
    console.log("Store ID:", storeId);

    if (!storeId) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

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

    console.log("Found orders:", orders.length);

    // Get all products for the seller
    const products = await prisma.product.findMany({
      where: { storeId },
      select: {
        id: true,
        name: true,
      },
    });

    console.log("Found products:", products.length);

    // Get all ratings for the seller's products
    const ratings = await prisma.rating.findMany({
      where: { 
        productId: { 
          in: products.map((product) => product.id) 
        } 
      },
      include: { 
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          }
        }, 
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            images: true,
          }
        } 
      },
      orderBy: { createdAt: 'desc' },
      take: 20, // Limit to 20 most recent ratings
    });

    console.log("Found ratings:", ratings.length);

    // Calculate total earnings
    let totalEarnings = 0;
    orders.forEach(order => {
      totalEarnings += order.total;
    });

    console.log("Total earnings calculated:", totalEarnings);

    const dashboardData = {
      ratings,
      totalOrders: orders.length,
      totalEarnings: totalEarnings.toFixed(2), // Use toFixed(2) to keep 2 decimal places
      totalProducts: products.length,
      recentOrders: orders.slice(0, 5), // Include recent orders for debugging
    };

    console.log("Dashboard data prepared:", dashboardData);

    return NextResponse.json({ 
      success: true,
      dashboardData 
    });
    
  } catch (error) {
    console.error("Store dashboard error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}