/* NOTE: This file should only contain the following:
- Calls to Models (User, Administrator, etc..)
- Functions that handle requests async (req,res)
- Logic for data validation, creation, modification
- Responses sent back to the frontend with res.json({....})
*/

// Models of DB
const { User, USER_ROLE } = require("../models/User");
const Administrator = require("../models/Administrators");
const Registration = require("../models/Registrations");
const Ticket = require("../models/Ticket");

// Utilities
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../middlewares/auth");
const { isAdmin } = require("../utils/authHelpers");
const emailService = require("../utils/emailService");
const crypto = require("crypto");

// API endpoint to Register a new user (signup)
exports.registerUser = async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;

    // Validate required fields
    if (!email || !email.trim())
      return res.status(400).json({ error: "Email is required" });

    if (!password)
      return res.status(400).json({ error: "Password is required" });

    if (!role) return res.status(400).json({ error: "Role is required" });

    if (!name || !name.trim())
      return res.status(400).json({ error: "Name is required" });

    // Validate role
    if (!Object.values(USER_ROLE).includes(role))
      return res.status(400).json({
        error: `Invalid role. Must be one of: ${Object.values(USER_ROLE).join(
          ", "
        )}`,
      });

    // Check for existing email
    const existingEmail = await User.findOne({
      email: email.toLowerCase().trim(),
    }).lean();
    if (existingEmail)
      return res.status(409).json({ error: "Email already in use" });

    // Check for existing username (if provided)
    if (username && username.trim()) {
      const existingUsername = await User.findOne({
        username: username.trim(),
      }).lean();
      if (existingUsername)
        return res.status(409).json({ error: "Username already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    // Organizers need admin approval, students are approved by default
    const isOrganizer = role === USER_ROLE.ORGANIZER;
    const verificationToken = emailService.generateVerificationToken();

    const newUser = new User({
      name: name ? name.trim() : null,
      username: username ? username.trim() : null,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role,
      approved: !isOrganizer, // Students approved by default, organizers need approval
      verificationToken: verificationToken,
      verified: false,
    });

    await newUser.save();

    console.log(
      `New user created: ${newUser.username || newUser.email} (Role: ${role})`
    );

    try {
      // Send verification email
      await emailService.sendVerificationEmail(
        newUser.email,
        newUser.name || newUser.username || "",
        newUser.role,
        verificationToken
      );
      console.log(`Verification email sent to ${newUser.email}`);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the registration if email fails - it's non-critical
    }

    // Return user without password
    const userResponse = {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      approved: newUser.approved,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    return res.status(201).json({
      message: "User registered successfully",
      user: userResponse,
    });
  } catch (e) {
    console.error("Signup error:", e);
    return res.status(500).json({ error: "Failed to register user" });
  }
};

// API endpoint to Login user and create JWT token
exports.loginUser = async (req, res) => {
  try {
    const { usernameEmail, password, role: requestedRole } = req.body;

    // Validate required fields
    if (!usernameEmail || !usernameEmail.trim())
      return res.status(400).json({ error: "Email or username is required" });

    if (!password)
      return res.status(400).json({ error: "Password is required" });

    let user = null;
    let isAdmin = false;

    // If admin role is requested, check Administrator collection first
    // Otherwise, prioritize User collection but still check both
    const checkAdminFirst =
      requestedRole && requestedRole.toLowerCase() === "admin";

    console.log("Login attempt:", {
      email: usernameEmail,
      requestedRole,
      checkAdminFirst,
    });

    if (checkAdminFirst) {
      // Check Administrator collection first for admin login
      const admin = await Administrator.findOne({
        $or: [
          { email: usernameEmail.toLowerCase().trim() },
          { username: usernameEmail.trim() },
        ],
      })
        .select("+password")
        .lean()
        .exec();

      if (admin) {
        // Verify password for administrator
        const isValidPassword = await bcrypt.compare(password, admin.password);
        if (!isValidPassword)
          return res
            .status(401)
            .json({ error: "Invalid email/username or password" });

        // Create admin user object for JWT
        user = {
          _id: admin._id,
          username: admin.username,
          email: admin.email,
          role: "Admin",
        };
        isAdmin = true;
        console.log("Admin login successful:", admin.email);
      } else {
        return res.status(401).json({
          error: "Invalid email/username or password for admin account",
        });
      }
    } else {
      // Regular login: check User collection first
      user = await User.findOne({
        $or: [
          { email: usernameEmail.toLowerCase().trim() },
          { username: usernameEmail.trim() },
        ],
      })
        .select("+password")
        .lean()
        .exec();

      if (!user) {
        // If not found in User collection, check Administrator collection
        const admin = await Administrator.findOne({
          $or: [
            { email: usernameEmail.toLowerCase().trim() },
            { username: usernameEmail.trim() },
          ],
        })
          .select("+password")
          .lean()
          .exec();

        if (admin) {
          // Verify password for administrator
          const isValidPassword = await bcrypt.compare(
            password,
            admin.password
          );
          if (!isValidPassword)
            return res
              .status(401)
              .json({ error: "Invalid email/username or password" });

          // Create admin user object for JWT
          user = {
            _id: admin._id,
            username: admin.username,
            email: admin.email,
            role: "Admin",
          };
          isAdmin = true;
          console.log("Admin login successful (fallback):", admin.email);
        } else {
          return res
            .status(401)
            .json({ error: "Invalid email/username or password" });
        }
      } else {
        // Verify password for regular user
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword)
          return res
            .status(401)
            .json({ error: "Invalid email/username or password" });

        // Check if email is verified
        if (!user.verified) {
          return res.status(403).json({
            error:
              "Please verify your email address before logging in. Check your email for the verification link.",
          });
        }

        console.log("User login successful:", user.email, "Role:", user.role);
      }
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username || user.email,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: "24h" }
    );

    // Set HTTP-only cookie
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log(
      `User logged in with JWT: ${user.username || user.email} (Role: ${
        user.role
      }, ID: ${user._id}, IsAdmin: ${isAdmin})`
    );

    // Return user without password
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      approved: user.approved !== false, // Default to true if not set (for backwards compatibility)
    };

    return res.status(200).json({
      message: "Login successful",
      user: userResponse,
      token: token,
    });
  } catch (e) {
    console.error("Login error:", e);
    return res.status(500).json({ error: "Failed to login" });
  }
};

// API endpoint to Logout user
exports.logoutUser = async (req, res) => {
  try {
    if (!req.user)
      return res
        .status(401)
        .json({ code: "UNAUTHORIZED", message: "Authentication required" });

    const username = req.user.username || req.user.email;
    res.clearCookie("auth_token");

    console.log(`User logged out: ${username}`);

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (e) {
    console.error("Logout error:", e);
    return res.status(500).json({ error: "Failed to logout" });
  }
};

// API endpoint to Get user by _id
exports.getUserById = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Validate user_id
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    if (!mongoose.Types.ObjectId.isValid(user_id))
      return res.status(400).json({ error: "Invalid user_id format" });

    const user = await User.findById(user_id).select("-password").lean().exec();

    if (!user) return res.status(404).json({ error: "User not found" });

    // Owner or admin may view
    const isOwner = user._id.toString() === req.user._id.toString();
    const adminCheck = await isAdmin(req);

    if (!isOwner && !adminCheck)
      return res
        .status(403)
        .json({ code: "FORBIDDEN", message: "Access denied" });

    return res.status(200).json({ user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
};

// API endpoint to Get user by email
exports.getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    // Validate email
    if (!email) return res.status(400).json({ error: "email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select("-password")
      .lean()
      .exec();

    if (!user) return res.status(404).json({ error: "User not found" });

    // Owner or admin may view
    const isOwner = user._id.toString() === req.user._id.toString();
    const adminCheck = await isAdmin(req);

    if (!isOwner && !adminCheck)
      return res
        .status(403)
        .json({ code: "FORBIDDEN", message: "Access denied" });

    return res.status(200).json({ user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
};

// API endpoint to Get user profile (current user)
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate(
        "organization",
        "name description website contact status verified _id"
      )
      .lean()
      .exec();

    if (!user) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({ user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

// API endpoint to Update user
exports.updateUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { username, email, password, role } = req.body;

    // Validate user_id
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    if (!mongoose.Types.ObjectId.isValid(user_id))
      return res.status(400).json({ error: "Invalid user_id format" });

    // Find user
    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Only owner or admin can update
    const isOwner = user._id.toString() === req.user._id.toString();
    const adminCheck = await isAdmin(req);

    if (!isOwner && !adminCheck)
      return res
        .status(403)
        .json({ code: "FORBIDDEN", message: "Access denied" });

    // Update fields

    if (username && username.trim()) {
      const existingUsername = await User.findOne({
        username: username.trim(),
        _id: { $ne: user._id },
      }).lean();
      if (existingUsername)
        return res.status(409).json({ error: "Username already in use" });
      user.username = username.trim();
    }

    if (email && email.trim()) {
      const existingEmail = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: user._id },
      }).lean();
      if (existingEmail)
        return res.status(409).json({ error: "Email already in use" });
      user.email = email.toLowerCase().trim();
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    // Only admins can update role
    if (role) {
      if (!Object.values(USER_ROLE).includes(role))
        return res.status(400).json({
          error: `Invalid role. Must be one of: ${Object.values(USER_ROLE).join(
            ", "
          )}`,
        });
      if (adminCheck) user.role = role;
      else
        return res.status(403).json({
          error: "Only admins can update user roles",
        });
    }

    await user.save();

    // Return user without password
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(200).json({
      message: "User updated successfully",
      user: userResponse,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to update user" });
  }
};

// API endpoint to verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: "Verification token is required" });
    }

    // Find user with this verification token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ error: "Invalid verification token" });
    }

    // Mark user as verified and remove verification token
    user.verified = true;
    user.verificationToken = undefined;
    await user.save();

    // Get the redirect URL from query params or use default
    const redirectTo =
      req.query.redirectTo || "http://localhost:5173/verify-success";

    // Redirect to frontend with success status
    res.redirect(`${redirectTo}?status=success`);
  } catch (e) {
    console.error("Email verification error:", e);
    return res.status(500).json({ error: "Failed to verify email" });
  }
};

// API endpoint to request a password reset (forgot password)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim())
      return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(200).json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token and expiry (1 hour)
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour

    await user.save();

    try {
      await emailService.sendPasswordResetEmail(
        user.email,
        user.name || user.username || "",
        resetToken
      );
    } catch (emailErr) {
      console.error("Failed to send password reset email:", emailErr);
    }

    return res.status(200).json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (e) {
    console.error("Forgot password error:", e);
    return res.status(500).json({ error: "Failed to process request" });
  }
};

// API endpoint to reset password using token
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token) return res.status(400).json({ error: "Token is required" });
    if (!password)
      return res.status(400).json({ error: "Password is required" });

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Hash new password and clear reset token fields
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res
      .status(200)
      .json({ message: "Password has been reset successfully" });
  } catch (e) {
    console.error("Reset password error:", e);
    return res.status(500).json({ error: "Failed to reset password" });
  }
};

// API endpoint to Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Validate user_id
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    if (!mongoose.Types.ObjectId.isValid(user_id))
      return res.status(400).json({ error: "Invalid user_id format" });

    // Find user
    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Only owner or admin can delete
    const isOwner = user._id.toString() === req.user._id.toString();
    const adminCheck = await isAdmin(req);

    if (!isOwner && !adminCheck)
      return res
        .status(403)
        .json({ code: "FORBIDDEN", message: "Access denied" });

    // Delete user's tickets and registrations
    let deletedTicketsCount = 0;
    let deletedRegistrationsCount = 0;

    // Find and delete all tickets for this user
    const userTickets = await Ticket.find({ user: user_id });
    if (userTickets.length > 0) {
      await Ticket.deleteMany({ user: user_id });
      deletedTicketsCount = userTickets.length;
    }

    // Find and delete all registrations for this user
    const userRegistrations = await Registration.find({ user: user_id });
    if (userRegistrations.length > 0) {
      await Registration.deleteMany({ user: user_id });
      deletedRegistrationsCount = userRegistrations.length;
    }

    // Delete user
    await User.findByIdAndDelete(user_id);

    return res.status(200).json({
      message: "User deleted successfully",
      deletedUser: user._id,
      deletedTicketsCount,
      deletedRegistrationsCount,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to delete user" });
  }
};
