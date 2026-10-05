const express = require("express");

const authenticate = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

const {
  getStores,
  submitRating,
  updatePassword,
} = require("../controllers/userController");

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("USER"));

router.get("/stores", getStores);

// router.post("/stores/:storeId/rating",submitRating);

router.post(
  "/stores/:storeId/rating",
  authenticate,
  authorizeRoles("USER"),
  submitRating
);

router.put("/password",updatePassword);

module.exports = router;