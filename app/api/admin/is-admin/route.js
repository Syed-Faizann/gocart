import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    console.log("userId:", userId);
    const isAdmin = await authAdmin(userId);
    console.log("isAdmin:", isAdmin);

    if (!isAdmin) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.messsage },
      { status: 400 }
    );
  }
}