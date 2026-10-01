const prisma = require("../prisma");

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
    return res.status(500).json({message: "Server error"});
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

const getUserDetails = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (Number.isNaN(userId)) {
      return res.status(400).json({message: "Invalid user ID"});
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        createdAt: true,

        ratings: {
          select: {
            id: true,
            rating: true,
            createdAt: true,
            updatedAt: true,

            store: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },

        stores: {
          select: {
            id: true,
            name: true,
            email: true,
            address: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({message: "User not found",});
    }

    return res.json({user});
  } catch (error) {
    return res.status(500).json({message: "Server error"});
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

module.exports = {
  dashboard,
  createUser,
  createStore,
  getUsers,
  getUserDetails,
  getStores,
};