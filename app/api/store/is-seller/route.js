
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/middlewares/authSeller";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authResult = await authSeller(userId);

    if (!authResult.isSeller) {
      return NextResponse.json({ 
        isSeller: false,
        message: authResult.message || "Not authorized as seller"
      });
    }

    // Return store info from the auth result
    return NextResponse.json({ 
      isSeller: true,
      storeInfo: authResult.storeInfo
    });
  } catch (error) {
    console.error("Is-seller error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}