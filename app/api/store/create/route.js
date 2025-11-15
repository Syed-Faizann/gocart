import { toFile } from "@imagekit/nodejs";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { imagekit } from "@/config/imageKit";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const formData = await request.formData();

    const name = formData.get("name");
    const username = formData.get("username");
    const description = formData.get("description");
    const email = formData.get("email");
    const contact = formData.get("contact");
    const address = formData.get("address");
    const image = formData.get("image");

    if (
      !name ||
      !username ||
      !description ||
      !email ||
      !contact ||
      !address ||
      !image
    ) {
      return NextResponse.json(
        { error: "Missing store info" },
        { status: 400 }
      );
    }

    // ✅ Check if user already has a store
    const existingStore = await prisma.store.findUnique({
      where: { userId },
    });

    if (existingStore) {
      return NextResponse.json(
        { error: "User already has a store", status: existingStore.status },
        { status: 400 }
      );
    }

    // ✅ Convert browser File to ImageKit compatible file
    const fileBuffer = Buffer.from(await image.arrayBuffer());
    const ikFile = await toFile(fileBuffer, image.name);

    const uploadResponse = await imagekit.files.upload({
      file: ikFile,
      fileName: image.name,
      folder: "logos",
    });

    const optimizedImage = uploadResponse.url; // get URL

    // ✅ Create new store
    const newStore = await prisma.store.create({
      data: {
        userId,
        name,
        description,
        username,
        email,
        contact,
        address,
        logo: optimizedImage,
      },
    });

    // ✅ Link store to user
    await prisma.user.update({
      where: { id: userId },
      data: { store: { connect: { id: newStore.id } } },
    });

    return NextResponse.json({
      message: "Store submitted, waiting for approval",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
