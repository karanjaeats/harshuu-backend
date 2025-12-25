/**
 * HARSHUU Backend
 * Authentication Routes (OTP + JWT)
 */

const express = require("express");
const User = require("../models/user");
const Wallet = require("../models/wallet");

const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../config/jwt");

const { ROLES, OTP_CONFIG } = require("../config/constants");

const router = express.Router();

/* ===============================
   SEND OTP
================================ */
router.post("/send-otp", async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    let user = await User.findOne({ mobile });

    if (!user) {
      user = await User.create({
        mobile,
        role: ROLES.USER,
      });
      await Wallet.create({ userId: user._id });
    }

    await user.setOTP(otp, OTP_CONFIG.EXPIRY_MINUTES);
    await user.save();

    console.log("🔐 OTP:", mobile, otp);

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
});

/* ===============================
   VERIFY OTP
================================ */
router.post("/verify-otp", async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: "Mobile and OTP are required",
      });
    }

    const user = await User.findOne({ mobile }).select("+otpHash +otpExpiresAt");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const valid = await user.verifyOTP(otp);

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    user.clearOTP();
    user.lastLoginAt = new Date();
    await user.save();

    const payload = { id: user._id, role: user.role };

    return res.json({
      success: true,
      user: user.toSafeObject(),
      tokens: {
        accessToken: signAccessToken(payload),
        refreshToken: signRefreshToken(payload),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

/* ===============================
   REFRESH TOKEN
================================ */
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false });
    }

    return res.json({
      success: true,
      accessToken: signAccessToken({
        id: user._id,
        role: user.role,
      }),
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
});

/* ===============================
   LOGOUT
================================ */
router.post("/logout", (req, res) => {
  return res.json({
    success: true,
    message: "Logged out",
  });
});

module.exports = router;
