import prisma from "@/lib/prisma";

const authSeller = async (userId) => {
  try {
    if (!userId) {
      return {
        isSeller: false,
        message: "User not authenticated",
      };
    }

    const store = await prisma.store.findUnique({
      where: { userId },
    });

    if (store) {
      if (store.status === "approved" && store.isActive) {
        return {
          isSeller: true,
          storeId: store.id,
          storeInfo: store,
        };
      } else {
        return {
          isSeller: false,
          message:
            store.status !== "approved"
              ? `Store application is ${store.status}`
              : "Store is currently inactive",
          storeInfo: store,
        };
      }
    }

    return {
      isSeller: false,
      message: "No store found",
    };
  } catch (error) {
    console.error("Auth seller error:", error);
    return {
      isSeller: false,
      message: "Authentication error",
    };
  }
};

export default authSeller;