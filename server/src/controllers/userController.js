const bcrypt = require("bcryptjs");

const prisma = require("../prisma");

const {validatePassword} = require("../utils/validation");

const getStores = async (req, res) => {
  try {
    const {
      search = "",
      sortBy = "name",
      order = "asc",
    } = req.query;

    const stores = await prisma.store.findMany({
      where: {
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
      },
      include: {
        ratings: {
          select: {
            userId: true,
            rating: true,
          },
        },
      },
    });

    const result = stores.map((store) => {
      const ratings = store.ratings;

      const totalRating = ratings.reduce(
        (sum, item) => sum + item.rating,
        0
      );

      const averageRating =
        ratings.length > 0
          ? Number((totalRating / ratings.length).toFixed(1))
          : 0;

      const currentUserRating = ratings.find(
        (item) => item.userId === req.user.userId
      );

      return {
        id: store.id,
        name: store.name,
        address: store.address,
        averageRating,
        userRating: currentUserRating
          ? currentUserRating.rating
          : 0,
        ratingsCount: ratings.length,
      };
    });

    result.sort((a, b) => {
      let valueA = a[sortBy];
      let valueB = b[sortBy];

      if (valueA === null || valueA === undefined) valueA = 0;
      if (valueB === null || valueB === undefined) valueB = 0;

      if (typeof valueA === "string") {
        return order === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      return order === "asc"
        ? valueA - valueB
        : valueB - valueA;
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("GET STORES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


const submitRating = async (req, res) => {
  try {
    const storeId = Number(req.params.storeId);
    const userId = req.user.userId;
    const rating = Number(req.body.rating);

    if (!Number.isInteger(storeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid store ID",
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const store = await prisma.store.findUnique({
      where: {
        id: storeId,
      },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    const savedRating = await prisma.rating.upsert({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
      update: {
        rating,
      },
      create: {
        userId,
        storeId,
        rating,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Rating saved successfully",
      data: savedRating,
    });
  } catch (error) {
    console.error("SUBMIT RATING ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save rating",
      error: error.message,
    });
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