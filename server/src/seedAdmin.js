require("dotenv/config");

const bcrypt = require("bcryptjs");
const prisma = require("./prisma");

async function main() {
  const passwordHash = await bcrypt.hash("Admin@123", 12);

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@example.com",
    },
    update: {
      role: "ADMIN",
    },
    create: {
      name: "System Administrator User",
      email: "admin@example.com",
      passwordHash,
      address: "Admin Office",
      role: "ADMIN",
    },
  });

  console.log("Admin created successfully:");
  console.log("Email:", admin.email);
  console.log("Password: Admin@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });