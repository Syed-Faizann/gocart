import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/middlewares/authSeller";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    // Get the data from the form
    const formData = await request.formData();
    const name = formData.get("name");
    const description = formData.get("description");
    const mrp = Number(formData.get("mrp"));
    const price = Number(formData.get("price"));
    const category = formData.get("category");
    
    // Use getAll to get all images with the same field name
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

    // Upload images to imagekit using the same logic as store creation
    const imageUrls = await Promise.all(
      validImages.map(async (image) => {
        try {
          // Convert image to buffer and then to base64
          const buffer = Buffer.from(await image.arrayBuffer());
          const base64File = buffer.toString('base64');

          // ImageKit upload with Basic Authentication
          const uploadFormData = new FormData();
          uploadFormData.append('file', base64File);
          uploadFormData.append('fileName', image.name);
          uploadFormData.append('folder', '/products'); // Changed folder to products
          uploadFormData.append('useUniqueFileName', 'true');

          console.log('Uploading product image to ImageKit...');

          // Upload to ImageKit with Basic Authentication
          const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
            method: 'POST',
            body: uploadFormData,
            headers: {
              'Authorization': `Basic ${Buffer.from(`${process.env.IMAGEKIT_PRIVATE_KEY}:`).toString('base64')}`
            }
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('ImageKit upload failed:', errorText);
            throw new Error(`Image upload failed: ${uploadResponse.statusText}`);
          }

          const uploadResult = await uploadResponse.json();
          console.log('ImageKit upload success:', uploadResult);

          // Create optimized image URL for products
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
    
    // Handle specific Prisma errors
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
    const storeId = await authSeller(userId);
    
    if (!storeId) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }
    
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

