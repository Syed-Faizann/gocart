// import { getAuth } from "@clerk/nextjs/server";
// import authSeller from "@/middlewares/authSeller";
// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";

// export async function POST(request) {
//   try {
//     const { userId } = getAuth(request);
//     const authResult = await authSeller(userId); // This returns an object

//     if (!authResult || !authResult.isSeller) {
//       return NextResponse.json({ error: "not authorized" }, { status: 401 });
//     }

//     // ✅ Extract the store ID from the auth result
//     const storeId = authResult.storeId;

//     // Get the data from the form
//     const formData = await request.formData();
//     const name = formData.get("name");
//     const description = formData.get("description");
//     const mrp = Number(formData.get("mrp"));
//     const price = Number(formData.get("price"));
//     const category = formData.get("category");
    
//     const images = formData.getAll("images");

//     if (
//       !name ||
//       !description ||
//       !mrp ||
//       !price ||
//       !category ||
//       !images ||
//       images.length < 1
//     ) {
//       return NextResponse.json(
//         { error: "missing product details" },
//         { status: 400 }
//       );
//     }

//     // Filter out any null/undefined images
//     const validImages = images.filter(image => image && image.size > 0);

//     if (validImages.length === 0) {
//       return NextResponse.json(
//         { error: "No valid images provided" },
//         { status: 400 }
//       );
//     }

//     // Upload images to imagekit
//     const imageUrls = await Promise.all(
//       validImages.map(async (image) => {
//         try {
//           const buffer = Buffer.from(await image.arrayBuffer());
//           const base64File = buffer.toString('base64');

//           const uploadFormData = new FormData();
//           uploadFormData.append('file', base64File);
//           uploadFormData.append('fileName', image.name);
//           uploadFormData.append('folder', '/products');
//           uploadFormData.append('useUniqueFileName', 'true');

//           const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
//             method: 'POST',
//             body: uploadFormData,
//             headers: {
//               'Authorization': `Basic ${Buffer.from(`${process.env.IMAGEKIT_PRIVATE_KEY}:`).toString('base64')}`
//             }
//           });

//           if (!uploadResponse.ok) {
//             const errorText = await uploadResponse.text();
//             throw new Error(`Image upload failed: ${uploadResponse.statusText}`);
//           }

//           const uploadResult = await uploadResponse.json();

//           const imagekitId = process.env.IMAGEKIT_URL_ENDPOINT?.replace('https://ik.imagekit.io/', '');
//           const optimizedImage = `https://ik.imagekit.io/${imagekitId}/tr:q-auto,f-webp,w-1024/${uploadResult.filePath}`;

//           return optimizedImage;
//         } catch (error) {
//           console.error("Error uploading image:", error);
//           throw new Error(`Failed to upload image: ${image.name}`);
//         }
//       })
//     );

//     // Create product in database - now storeId is a string
//     await prisma.product.create({
//       data: {
//         name,
//         description,
//         mrp,
//         price,
//         category,
//         images: imageUrls,
//         storeId, // This should now be a string
//       },
//     });

//     return NextResponse.json({ message: "Product added successfully" });
//   } catch (error) {
//     console.error("Product creation error:", error);
    
//     if (error.code === 'P2002') {
//       return NextResponse.json(
//         { error: "Product with similar details already exists" },
//         { status: 400 }
//       );
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
//     const authResult = await authSeller(userId);
    
//     if (!authResult || !authResult.isSeller) {
//       return NextResponse.json({ error: "not authorized" }, { status: 401 });
//     }

//     const storeId = authResult.storeId;
    
//     const products = await prisma.product.findMany({
//       where: { storeId },
//       orderBy: { createdAt: 'desc' }
//     });
    
//     return NextResponse.json({ products });
//   } catch (error) {
//     console.error("Products fetch error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
"use client";
import { assets } from "@/assets/assets";
import { useAuth } from "@clerk/clerk-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";

export default function StoreAddProduct() {
  const categories = [
    "Electronics",
    "Clothing",
    "Home & Kitchen",
    "Beauty & Health",
    "Toys & Games",
    "Sports & Outdoors",
    "Books & Media",
    "Food & Drink",
    "Hobbies & Crafts",
    "Others",
  ];

  const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null });
  const [productInfo, setProductInfo] = useState({
    name: "",
    description: "",
    mrp: 0,
    price: 0,
    category: "",
  });
  const [loading, setLoading] = useState(false);

  const { getToken } = useAuth();

  const onChangeHandler = (e) => {
    setProductInfo({ ...productInfo, [e.target.name]: e.target.value });
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      if (!images[1] && !images[2] && !images[3] && !images[4]) {
        return toast.error("Upload at least one image");
      }
      setLoading(true);

      const formData = new FormData();
      formData.append("name", productInfo.name);
      formData.append("description", productInfo.description);
      formData.append("mrp", productInfo.mrp);
      formData.append("price", productInfo.price);
      formData.append("category", productInfo.category);
      
      // Adding images to form data
      Object.keys(images).forEach((key) => {
        if (images[key]) {
          formData.append("images", images[key]);
        }
      });

      const token = await getToken();
      const { data } = await axios.post("/api/store/product", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(data.message);

      // Reset form
      setProductInfo({
        name: "",
        description: "",
        mrp: 0,
        price: 0,
        category: "",
      });
      
      // Reset images
      setImages({ 1: null, 2: null, 3: null, 4: null });
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={(e) =>
        toast.promise(onSubmitHandler(e), { loading: "Adding Product..." })
      }
      className="text-slate-500 mb-28"
    >
      <h1 className="text-2xl">
        Add New <span className="text-slate-800 font-medium">Products</span>
      </h1>
      <p className="mt-7">Product Images</p>

      <div className="flex gap-3 mt-4">
        {Object.keys(images).map((key) => (
          <label key={key} htmlFor={`images${key}`}>
            <Image
              width={300}
              height={300}
              className="h-15 w-auto border border-slate-200 rounded cursor-pointer"
              src={
                images[key]
                  ? URL.createObjectURL(images[key])
                  : assets.upload_area
              }
              alt=""
            />
            <input
              type="file"
              accept="image/*"
              id={`images${key}`}
              onChange={(e) =>
                setImages({ ...images, [key]: e.target.files[0] })
              }
              hidden
            />
          </label>
        ))}
      </div>

      <label className="flex flex-col gap-2 my-6 ">
        Name
        <input
          type="text"
          name="name"
          onChange={onChangeHandler}
          value={productInfo.name}
          placeholder="Enter product name"
          className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded"
          required
        />
      </label>

      <label className="flex flex-col gap-2 my-6 ">
        Description
        <textarea
          name="description"
          onChange={onChangeHandler}
          value={productInfo.description}
          placeholder="Enter product description"
          rows={5}
          className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded resize-none"
          required
        />
      </label>

      <div className="flex gap-5">
        <label className="flex flex-col gap-2 ">
          Actual Price ($)
          <input
            type="number"
            name="mrp"
            onChange={onChangeHandler}
            value={productInfo.mrp}
            placeholder="0"
            className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded resize-none"
            required
          />
        </label>
        <label className="flex flex-col gap-2 ">
          Offer Price ($)
          <input
            type="number"
            name="price"
            onChange={onChangeHandler}
            value={productInfo.price}
            placeholder="0"
            className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded resize-none"
            required
          />
        </label>
      </div>

      <select
        onChange={(e) =>
          setProductInfo({ ...productInfo, category: e.target.value })
        }
        value={productInfo.category}
        className="w-full max-w-sm p-2 px-4 my-6 outline-none border border-slate-200 rounded"
        required
      >
        <option value="">Select a category</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      <br />

      <button
        disabled={loading}
        className="bg-slate-800 text-white px-6 mt-7 py-2 hover:bg-slate-900 rounded transition"
      >
        Add Product
      </button>
    </form>
  );
}