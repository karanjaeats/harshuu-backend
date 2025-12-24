/**
 * HARSHUU Backend
 * Admin Authorization Middleware (Production Grade)
 */

const User = require("../models/User");

/**
 * ===============================
 * ADMIN MIDDLEWARE
 * ===============================
 * - Must run AFTER auth.middleware
 * - Ensures user is ADMIN
 * - Ensures admin is active (not blocked)
 */
module.exports = async function adminMiddleware(req, res, next) {
  try {
    // auth.middleware must attach req.user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const admin = await User.findById(req.user.id).select(
      "_id role isBlocked"
    );

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (admin.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin access only",
      });
    }

    if (admin.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Admin account is blocked",
      });
    }

    // Attach admin to request (optional, useful for logs)
    req.admin = {
      id: admin._id,
      role: admin.role,
    };

    next();
  } catch (error) {
    console.error("ADMIN MIDDLEWARE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Admin authorization failed",
    });
  }
};
