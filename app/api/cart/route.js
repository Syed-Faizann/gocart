import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const cart = body.cart || {};

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: userId,
          name: "User",
          email: `${userId}@temp.com`,
          cart: cart,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { cart: cart },
      });
    }

    return NextResponse.json({ message: "Cart updated", cart: cart });
  } catch (error) {
    console.error("Cart update error:", error);
    return NextResponse.json(
      { message: "Error updating cart", error: error.message },
      { status: 400 }
    );
  }
}

// Get user cart
export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ cart: {} });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return NextResponse.json({ cart: user?.cart || {} });
  } catch (error) {
    console.error("Cart fetch error:", error);
    return NextResponse.json(
      { message: "Error getting cart" },
      { status: 400 }
    );
  }
}
