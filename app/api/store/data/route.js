import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Get store info & store products
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username")?.toLowerCase();

    if (!username) {
      return NextResponse.json({ error: "missing username" }, { status: 400 });
    }

    // get store info and instock products with ratings
    const store = await prisma.store.findFirst({
      where: { username, isActive: true },
      include: {
        Product: {
          where: { inStock: true },
          include: { rating: true },
        },
      },
    });

    if (!store) {
      return NextResponse.json({ error: "store not found" }, { status: 404 });
    }

    return NextResponse.json({ store });
  } catch (error) {
    console.error("Store data error:", error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 500 }
    );
  }
}
