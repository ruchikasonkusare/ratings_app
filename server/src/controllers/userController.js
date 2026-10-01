const bcrypt = require("bcryptjs");

const prisma = require("../prisma");

const {validatePassword} = require("../utils/validation");

const getStores = async (req, res) => {
  try {
    const {search = "",sort = "name",order = "asc",} = req.query;

    const allowedSortFields = [
      "name",
      "email",
      "address",
      "createdAt",
    ];

    const safeSort = allowedSortFields.includes(sort)? sort: "name";

    const safeOrder =order.toLowerCase() === "desc"? "desc": "asc";

    const stores = await prisma.store.findMany({
      where: search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                address: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {},

      include: {
        ratings: {
          select: {
            userId: true,
            rating: true,
          },
        },
      },

      orderBy: {
        [safeSort]: safeOrder,
      },
    });

    const formattedStores = stores.map((store) => {
        const total = store.ratings.reduce(
          (sum, item) => sum + item.rating,0
        );

        const averageRating =store.ratings.length > 0
            ? Number(
                (
                  total / store.ratings.length
                ).toFixed(2)
              )
            : 0;

        const currentUserRating =store.ratings.find(
            (item) =>item.userId === req.user.userId
          );

        return {
          id: store.id,
          name: store.name,
          email: store.email,
          address: store.address,

          overallRating: averageRating,

          myRating: currentUserRating
            ? currentUserRating.rating
            : null,
        };
      }
    );
    return res.json({stores: formattedStores});
  } catch (error) {
    return res.status(500).json({message: "Server error"});
  }
};


const submitRating = async (req, res) => {
  try {
    const storeId = Number(req.params.storeId);
    const { rating } = req.body;

    if (Number.isNaN(storeId)) {
        return res.status(400).json({message: "Invalid store ID"});
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({message:"Rating must be an integer between 1 and 5"});
    }

    const store = await prisma.store.findUnique({
      where: {
        id: storeId,
      },
    });

    if (!store) {
      return res.status(404).json({
        message: "Store not found",
      });
    }

    const result = await prisma.rating.upsert({
      where: {
        userId_storeId: {
          userId: req.user.userId,
          storeId,
        },
      },

      update: {rating},
      create: {
        userId: req.user.userId,
        storeId,
        rating,
      },
    });

    return res.json({
      message: "Rating submitted successfully",
      rating: result,
    });
  } catch (error) {
    return res.status(500).json({message: "Server error"});
  }
};

const updatePassword = async (req, res) => {
  try {
    const {oldPassword,newPassword} = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({message:"Old password and new password are required"});
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        message:"New password must be 8-16 characters and contain at least one uppercase letter and one special character",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
    });

    if (!user) {
      return res.status(404).json({message: "User not found"});
    }

    const correct = await bcrypt.compare(
      oldPassword,
      user.passwordHash
    );

    if (!correct) {
      return res.status(401).json({message: "Old password is incorrect",});
    }

    const passwordHash = await bcrypt.hash(newPassword,12);

    await prisma.user.update({
      where: {
        id: req.user.userId,
      },

      data: {
        passwordHash,
      },
    });

    return res.json({message: "Password updated successfully"});
  } catch (error) {
    console.error(error);

    return res.status(500).json({message: "Server error"});
  }
};

module.exports = {
  getStores,
  submitRating,
  updatePassword,
};