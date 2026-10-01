const bcrypt = require("bcryptjs");

const prisma = require("../prisma");

const {validatePassword} = require("../utils/validation");

const dashboard = async (req, res) => {
  try {
    const store = await prisma.store.findFirst({
      where: {
        ownerId: req.user.userId,
      },

      include: {
        ratings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!store) {
      return res.status(404).json({message: "No store assigned to this owner"});
    }

    const total = store.ratings.reduce((sum, item) => sum + item.rating,0);

    const averageRating =store.ratings.length > 0 ? Number((total / store.ratings.length).toFixed(2)): 0;

    const ratings = store.ratings.map((item) => ({
        ratingId: item.id,
        rating: item.rating,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        user: item.user,
      })
    );

    return res.json({
      store: {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
      },

      averageRating,

      totalRatings: store.ratings.length,

      ratings,
    });
  } catch (error) {
    return res.status(500).json({message: "Server error"});
  }
};


const updatePassword = async (req, res) => {
  try {
    const {oldPassword,newPassword,} = req.body;

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

    return res.json({message: "Password updated successfully",});
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  dashboard,
  updatePassword,
};