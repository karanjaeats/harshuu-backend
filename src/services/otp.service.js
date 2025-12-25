/**
 * HARSHUU Backend
 * OTP Service
 * Production-grade (Zomato / Swiggy style)
 */

const crypto = require("crypto");
const User = require("../models/user");

// OTP validity (5 minutes)
const OTP_EXPIRY_MINUTES = 5;

// Max OTP attempts before lock
const MAX_OTP_ATTEMPTS = 5;

/**
 * =========================================
 * GENERATE OTP
 * =========================================
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * =========================================
 * SEND OTP (SMS GATEWAY HOOK)
 * =========================================
 * Replace console.log with real SMS provider
 */
const sendOTP = async (mobile, otp) => {
  // 🔐 In production: integrate MSG91 / Twilio / Fast2SMS
  console.log(`📩 OTP for ${mobile} is ${otp}`);
  return true;
};

/**
 * =========================================
 * REQUEST OTP
 * =========================================
 */
exports.requestOTP = async (mobile) => {
  const otp = generateOTP();
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

  let user = await User.findOne({ mobile });

  if (!user) {
    user = await User.create({
      mobile,
      role: "USER",
      otp: {
        hash: otpHash,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000),
        attempts: 0,
      },
    });
  } else {
    user.otp = {
      hash: otpHash,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000),
      attempts: 0,
    };
    await user.save();
  }

  await sendOTP(mobile, otp);

  return {
    success: true,
    message: "OTP sent successfully",
  };
};

/**
 * =========================================
 * VERIFY OTP
 * =========================================
 */
exports.verifyOTP = async (mobile, otp) => {
  const user = await User.findOne({ mobile });

  if (!user || !user.otp || !user.otp.hash) {
    return {
      success: false,
      message: "OTP not requested",
    };
  }

  // Expired
  if (user.otp.expiresAt < new Date()) {
    return {
      success: false,
      message: "OTP expired",
    };
  }

  // Too many attempts
  if (user.otp.attempts >= MAX_OTP_ATTEMPTS) {
    return {
      success: false,
      message: "Too many invalid attempts",
    };
  }

  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

  if (otpHash !== user.otp.hash) {
    user.otp.attempts += 1;
    await user.save();

    return {
      success: false,
      message: "Invalid OTP",
    };
  }

  // OTP success
  user.otp = undefined;
  user.isVerified = true;
  await user.save();

  return {
    success: true,
    user,
  };
};
