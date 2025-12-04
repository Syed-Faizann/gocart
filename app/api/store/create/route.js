// // import prisma from "@/lib/prisma";
// // import { getAuth } from "@clerk/nextjs/server";
// // import { NextResponse } from "next/server";
// // import { imagekit } from "@/config/imageKit";

// // export async function POST(request) {
// //   try {
// //     const { userId } = getAuth(request);
// //     const formData = await request.formData();

// //     const name = formData.get("name");
// //     const username = formData.get("username");
// //     const description = formData.get("description");
// //     const email = formData.get("email");
// //     const contact = formData.get("contact");
// //     const address = formData.get("address");
// //     const image = formData.get("image");

// //     if (
// //       !name ||
// //       !username ||
// //       !description ||
// //       !email ||
// //       !contact ||
// //       !address ||
// //       !image
// //     ) {
// //       return NextResponse.json(
// //         { error: "Missing store info" },
// //         { status: 400 }
// //       );
// //     }

// //     const store = await prisma.store.findUnique({
// //       where: { username },
// //     });
// //     if (store) {
// //       return NextResponse.json(
// //         { error: "Store username already taken" },
// //         { status: 400 }
// //       );
// //     }

// //     const isUsernameTaken = await prisma.user.findFirst({
// //       where: { username: username.toLowerCase() },
// //     });

// //     if (isUsernameTaken) {
// //       return NextResponse.json(
// //         { error: "Store username already taken" },
// //         { status: 400 }
// //       );
// //     }

// //     // ✅ Convert browser File to ImageKit compatible file
// //     const buffer = Buffer.from(await image.arrayBuffer());
// //     const response = await imagekit.upload({
// //       file: buffer,
// //       fileName: image.name,
// //       folder: "logos",
// //     });


// //     const optimizedImage = imagekit.url({
// //       path: response.filePath,
// //       transformation: [{ quality: "auto", format: "webp", width: "512" }],
// //     });

// //     // ✅ Create new store
// //     const newStore = await prisma.store.create({
// //       data: {
// //         userId,
// //         name,
// //         description,
// //         username,
// //         email,
// //         contact,
// //         address,
// //         logo: optimizedImage,
// //       },
// //     });

// //     // ✅ Link store to user
// //     await prisma.user.update({
// //       where: { id: userId },
// //       data: { store: { connect: { id: newStore.id } } },
// //     });

// //     return NextResponse.json({
// //       message: "Store submitted, waiting for approval",
// //     });
// //   } catch (error) {
// //     console.error(error);
// //     return NextResponse.json({ error: error.message }, { status: 400 });
// //   }
// // }
// // app/api/store/create/route.js
// // app/api/store/create/route.js


// // export async function GET(request) {
// //   try {
// //     const { userId } = getAuth(request);
// //     const store = await prisma.store.findFirst({
// //       where: { userId: userId },
// //     });
// //     if (store) {
// //       return NextResponse.json({ status: store.status });
// //     }
// //     return NextResponse.json({ status: "not registered" });
// //   } catch (error) {
// //     console.error(error);
// //     return NextResponse.json(
// //       { error: error.code || error.message },
// //       { status: 400 }
// //     );
// //   }
// // }
// // app/api/store/create/route.js
// // app/api/store/create/route.js
// // app/api/store/create/route.js
// // app/api/store/create/route.js
// // app/api/store/create/route.js
// // app/api/store/create/route.js
// import prisma from "@/lib/prisma";
// import { getAuth } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";

// export async function POST(request) {
//   try {
//     const { userId } = getAuth(request);
    
//     if (!userId) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     const formData = await request.formData();

//     const name = formData.get("name");
//     const username = formData.get("username");
//     const description = formData.get("description");
//     const email = formData.get("email");
//     const contact = formData.get("contact");
//     const address = formData.get("address");
//     const image = formData.get("image");

//     if (
//       !name ||
//       !username ||
//       !description ||
//       !email ||
//       !contact ||
//       !address ||
//       !image
//     ) {
//       return NextResponse.json(
//         { error: "Missing store info" },
//         { status: 400 }
//       );
//     }

//     // Check if user exists in our database, if not create them
//     let user = await prisma.user.findUnique({
//       where: { id: userId },
//     });

//     if (!user) {
//       // Create user if they don't exist in our database
//       // We need at least id, name, and email for the User model
//       user = await prisma.user.create({
//         data: {
//           id: userId,
//           name: name, // Use store name as user name, or get from Clerk
//           email: email,
//           username: username.toLowerCase(),
//           // image and cart are optional or can be set later
//           image: null,
//           cart: {}
//         },
//       });
//     }

//     // Check if user already has a store (userId is unique in Store model)
//     const existingUserStore = await prisma.store.findUnique({
//       where: { userId: userId },
//     });

//     if (existingUserStore) {
//       return NextResponse.json(
//         { error: "You already have a store registered" },
//         { status: 400 }
//       );
//     }

//     // Check if store username is taken
//     const existingStore = await prisma.store.findUnique({
//       where: { username },
//     });

//     if (existingStore) {
//       return NextResponse.json(
//         { error: "Store username already taken" },
//         { status: 400 }
//       );
//     }

//     // Check if username is taken by another user
//     const isUsernameTaken = await prisma.user.findFirst({
//       where: { 
//         username: username.toLowerCase(),
//         id: { not: userId } // Exclude current user
//       },
//     });

//     if (isUsernameTaken) {
//       return NextResponse.json(
//         { error: "Username already taken by another user" },
//         { status: 400 }
//       );
//     }

//     // Convert image to buffer and then to base64
//     const buffer = Buffer.from(await image.arrayBuffer());
//     const base64File = buffer.toString('base64');

//     // Simple ImageKit upload with Basic Authentication
//     const uploadFormData = new FormData();
//     uploadFormData.append('file', base64File);
//     uploadFormData.append('fileName', image.name);
//     uploadFormData.append('folder', '/logos');
//     uploadFormData.append('useUniqueFileName', 'true');

//     console.log('Uploading to ImageKit...');

//     // Upload to ImageKit with Basic Authentication
//     const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
//       method: 'POST',
//       body: uploadFormData,
//       headers: {
//         'Authorization': `Basic ${Buffer.from(`${process.env.IMAGEKIT_PRIVATE_KEY}:`).toString('base64')}`
//       }
//     });

//     if (!uploadResponse.ok) {
//       const errorText = await uploadResponse.text();
//       console.error('ImageKit upload failed:', errorText);
//       throw new Error(`Image upload failed: ${uploadResponse.statusText}`);
//     }

//     const uploadResult = await uploadResponse.json();
//     console.log('ImageKit upload success:', uploadResult);

//     // Create optimized image URL
//     const imagekitId = process.env.IMAGEKIT_URL_ENDPOINT?.replace('https://ik.imagekit.io/', '');
//     const optimizedImage = `https://ik.imagekit.io/${imagekitId}/tr:q-auto,f-webp,w-512,h-512/${uploadResult.filePath}`;

//     // Create new store - userId must be unique in Store model
//     const newStore = await prisma.store.create({
//       data: {
//         userId: userId, // This must be unique - one store per user
//         name,
//         description,
//         username,
//         email,
//         contact,
//         address,
//         logo: optimizedImage,
//         status: "pending",
//         isActive: false
//       },
//     });

//     // Update user's username if it's not set or different
//     if (!user.username || user.username !== username.toLowerCase()) {
//       await prisma.user.update({
//         where: { id: userId },
//         data: { 
//           username: username.toLowerCase()
//         },
//       });
//     }

//     return NextResponse.json({
//       message: "Store submitted, waiting for approval",
//       store: { id: newStore.id, name: newStore.name }
//     });
//   } catch (error) {
//     console.error("Store creation error:", error);
    
//     // Handle specific Prisma errors
//     if (error.code === 'P2002') {
//       if (error.meta?.target?.includes('userId')) {
//         return NextResponse.json(
//           { error: "You can only create one store per account" },
//           { status: 400 }
//         );
//       }
//       if (error.meta?.target?.includes('username')) {
//         return NextResponse.json(
//           { error: "Store username already taken" },
//           { status: 400 }
//         );
//       }
//     }
    
//     return NextResponse.json(
//       { error: error.message || "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// export async function GET(request) {
//   try {
//     const { userId } = getAuth(request);
    
//     if (!userId) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     const store = await prisma.store.findFirst({
//       where: { userId: userId },
//     });
    
//     if (store) {
//       return NextResponse.json({ 
//         status: store.status,
//         store: {
//           id: store.id,
//           name: store.name,
//           username: store.username,
//           status: store.status,
//           isActive: store.isActive
//         }
//       });
//     }
    
//     return NextResponse.json({ status: "not registered" });
    
//   } catch (error) {
//     console.error("Store fetch error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
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