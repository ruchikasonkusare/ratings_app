const express = require("express");
const cors = require("cors");

const prisma = require("./prisma");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const ownerRoutes = require("./routes/ownerRoutes");

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
  res.json({message: "Rating App API is running"});
});

app.get("/test-db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({message: "Database connected successfully"});
  } catch (error) {
    res.status(500).json({message: "Database connection failed"});
  }
});

app.use("/api/auth",authRoutes);

app.use("/api/admin",adminRoutes);

app.use("/api/user",userRoutes);

app.use("/api/owner",ownerRoutes);

app.use((req, res) => {
  res.status(404).json({message: "Route not found"});
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});