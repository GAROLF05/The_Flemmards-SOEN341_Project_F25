/* NOTE: This file should only contain the following:
- Express Router object
- Reference to controller
- Reference to middlewares
- get(subpath, middleware, controller.method) and post(subpath, middleware, controller.method) methods 
- module.exports = router at the end
*/

// Express
const express = require("express");
const router = express.Router();

// Controller
const userController = require("../controllers/userController");

// Middlewares
const { requireAuth, requireAdmin } = require("../middlewares/auth");

// Authentication routes (public - no middleware required)
router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.post("/logout", requireAuth, userController.logoutUser);

// User CRUD management (private - requires authentication)
router.get("/profile", requireAuth, userController.getUserProfile);
router.get("/by-id/:user_id", requireAuth, userController.getUserById);
router.get("/by-email/:email", requireAuth, userController.getUserByEmail);

// Update / Delete (requires authentication)
router.put("/update/:user_id", requireAuth, userController.updateUser);
router.delete("/delete/:user_id", requireAuth, userController.deleteUser);

// Admin routes (requires admin access)
router.get("/all", requireAdmin, userController.getAllUsers);
router.get("/count", requireAdmin, userController.countUsers);

// Export
module.exports = router;
