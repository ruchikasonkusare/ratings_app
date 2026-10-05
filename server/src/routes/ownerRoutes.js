const express = require("express");

const authenticate = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

const {
  dashboard,
  updatePassword,
  getOwnerDashboard,
} = require("../controllers/ownerController");

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("OWNER"));

router.get("/dashboard", getOwnerDashboard);

// router.put("/password",updatePassword);

module.exports = router;