/**
 * HARSHUU Backend
 * Auth Controller
 * OTP + JWT (Zomato / Swiggy style)
 */

const User = require("../models/user");
const Wallet = require("../models/wallet");

const otpService = require("../services/otp.service");
const jwtService = require("../config/jwt");

const { USER_ROLES } = require("../config/constants");

/**
 * ===============================
 * SEND OTP
 * ===============================
 * POST /api/auth/send-otp
 */
exports.sendOtp = async (req, res) => {
  try {
    const { mobile, role } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    const userRole = role || USER_ROLES.USER;

    if (!Object.values(USER_ROLES).includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    await otpService.sendOtp(mobile);

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
};

/**
 * ===============================
 * VERIFY OTP & LOGIN / REGISTER
 * ===============================
 * POST /api/auth/verify-otp
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { mobile, otp, role, name } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: "Mobile and OTP are required",
      });
    }

    const isValid = await otpService.verifyOtp(mobile, otp);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    let user = await User.findOne({ mobile });

    // New user registration
    if (!user) {
      user = await User.create({
        mobile,
        role: role || USER_ROLES.USER,
        name: name || "HARSHUU User",
        isActive: true,
      });

      // Create wallet for new user
      await Wallet.create({
        userId: user._id,
        balance: 0,
        transactions: [],
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is disabled",
      });
    }

    const accessToken = jwtService.generateAccessToken(user);
    const refreshToken = jwtService.generateRefreshToken(user);

    user.lastLoginAt = new Date();
    await user.save();

    return res.json({
      success: true,
      tokens: {
        accessToken,
        refreshToken,
      },
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

/**
 * ===============================
 * REFRESH ACCESS TOKEN
 * ===============================
 * POST /api/auth/refresh
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token required",
      });
    }

    const payload = jwtService.verifyRefreshToken(refreshToken);

    const user = await User.findById(payload.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const newAccessToken = jwtService.generateAccessToken(user);

    return res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("REFRESH TOKEN ERROR:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};

/**
 * ===============================
 * LOGOUT
 * ===============================
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    // Stateless JWT → frontend just deletes tokens
    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};
