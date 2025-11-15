import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { imagekit } from "@/config/imageKit"; // ✅ use your properly exported imagekit client

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
        { error: "missing store info" },
        { status: 400 }
      );
    }

    // check if user already has a store
    const store = await prisma.store.findFirst({ where: { userId } });
    if (store) return NextResponse.json({ status: store.status });

    // check if username is taken
    const isUsernameTaken = await prisma.store.findFirst({
      where: { username: username.toLowerCase() },
    });
    if (isUsernameTaken)
      return NextResponse.json(
        { error: "username already taken" },
        { status: 400 }
      );

    // upload image to ImageKit
    const buffer = Buffer.from(await image.arrayBuffer()); // Convert File to Buffer
    const uploadResponse = await imagekit.files.upload({
      file: buffer,
      fileName: image.name,
      folder: "logos",
    });

    const optimizedImage = uploadResponse.url; // direct URL from ImageKit

    // create new store
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

    // link store to user
    await prisma.user.update({
      where: { id: userId },
      data: { store: { connect: { id: newStore.id } } },
    });

    return NextResponse.json({ message: "applied, waiting for approval" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const store = await prisma.store.findFirst({ where: { userId } });
    if (store) return NextResponse.json({ status: store.status });
    return NextResponse.json({ status: "not registered" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
