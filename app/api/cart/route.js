// import prisma from "@/lib/prisma";
// import { getAuth } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";



// Update user cart


// export async function POST(request) {
//         try {
//             const {userId} = getAuth(request)
//             const {cart} = await request.json()

//             await prisma.user.update({
//                 where: {id: userId},
//                 data: {cart: cart}
//             })

//             return NextResponse.json({message: 'Cart updated'})
//         } catch (error) {
//                console.log(error)
//             return NextResponse.json({message: 'Error getting cart'}, {status: 400})
//         }
// }


import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
    console.log('API: POST /api/cart called');
    
    try {
        const { userId } = getAuth(request);
        console.log('User ID from auth:', userId);
        
        if (!userId) {
            console.log('No user ID found');
            return NextResponse.json({message: 'Unauthorized'}, {status: 401})
        }

        const body = await request.json();
        console.log('Request body:', body);
        
        const cart = body.cart || {};
        console.log('Cart data to save:', cart);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });
        
        console.log('Existing user:', existingUser ? 'Found' : 'Not found');
        
        if (!existingUser) {
            // Create user if doesn't exist (optional, depends on your flow)
            console.log('Creating new user...');
            await prisma.user.create({
                data: {
                    id: userId,
                    name: 'User', // You might want to get this from Clerk
                    email: `${userId}@temp.com`, // Temporary email
                    cart: cart
                }
            });
        } else {
            // Update existing user
            console.log('Updating existing user cart...');
            await prisma.user.update({
                where: { id: userId },
                data: { cart: cart }
            });
        }

        console.log('Cart updated successfully');
        return NextResponse.json({message: 'Cart updated', cart: cart})
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({message: 'Error updating cart', error: error.message}, {status: 400})
    }
}
// Get user cart


export async function GET(request) {
        try {
            const {userId} = getAuth(request)
           
            const user = await prisma.user.findUnique({
                where: {id: userId},
            })

            return NextResponse.json({ cart:  user.cart})
        } catch (error) {
            console.log(error)
            return NextResponse.json({message: 'Error getting cart'}, {status: 400})
        }
}
