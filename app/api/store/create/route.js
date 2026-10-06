import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const name = formData.get("name")?.toString().trim();
    const username = formData.get("username")?.toString().trim().toLowerCase();
    const description = formData.get("description")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const contact = formData.get("contact")?.toString().trim();
    const address = formData.get("address")?.toString().trim();
    const image = formData.get("image");

    if (
      !name ||
      !username ||
      !description ||
      !email ||
      !contact ||
      !address ||
      !image ||
      typeof image === "string" ||
      image.size === 0
    ) {
      return NextResponse.json(
        { error: "All store fields and a store logo are required." },
        { status: 400 }
      );
    }

    // Ensure user exists in our database
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      let userName = name;
      let userEmail = email;
      let userImage = null;

      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        if (clerkUser) {
          userName =
            `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
            name;
          userEmail =
            clerkUser.emailAddresses?.[0]?.emailAddress || email;
          userImage = clerkUser.imageUrl || null;
        }
      } catch (clerkErr) {
        console.warn("Could not fetch user details from Clerk:", clerkErr.message);
      }

      user = await prisma.user.create({
        data: {
          id: userId,
          name: userName,
          email: userEmail,
          username: username,
          image: userImage,
          cart: {},
        },
      });
    }

    // Check if user already has a store
    const existingUserStore = await prisma.store.findUnique({
      where: { userId },
    });

    if (existingUserStore) {
      if (existingUserStore.status === "pending") {
        return NextResponse.json(
          { error: "Your store application is already submitted and pending review." },
          { status: 400 }
        );
      }
      if (existingUserStore.status === "approved") {
        return NextResponse.json(
          { error: "You already have an approved store." },
          { status: 400 }
        );
      }
      // If rejected, we allow reapplying by updating the existing store record below
    }

    // Check if store username is taken by another store
    const existingStoreWithUsername = await prisma.store.findUnique({
      where: { username },
    });

    if (
      existingStoreWithUsername &&
      existingStoreWithUsername.userId !== userId
    ) {
      return NextResponse.json(
        { error: "Store username is already taken by another store." },
        { status: 400 }
      );
    }

    // Check if username is taken by another user
    const existingUserWithUsername = await prisma.user.findFirst({
      where: {
        username: username,
        id: { not: userId },
      },
    });

    if (existingUserWithUsername) {
      return NextResponse.json(
        { error: "Username is already taken by another account." },
        { status: 400 }
      );
    }

    // Upload logo image to ImageKit
    const buffer = Buffer.from(await image.arrayBuffer());
    const base64File = buffer.toString("base64");

    const uploadFormData = new FormData();
    uploadFormData.append("file", base64File);
    uploadFormData.append("fileName", image.name || "store-logo.png");
    uploadFormData.append("folder", "/logos");
    uploadFormData.append("useUniqueFileName", "true");

    const uploadResponse = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
      method: "POST",
      body: uploadFormData,
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.IMAGEKIT_PRIVATE_KEY}:`
        ).toString("base64")}`,
      },
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("ImageKit logo upload failed:", errorText);
      throw new Error(`Logo upload failed: ${uploadResponse.statusText}`);
    }

    const uploadResult = await uploadResponse.json();
    const endpoint = process.env.IMAGEKIT_URL_ENDPOINT?.replace(/\/$/, "");
    const filePath = uploadResult.filePath?.replace(/^\//, "");
    const optimizedImage = `${endpoint}/tr:q-auto,f-webp,w-512,h-512/${filePath}`;

    let storeResult;
    if (existingUserStore && existingUserStore.status === "rejected") {
      // Reapply: update existing rejected store
      storeResult = await prisma.store.update({
        where: { userId },
        data: {
          name,
          description,
          username,
          email,
          contact,
          address,
          logo: optimizedImage,
          status: "pending",
          isActive: false,
        },
      });
    } else {
      // Create new store
      storeResult = await prisma.store.create({
        data: {
          userId,
          name,
          description,
          username,
          email,
          contact,
          address,
          logo: optimizedImage,
          status: "pending",
          isActive: false,
        },
      });
    }

    // Ensure user username is updated if not set
    if (!user.username || user.username !== username) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { username },
        });
      } catch (err) {
        console.warn("Could not update user username:", err.message);
      }
    }

    return NextResponse.json({
      message: "Store submitted, waiting for approval",
      store: {
        id: storeResult.id,
        name: storeResult.name,
        status: storeResult.status,
      },
    });
  } catch (error) {
    console.error("Store creation error:", error);

    if (error.code === "P2002") {
      if (error.meta?.target?.includes("userId")) {
        return NextResponse.json(
          { error: "You can only create one store per account" },
          { status: 400 }
        );
      }
      if (error.meta?.target?.includes("username")) {
        return NextResponse.json(
          { error: "Store username already taken" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const store = await prisma.store.findUnique({
      where: { userId },
    });

    if (store) {
      return NextResponse.json({
        status: store.status,
        store: {
          id: store.id,
          name: store.name,
          username: store.username,
          status: store.status,
          isActive: store.isActive,
        },
      });
    }

    return NextResponse.json({ status: "not registered" });
  } catch (error) {
    console.error("Store fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
