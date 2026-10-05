const prisma = require("../prisma");

const getOwnerDashboard = async (req, res) => {
  try {
    const ownerId = Number(req.user.userId);

    if (!Number.isInteger(ownerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid owner ID",
      });
    }

    const stores = await prisma.store.findMany({
      where: {
        ownerId,
      },
      include: {
        ratings: {
          select: {
            rating: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const storeData = stores.map((store) => {
      const ratings = store.ratings;

      const totalRatings = ratings.length;

      const averageRating =
        totalRatings > 0
          ? ratings.reduce(
              (sum, item) => sum + item.rating,
              0
            ) / totalRatings
          : 0;

      return {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        averageRating: Number(averageRating.toFixed(1)),
        totalRatings,
        raters: ratings.map((item) => ({
          userId: item.user.id,
          name: item.user.name,
          email: item.user.email,
          rating: item.rating,
          submittedAt: item.createdAt,
        })),
      };
    });

    const totalRatings = storeData.reduce(
      (sum, store) => sum + store.totalRatings,
      0
    );

    const allRatings = stores.flatMap(
      (store) => store.ratings
    );

    const overallAverage =
      allRatings.length > 0
        ? allRatings.reduce(
            (sum, item) => sum + item.rating,
            0
          ) / allRatings.length
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        stores: storeData,
        totalStores: stores.length,
        totalRatings,
        overallAverage: Number(overallAverage.toFixed(1)),
      },
    });
  } catch (error) {
    console.error("OWNER DASHBOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch owner dashboard",
      error: error.message,
    });
  }
};

module.exports = {
  getOwnerDashboard,
};