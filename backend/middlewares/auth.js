/* NOTE: This file should only contain the following:
- JWT secret and initialization
- checkAuth middleware (attaches user to req if valid token)
- requireAuth middleware (redirects if not logged in)
- requireAdmin middleware (checks if user is admin)
- Error handling for authentication failures
*/

const jwt = require("jsonwebtoken");
const path = require("path");
const dotenv = require("dotenv");
const Administrator = require("../models/Administrators");

// Dotenv setup
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const jwtSecret =
  process.env.JWT_SECRET || "fallback-jwt-secret-change-in-production";

/**
 * Middleware to check authentication status
 * Attaches user to req.user if valid token exists
 * Does NOT require authentication - used globally
 * Supports both cookie-based and Authorization header tokens
 */
const checkAuth = (req, res, next) => {
  // Try to get token from cookie first, then from Authorization header
  let token = req.cookies.auth_token;
  
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
  }

  if (!token) {
    req.isLoggedIn = false;
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.isLoggedIn = true;
    req.user = {
      _id: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role, // Include role for easier access
    };
    return next();
  } catch (error) {
    console.error("JWT verification error:", error.message);
    req.isLoggedIn = false;
    req.user = null;
    // Clear invalid token cookie if it exists
    if (req.cookies.auth_token) {
      res.clearCookie("auth_token");
    }
    return next();
  }
};

/**
 * Middleware to require authentication
 * Returns 401 JSON error if not authenticated
 * Used for API routes
 */
const requireAuth = (req, res, next) => {
  if (!req.isLoggedIn || !req.user) {
    return res.status(401).json({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  next();
};

/**
 * Middleware to require admin access
 * Checks if user is in Administrators collection
 * Returns 403 JSON error if not admin
 */
const requireAdmin = async (req, res, next) => {
  if (!req.isLoggedIn || !req.user) {
    return res.status(401).json({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  try {
    const admin = await Administrator.findOne({ email: req.user.email }).lean();
    if (!admin) {
      return res.status(403).json({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }
    req.isAdmin = true;
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    return res.status(500).json({
      error: "Failed to verify admin status",
    });
  }
};

/**
 * Middleware to require authentication for view pages (redirects)
 * Used for server-rendered pages
 */
const requireAuthView = (req, res, next) => {
  if (!req.isLoggedIn) {
    return res.redirect("/login");
  }
  next();
};

/**
 * Middleware to require admin access for view pages (redirects)
 * Used for server-rendered pages
 */
const requireAdminView = async (req, res, next) => {
  if (!req.isLoggedIn) {
    return res.redirect("/login");
  }

  try {
    const admin = await Administrator.findOne({ email: req.user.email }).lean();
    if (!admin) {
      return res.redirect("/login?error=Admin access required");
    }
    req.isAdmin = true;
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    return res.redirect("/login?error=Failed to verify admin status");
  }
};

module.exports = {
  checkAuth,
  requireAuth,
  requireAdmin,
  requireAuthView,
  requireAdminView,
  jwtSecret,
};
