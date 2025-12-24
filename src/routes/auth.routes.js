/**
 * HARSHUU – Authentication Routes (Zomato-style)
 * OTP based login + JWT
 */

const express = require("express");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const rateLimiter = require("../middlewares/rateLimit.middleware");

const router = express.Router();

/**
 * STEP 1️⃣
 * Send OTP (Mock / Production-ready structure)
 */
router.post("/send-otp", rateLimiter, async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile || mobile.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit mobile number required"
      });
    }

    // 🔐 Zomato-style: OTP generation (demo)
    const otp = "123456"; // 🔴 Production मध्ये SMS gateway वापर

    let user = await User.findOne({ mobile });

    if (!user) {
      user = await User.create({
        mobile,
        role: "USER"
      });
    }

    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 min
    await user.save();

    return res.json({
      success: true,
      message: "OTP sent successfully"
      // OTP intentionally not returned
    });

  } catch (error) {
    console.error("SEND OTP ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP"
    });
  }
});

/**
 * STEP 2️⃣
 * Verify OTP & Login
 */
router.post("/verify-otp", rateLimiter, async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: "Mobile and OTP are required"
      });
    }

    const user = await User.findOne({ mobile });

    if (
      !user ||
      user.otp !== otp ||
      !user.otpExpiry ||
      user.otpExpiry < Date.now()
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    // OTP consume
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // 🔐 JWT Token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      role: user.role
    });

  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
});

/**
 * STEP 3️⃣
 * Get Logged-in User Profile
 */
router.get("/me", async (req, res) => {
  res.json({
    success: true,
    message: "Auth routes working"
  });
});

module.exports = router;
