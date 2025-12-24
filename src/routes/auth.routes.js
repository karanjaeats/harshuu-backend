/**
 * HARSHUU Backend
 * Authentication Routes (OTP + JWT)
 * Production-grade (Zomato / Swiggy style)
 */

const express = require("express");
const User = require("../models/User");
const Wallet = require("../models/Wallet");

const {
  signAccessToken,
  signRefreshToken,
} = require("../config/jwt");

const { ROLES, OTP_CONFIG } = require("../config/constants");

const router = express.Router();

/**
 * ==============================
 * SEND OTP (LOGIN / REGISTER)
 * ==============================
 * POST /api/auth/send-otp
 * body: { mobile }
 */
router.post("/send-otp", async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    // Generate OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    );

    // Find or create user
    let user = await User.findOne({ mobile });

    if (!user) {
      user = await User.create({
        mobile,
        role: ROLES.USER,
      });

      // Create wallet for new user
      await Wallet.create({ userId: user._id });
    }

    // Set OTP
    await user.setOTP(otp, OTP_CONFIG.EXPIRY_MINUTES);
    await user.save();

    /**
     * ⚠️ REAL WORLD:
     * Send OTP via SMS provider here (MSG91 / Twilio)
     * For now, returning OTP only for development
     */
    console.log("🔐 OTP for", mobile, "=>", otp);

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
});

/**
 * ==============================
 * VERIFY OTP & LOGIN
 * ==============================
 * POST /api/auth/verify-otp
 * body: { mobile, otp }
 */
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

    if (!user.isActive || user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Account blocked or inactive",
      });
    }

    const isValidOtp = await user.verifyOTP(otp);

    if (!isValidOtp) {
      user.failedLoginAttempts += 1;
      await user.save();

      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Clear OTP & reset attempts
    user.clearOTP();
    user.failedLoginAttempts = 0;
    user.lastLoginAt = new Date();
    await user.save();

    // JWT Payload
    const payload = {
      id: user._id,
      role: user.role,
    };

    // Tokens
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    return res.json({
      success: true,
      user: user.toSafeObject(),
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

/**
 * ==============================
 * REFRESH TOKEN
 * ==============================
 * POST /api/auth/refresh
 * body: { refreshToken }
 */
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token required",
      });
    }

    const { verifyRefreshToken } = require("../config/jwt");

    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.id);

    if (!user || !user.isActive || user.isBlocked) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const newAccessToken = signAccessToken({
      id: user._id,
      role: user.role,
    });

    return res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("REFRESH TOKEN ERROR:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
});

/**
 * ==============================
 * LOGOUT
 * ==============================
 * POST /api/auth/logout
 */
router.post("/logout", async (req, res) => {
  // Stateless JWT → frontend deletes token
  return res.json({
    success: true,
    message: "Logged out successfully",
  });
});

module.exports = router;      return res.status(400).json({
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
