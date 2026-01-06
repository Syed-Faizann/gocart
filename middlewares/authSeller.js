import prisma from "@/lib/prisma";

const authSeller = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { store: true },
    });

    if (user?.store) {
      if (user.store.status === "approved" && user.store.isActive) {
        return {
          isSeller: true,
          storeId: user.store.id,
          storeInfo: user.store
        };
      } else {
        return {
          isSeller: false,
          message: "Store not approved or inactive"
        };
      }
    } else {
      return {
        isSeller: false,
        message: "No store found"
      };
    }
  } catch (error) {
    console.error("Auth seller error:", error);
    return {
      isSeller: false,
      message: "Authentication error"
    };
  }
};

export default authSeller;