// import prisma from "@/lib/prisma"
// import { getAuth } from "@clerk/nextjs/server"   
// import { NextResponse } from "next/server"


// // export async function POST(request) {
// //         try {
// //             const {userId} = getAuth(request)
// //             const {address} = await request.json()

// //             address.userId = userId

// //             const newAddress = await prisma.address.create({
// //                 data: address
// //             })

// //             return NextResponse.json({message: 'Address updated'})
// //         } catch (error) {
// //                console.log(error)
// //             return NextResponse.json({error: error.code || error.message}, {status: 400})
// //         }
// // }
// export async function POST(request) {
//     try {
//         const { userId } = getAuth(request)
//         const body = await request.json()

//         const newAddress = await prisma.address.create({
//             data: {
//                 ...body,
//                 userId
//             }
//         })

//         return NextResponse.json({
//             message: 'Address added',
//             newAddress
//         })
//     } catch (error) {
//         console.log(error)
//         return NextResponse.json({ error }, { status: 400 })
//     }
// }


// // Get all addresess of a user

// export async function GET(request) {
//         try {
//             const {userId} = getAuth(request)
          

         

//             const addresses = await prisma.address.findMany({
//                 where:{userId}
//             })

//             return NextResponse.json({addresses})
//         } catch (error) {
//                console.log(error)
//             return NextResponse.json({error: error.code || error.message}, {status: 400})
//         }
// }

import prisma from "@/lib/prisma"
import { getAuth } from "@clerk/nextjs/server"   
import { NextResponse } from "next/server"

// Create a new address
export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        const body = await request.json()  // <-- FIXED

        const newAddress = await prisma.address.create({
            data: {
                ...body,     // <-- Use entire body
                userId       // <-- attach userId here
            }
        })

        return NextResponse.json({
            message: "Address added successfully",
            newAddress
        })
    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}

// Get all addresses for the logged-in user
export async function GET(request) {
    try {
        const { userId } = getAuth(request)

        const addresses = await prisma.address.findMany({
            where: { userId }
        })

        return NextResponse.json({ addresses })
    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
