/**
 * HARSHUU Backend
 * Authentication Middleware (Production Grade)
 */

const jwt = require("jsonwebtoken");
const User = require("../models/user");

/**
 * ===============================
 * AUTH MIDDLEWARE
 * ===============================
 * - Verifies JWT access token
 * - Attaches user to request
 */
module.exports = async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message:
          err.name === "TokenExpiredError"
            ? "Access token expired"
            : "Invalid access token",
      });
    }

    const user = await User.findById(decoded.id).select(
      "_id role mobile isBlocked"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "User account is blocked",
      });
    }

    // Attach user to request
    req.user = {
      id: user._id,
      role: user.role,
      mobile: user.mobile,
    };

    next();
  } catch (error) {
    console.error("AUTH MIDDLEWARE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};
