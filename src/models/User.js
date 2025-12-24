/**
 * HARSHUU Backend
 * User Model
 * Production-grade (Zomato / Swiggy style)
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ROLES } = require("../config/constants");

const userSchema = new mongoose.Schema(
  {
    /**
     * BASIC IDENTITY
     */
    name: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },

    /**
     * ROLE-BASED ACCESS CONTROL
     */
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
      index: true,
    },

    /**
     * OTP AUTHENTICATION
     */
    otpHash: {
      type: String,
      select: false,
    },

    otpExpiresAt: {
      type: Date,
      select: false,
    },

    /**
     * ACCOUNT STATUS
     */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    /**
     * FRAUD & SECURITY TRACKING
     */
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    lastLoginAt: {
      type: Date,
    },

    /**
     * WALLET (USED FOR REFUNDS / PAYOUTS)
     */
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    /**
     * LOCATION (FOR DELIVERY & PRICING)
     */
    location: {
      address: String,
      lat: Number,
      lng: Number,
    },

    /**
     * METADATA
     */
    deviceInfo: {
      type: String,
    },

  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * ============================
 * INDEXES (PERFORMANCE)
 * ============================
 */
userSchema.index({ mobile: 1 });
userSchema.index({ role: 1, isActive: 1 });

/**
 * ============================
 * OTP HELPERS
 * ============================
 */

/**
 * Set OTP
 */
userSchema.methods.setOTP = async function (otp, expiryMinutes = 5) {
  const salt = await bcrypt.genSalt(10);
  this.otpHash = await bcrypt.hash(String(otp), salt);
  this.otpExpiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
};

/**
 * Verify OTP
 */
userSchema.methods.verifyOTP = async function (otp) {
  if (!this.otpHash || !this.otpExpiresAt) return false;
  if (this.otpExpiresAt < Date.now()) return false;
  return bcrypt.compare(String(otp), this.otpHash);
};

/**
 * Clear OTP after successful login
 */
userSchema.methods.clearOTP = function () {
  this.otpHash = undefined;
  this.otpExpiresAt = undefined;
};

/**
 * ============================
 * SAFE JSON RESPONSE
 * ============================
 */
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    mobile: this.mobile,
    email: this.email,
    role: this.role,
    walletBalance: this.walletBalance,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
