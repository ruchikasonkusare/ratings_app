const bcrypt = require('bcryptjs');
const prisma = require("../prisma");
const { validateEmail, validateAddress, validateName,validatePassword } = require("../utils/validation");

const dashboard = async (req, res) => {
  try {
    const [totalUsers, totalStores, totalRatings] =await Promise.all([
        prisma.user.count(),
        prisma.store.count(),
        prisma.rating.count(),
      ]);

    res.json({totalUsers,totalStores,totalRatings,});
  } catch (error) {
    res.status(500).json({message: "Server error"});
  }
};

module.exports = {
  dashboard,
};

const createUser = async (req, res) => {
  try {
    const {name,email,password,address,role} = req.body;

    if (!name || !email || !password || !address || !role) {
      return res.status(400).json({message: "All fields are required"});
    }

    if (!validateName(name)) {
      return res.status(400).json({message:"Name must be between 20 and 60 characters"});
    }

    if (!validateEmail(email)) {
      return res.status(400).json({message: "Invalid email address"});
    }

    if (!validatePassword(password)) {
      return res.status(400).json({message:"Password must be 8-16 characters and contain at least one uppercase letter and one special character"});
    }

    if (!validateAddress(address)) {
      return res.status(400).json({message:"Address cannot exceed 400 characters"});
    }

    const allowedRoles = ["USER","ADMIN","OWNER",];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({message: "Invalid role"});
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {email},
      });

    if (existingUser) {
      return res.status(409).json({message: "Email already registered"});
    }

    const passwordHash = await bcrypt.hash(password,12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        address,
        role,
      },
    });

    return res.status(201).json({
      message: "User created successfully",

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({message: "Server error",error});
  }
};


const createStore = async (req, res) => {
  try {
    const {name,email,address,ownerId} = req.body;

    if (!name || !email || !address) {
      return res.status(400).json({message:"Store name, email and address are required"});
    }

    if (name.length < 1) {
      return res.status(400).json({message: "Store name is required"});
    }

    if (name.length > 60) {
      return res.status(400).json({message:"Store name cannot exceed 60 characters"});
    }

    if (!validateEmail(email)) {
      return res.status(400).json({message: "Invalid email address"});
    }

    if (!validateAddress(address)) {
      return res.status(400).json({message:"Address cannot exceed 400 characters"});
    }

    let validOwnerId = null;

    if (ownerId !== undefined && ownerId !== null) {
      const owner = await prisma.user.findUnique({
        where: {id: Number(ownerId)},
      });

      if (!owner) {
        return res.status(404).json({message: "Owner not found"});
      }

      if (owner.role !== "OWNER") {
        return res.status(400).json({message:"Selected user is not a store owner"});
      }

      validOwnerId = owner.id;
    }

    const store = await prisma.store.create({
      data: {
        name,
        email,
        address,
        ownerId: validOwnerId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Store created successfully",
      store,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({message: "Server error"});
  }
};

const getUsers = async (req, res) => {
  try {
    const {search = "",role,sort = "name",order = "asc"} = req.query;

    const allowedSortFields = [
      "name",
      "email",
      "address",
      "role",
      "createdAt",
    ];

    const safeSort = allowedSortFields.includes(sort)? sort: "name";
    const safeOrder =order.toLowerCase() === "desc"? "desc": "asc";
    const where = {};

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
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
      ];
    }

    if (role) {
      if (!["USER", "ADMIN", "OWNER"].includes(role)) {
        return res.status(400).json({message: "Invalid role",});
      }

      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        createdAt: true,
      },

      orderBy: {
        [safeSort]: safeOrder,
      },
    });

    return res.json({users});
  } catch (error) {
    return res.status(500).json({message: "Server error"});
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const { name, email, address, role } = req.body;

    if (!name || !email || !address || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, address and role are required",
      });
    }

    const allowedRoles = ["ADMIN", "USER", "OWNER"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const emailUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (emailUser && emailUser.id !== userId) {
      return res.status(409).json({
        success: false,
        message: "Email already belongs to another user",
      });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name,
        email,
        address,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        _count: {
          select: {
            ratings: true,
            stores: true,
          },
        },
        stores: {
          select: {
            id: true,
            name: true,
            email: true,
            address: true,
            ratings: {
              select: {
                rating: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Calculate store ratings for owners
    const stores = user.stores.map((store) => {
      const totalRatings = store.ratings.length;

      const averageRating =
        totalRatings > 0
          ? store.ratings.reduce(
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
        ratingsCount: totalRatings,
      };
    });

    // Don't send password hash
    const {
      passwordHash,
      stores: userStores,
      ...userData
    } = user;

    return res.status(200).json({
      success: true,
      data: {
        ...userData,
        stores,
      },
    });
  } catch (error) {
    console.error("GET USER DETAILS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user details",
      error: error.message,
    });
  }
};


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
                email: {
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
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        ratings: {
          select: {
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
          (sum, item) => sum + item.rating,
          0
        );
        const averageRating =store.ratings.length > 0 ? Number((total / store.ratings.length).toFixed(2)):0;

        return {
          id: store.id,
          name: store.name,
          email: store.email,
          address: store.address,
          owner: store.owner,
          averageRating,
          totalRatings: store.ratings.length,
          createdAt: store.createdAt,
        };
      }
    );

    return res.json({stores: formattedStores,});
  } catch (error) {
    return res.status(500).json({message: "Server error"});
  }
};

const getStoreDetails = async (req, res) => {
  try {
    const storeId = Number(req.params.id);

    console.log("STORE ID:", storeId);

    if (!Number.isInteger(storeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid store ID",
      });
    }

    const store = await prisma.store.findUnique({
      where: {
        id: storeId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            ratings: true,
          },
        },
      },
    });

    console.log("STORE FOUND:", store);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    const ratingAggregate = await prisma.rating.aggregate({
      where: {
        storeId: storeId,
      },
      _avg: {
        rating: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        ...store,
        averageRating: ratingAggregate._avg.rating || 0,
      },
    });
  } catch (error) {
    console.error("GET STORE DETAILS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch store details",
      error: error.message,
    });
  }
};

const updateStore = async (req, res) => {
  try {
    const storeId = Number(req.params.id);
    const { name, email, address, ownerId } = req.body;

    // Validate store ID
    if (!Number.isInteger(storeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid store ID",
      });
    }

    // Required fields
    if (!name || !email || !address) {
      return res.status(400).json({
        success: false,
        message: "Name, email and address are required",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanAddress = address.trim();

    // Store name validation
    if (cleanName.length < 20 || cleanName.length > 60) {
      return res.status(400).json({
        success: false,
        message: "Store name must be between 20 and 60 characters",
      });
    }

    // Address validation
    if (cleanAddress.length > 400) {
      return res.status(400).json({
        success: false,
        message: "Address must not exceed 400 characters",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    // Check that store exists
    const existingStore = await prisma.store.findUnique({
      where: {
        id: storeId,
      },
    });

    if (!existingStore) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    // Validate owner
    let newOwnerId = null;

    if (
      ownerId !== null &&
      ownerId !== undefined &&
      ownerId !== ""
    ) {
      const owner = await prisma.user.findUnique({
        where: {
          id: Number(ownerId),
        },
      });

      if (!owner) {
        return res.status(404).json({
          success: false,
          message: "Owner not found",
        });
      }

      if (owner.role !== "OWNER") {
        return res.status(400).json({
          success: false,
          message: "Selected user is not an owner",
        });
      }

      newOwnerId = owner.id;
    }

    // Update store
    const updatedStore = await prisma.store.update({
      where: {
        id: storeId,
      },
      data: {
        name: cleanName,
        email: cleanEmail,
        address: cleanAddress,
        ownerId: newOwnerId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            ratings: true,
          },
        },
      },
    });

    // Calculate average rating
    const ratingAggregate = await prisma.rating.aggregate({
      where: {
        storeId: storeId,
      },
      _avg: {
        rating: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Store updated successfully",
      data: {
        ...updatedStore,
        averageRating: ratingAggregate._avg.rating || 0,
      },
    });
  } catch (error) {
    console.error("UPDATE STORE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update store",
      error: error.message,
    });
  }
};

module.exports = {
  dashboard,
  createUser,
  createStore,
  getUsers,
  getUserDetails,
  getStores,
  getStoreDetails,
  updateStore,
  updateUser
};