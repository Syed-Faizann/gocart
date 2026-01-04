import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request) {
  try {
    console.log("=== ORDER API CALLED ===");
    
    // Get auth
    const auth = getAuth(request);
    const userId = auth.userId;
    const has = auth.has;
    
    console.log("Auth retrieved. User ID:", userId);
    
    if (!userId) {
      console.log("No user ID found - user not authenticated");
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    // Parse request body
    const requestBody = await request.json();
    console.log("Request body received:", JSON.stringify(requestBody, null, 2));

    const { addressId, items, couponCode, paymentMethod } = requestBody;

    // check if all required fields are present
    console.log("Validating fields:", {
      addressId: addressId,
      paymentMethod: paymentMethod,
      items: items,
      itemsIsArray: Array.isArray(items),
      itemsLength: items?.length || 0
    });

    if (!addressId) {
      console.log("Missing addressId");
      return NextResponse.json(
        { error: "Please select an address" },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      console.log("Missing paymentMethod");
      return NextResponse.json(
        { error: "Please select a payment method" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log("Invalid items:", items);
      return NextResponse.json(
        { error: "Your cart is empty" },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.id || !item.quantity) {
        console.log("Invalid item structure:", item);
        return NextResponse.json(
          { error: `Invalid item in cart` },
          { status: 400 }
        );
      }
    }

    let coupon = null;

    if (couponCode) {
      console.log("Looking for coupon:", couponCode);
      try {
        coupon = await prisma.coupon.findUnique({
          where: { code: couponCode.toUpperCase() },
        });
        if (!coupon) {
          console.log("Coupon not found");
          return NextResponse.json(
            { error: "Coupon not found" },
            { status: 400 }
          );
        }
        console.log("Coupon found:", coupon.code);
      } catch (couponError) {
        console.error("Coupon lookup error:", couponError);
        return NextResponse.json(
          { error: "Failed to validate coupon" },
          { status: 400 }
        );
      }
    }

    // Check if coupon available for new user
    if (couponCode && coupon?.forNewUser) {
      try {
        const userorders = await prisma.order.findMany({ where: { userId } });
        if (userorders.length > 0) {
          return NextResponse.json(
            { error: "Coupon valid for new user only" },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error("Error checking user orders:", error);
      }
    }

    let isPlusMember = false;
    try {
      isPlusMember = has({ plan: "plus" });
      console.log("Is Plus Member:", isPlusMember);
    } catch (hasError) {
      console.error("Error checking plus membership:", hasError);
    }

    // Check if coupon for member only
    if (couponCode && coupon?.forMember) {
      if (!isPlusMember) {
        return NextResponse.json(
          { error: "Coupon valid for member only" },
          { status: 400 }
        );
      }
    }

    // Group order by storeId using a map
    const orderByStore = new Map();
    console.log("Grouping items by store...");

    for (const item of items) {
      console.log(`Processing item: ${item.id}, quantity: ${item.quantity}`);
      
      let product;
      try {
        product = await prisma.product.findUnique({
          where: { id: item.id },
        });
      } catch (productError) {
        console.error(`Error finding product ${item.id}:`, productError);
        return NextResponse.json(
          { error: `Product ${item.id} not found` },
          { status: 400 }
        );
      }
      
      if (!product) {
        console.log(`Product ${item.id} not found`);
        return NextResponse.json(
          { error: `Product ${item.id} not found` },
          { status: 400 }
        );
      }
      
      console.log(`Found product: ${product.name}, storeId: ${product.storeId}`);
      
      const storeId = product.storeId;
      if (!orderByStore.has(storeId)) {
        orderByStore.set(storeId, []);
      }
      orderByStore.get(storeId).push({ 
        id: item.id, 
        quantity: item.quantity, 
        price: product.price 
      });
    }

    console.log(`Created ${orderByStore.size} store orders`);

    let orderIds = [];
    let fullAmount = 0;
    let isShippingFeeAdded = false;

    // Create orders for each seller
    for (const [storeId, sellerItems] of orderByStore.entries()) {
      console.log(`Creating order for store ${storeId} with ${sellerItems.length} items`);
      
      let total = sellerItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );
      console.log(`Subtotal for store ${storeId}: ${total}`);

      if (coupon) {
        const discount = (total * coupon.discount) / 100;
        total -= discount;
        console.log(`Applied coupon discount: ${discount}, New total: ${total}`);
      }
      
      if (!isPlusMember && !isShippingFeeAdded) {
        total += 5;
        isShippingFeeAdded = true;
        console.log(`Added shipping fee: 5, Total: ${total}`);
      }
      
      const finalTotal = parseFloat(total.toFixed(2));
      fullAmount += finalTotal;

      console.log(`Creating order in database: userId=${userId}, storeId=${storeId}, total=${finalTotal}`);

      let order;
      try {
        order = await prisma.order.create({
          data: {
            userId,
            storeId,
            addressId,
            total: finalTotal,
            paymentMethod,
            isCouponUsed: coupon ? true : false,
            coupon: coupon || {},
            orderItems: {
              create: sellerItems.map((item) => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.price,
              })),
            },
          },
        });
        
        console.log(`Order created with ID: ${order.id}`);
        orderIds.push(order.id);
      } catch (dbError) {
        console.error("Database error creating order:", dbError);
        // Check for specific Prisma errors
        if (dbError.code === 'P2003') {
          return NextResponse.json(
            { error: "Invalid address selected" },
            { status: 400 }
          );
        }
        throw dbError;
      }
    }

    if(paymentMethod === "STRIPE") {
      const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
      const origin = await request.headers.get("origin");

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Order'
            },
            unit_amount : Math.round(fullAmount * 100),
          },
          quantity: 1,
        }],
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 15 minutes
        mode: 'payment',
        success_url: `${origin}/order/loading?nextUrl=orders`,
        cancel_url: `${origin}/cart`,
        metadata: {orderIds: orderIds.join(","),
          userId,
          appId: "gocart"
        }
      })
      return NextResponse.json({session});
    }


    // clear the cart after order is placed
    console.log("Clearing user cart...");
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          cart: [],
        },
      });
      console.log("Cart cleared successfully");
    } catch (cartError) {
      console.error("Error clearing cart:", cartError);
      // Don't fail the order if cart clearing fails
    }

    console.log("Order creation completed successfully");
    return NextResponse.json({ 
      success: true,
      message: "Order placed successfully",
      orderIds 
    });
  } catch (error) {
    console.error("Unhandled order creation error:", error);
    console.error("Error stack:", error.stack);
    
    // Check for Prisma specific errors
    if (error.code && error.code.startsWith('P')) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Get all orders for a user
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { 
        userId, 
        OR: [
          { paymentMethod: "COD" },
          { AND: [{ paymentMethod: "STRIPE" }, { isPaid: true }] }
        ]
      },
      include: {
        orderItems: { include: { product: true } },
        address: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}