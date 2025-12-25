/**
 * HARSHUU Backend
 * Authentication Routes (EMAIL + PASSWORD + JWT)
 * ADMIN LOGIN (Production Ready)
 */

const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} = require("../config/jwt");

const router = express.Router();

/* ===============================
   ADMIN LOGIN (EMAIL + PASSWORD)
   POST /api/auth/admin-login
================================ */
router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // 2️⃣ find admin
    const admin = await User.findOne({
      email,
      role: "ADMIN"
    }).select("+password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin not found"
      });
    }

    if (!admin.isActive || admin.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Admin account disabled"
      });
    }

    // 3️⃣ password check
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password"
      });
    }

    // 4️⃣ tokens
    const payload = {
      id: admin._id,
      role: admin.role
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    return res.json({
      success: true,
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });

  } catch (err) {
    console.error("ADMIN LOGIN ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
});

/* ===============================
   REFRESH TOKEN
================================ */
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token required"
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive || user.isBlocked) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token"
      });
    }

    return res.json({
      success: true,
      accessToken: signAccessToken({
        id: user._id,
        role: user.role
      })
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid refresh token"
    });
  }
});

/* ===============================
   LOGOUT
================================ */
router.post("/logout", (req, res) => {
  return res.json({
    success: true,
    message: "Logged out successfully"
  });
});

module.exports = router;
