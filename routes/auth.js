const express = require("express");
const authController = require("../controllers/auth");
const protect = require("../middleware/auth");

const router = express.Router();

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/password/forgot", authController.forgotPassword);
router.put("/password/reset", authController.resetPassword);
router.post("/auth/google", authController.googleLogin);
router.get("/auth/me", protect, authController.getCurrentUser);
router.post("/logout", authController.logoutUser);

module.exports = router;
