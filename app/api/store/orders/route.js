
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";

export async function POST(request) {
    try {
        const {userId} = getAuth(request);
        const authResult = await authSeller(userId); // This returns an object

        if(!authResult || !authResult.isSeller){
            return NextResponse.json({error: 'not authorized'}, {status: 401});
        }

        const storeId = authResult.storeId; // Extract storeId from the object

        const {orderId, status} = await request.json();

        await prisma.order.update({
            where: {id: orderId, storeId}, // Now storeId is a string
            data: {
                status
            }
        });
        
        return NextResponse.json({message: "Order Status updated"});
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: error.code || error.message}, {status: 400});
    }
}

// Get all order for a seller
export async function GET(request) {
    try {
        const {userId} = getAuth(request);
        const authResult = await authSeller(userId); // This returns an object

        if(!authResult || !authResult.isSeller){
            return NextResponse.json({error: 'not authorized'}, {status: 401});
        }

        const storeId = authResult.storeId; // Extract storeId from the object

        const orders = await prisma.order.findMany({
            where: {storeId}, // Now storeId is a string
            include: {user: true, address: true, orderItems: {include: {product: true}} },
            orderBy: {createdAt: 'desc'}
        });
        
        return NextResponse.json({ orders });

    } catch (error) {
        console.error(error);
        return NextResponse.json({error: error.code || error.message}, {status: 400});
    }
}