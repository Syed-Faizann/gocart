import { clerkClient } from "@clerk/nextjs/server";
const authAdmin =  async (userId) =>{
    try{
        if(!userId) return false
        const client = await clerkClient()
        const user = await client.users.getUser(userId)
        console.log("🔍 Checking admin for user:", userId);
        console.log("User email:", user.emailAddresses[0].emailAddress);

        const adminList = process.env.ADMIN_EMAIL.split(",").map(e => e.trim());
console.log("Admin emails:", adminList);
console.log("User email:", user.emailAddresses[0].emailAddress);

        return adminList.includes(user.emailAddresses[0].emailAddress)
    }catch(error){
        console.error(error)
        return false
    }
}

export default authAdmin;


// import { clerkClient } from "@clerk/nextjs/server";
// import { getAuth } from "@clerk/nextjs/server";

// const authAdmin = async (userId) => {
//   try {
//     if (!userId) return false;

//     // Get user from Clerk
//     const user = await clerkClient.users.getUser(userId);

//     const userEmail = user.emailAddresses[0].emailAddress;

//     // Check if the email exists in admin email list
//     const adminEmails = process.env.ADMIN_EMAIL.split(",");

//     return adminEmails.includes(userEmail);
//   } catch (error) {
//     console.error(error);
//     return false;
//   }
// };

// export default authAdmin;
// middlewares/authAdmin.js
