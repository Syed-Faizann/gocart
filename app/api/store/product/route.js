import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/middlewares/authSeller";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const authResult = await authSeller(userId);

    if (!authResult || !authResult.isSeller) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const storeId = authResult.storeId;

    // Get the data from the form
    const formData = await request.formData();
    const name = formData.get("name");
    const description = formData.get("description");
    const mrp = Number(formData.get("mrp"));
    const price = Number(formData.get("price"));
    const category = formData.get("category");
    
    const images = formData.getAll("images");

    if (
      !name ||
      !description ||
      !mrp ||
      !price ||
      !category ||
      !images ||
      images.length < 1
    ) {
      return NextResponse.json(
        { error: "missing product details" },
        { status: 400 }
      );
    }

    // Filter out any null/undefined images
    const validImages = images.filter(image => image && image.size > 0);

    if (validImages.length === 0) {
      return NextResponse.json(
        { error: "No valid images provided" },
        { status: 400 }
      );
    }

    // Upload images to imagekit
    const imageUrls = await Promise.all(
      validImages.map(async (image) => {
        try {
          const buffer = Buffer.from(await image.arrayBuffer());
          const base64File = buffer.toString('base64');

          const uploadFormData = new FormData();
          uploadFormData.append('file', base64File);
          uploadFormData.append('fileName', image.name);
          uploadFormData.append('folder', '/products');
          uploadFormData.append('useUniqueFileName', 'true');

          const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
            method: 'POST',
            body: uploadFormData,
            headers: {
              'Authorization': `Basic ${Buffer.from(`${process.env.IMAGEKIT_PRIVATE_KEY}:`).toString('base64')}`
            }
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Image upload failed: ${uploadResponse.statusText}`);
          }

          const uploadResult = await uploadResponse.json();

          const imagekitId = process.env.IMAGEKIT_URL_ENDPOINT?.replace('https://ik.imagekit.io/', '');
          const optimizedImage = `https://ik.imagekit.io/${imagekitId}/tr:q-auto,f-webp,w-1024/${uploadResult.filePath}`;

          return optimizedImage;
        } catch (error) {
          console.error("Error uploading image:", error);
          throw new Error(`Failed to upload image: ${image.name}`);
        }
      })
    );

    // Create product in database
    await prisma.product.create({
      data: {
        name,
        description,
        mrp,
        price,
        category,
        images: imageUrls,
        storeId,
      },
    });

    return NextResponse.json({ message: "Product added successfully" });
  } catch (error) {
    console.error("Product creation error:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Product with similar details already exists" },
        { status: 400 }
      );
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
    const authResult = await authSeller(userId);
    
    if (!authResult || !authResult.isSeller) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const storeId = authResult.storeId;
    
    const products = await prisma.product.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ products });
  } catch (error) {
    console.error("Products fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}