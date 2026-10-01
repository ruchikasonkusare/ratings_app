const express = require("express");

const authenticate = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

const {
  dashboard,
  createUser,
  createStore,
  getUsers,
  getUserDetails,
  getStores,
} = require("../controllers/adminController");

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("ADMIN"));

router.get("/dashboard", dashboard);
router.post("/users", createUser);
router.get("/users", getUsers);

router.get("/users/:id", getUserDetails);

router.post("/stores", createStore);

router.get("/stores", getStores);

module.exports = router;