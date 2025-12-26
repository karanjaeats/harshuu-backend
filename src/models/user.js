/**
 * HARSHUU Backend
 * User Model
 * OTP (Users) + Email/Password (Admin)
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ROLES } = require("../config/constants");

const userSchema = new mongoose.Schema(
  {
    /* =========================
       BASIC IDENTITY
    ========================== */
    name: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },

    mobile: {
      type: String,
      unique: true,
      sparse: true, // ✅ allows admin without mobile conflict
      index: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true, // ✅ allows OTP users without email
      index: true,
    },

    password: {
      type: String,
      select: false, // ✅ critical
    },

    /* =========================
       ROLE-BASED ACCESS
    ========================== */
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
      index: true,
    },

    /* =========================
       OTP AUTH (FUTURE USE)
    ========================== */
    otpHash: {
      type: String,
      select: false,
    },

    otpExpiresAt: {
      type: Date,
      select: false,
    },

    /* =========================
       ACCOUNT STATUS
    ========================== */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* =========================
   INDEXES
========================== */
userSchema.index({ email: 1 });
userSchema.index({ mobile: 1 });
userSchema.index({ role: 1, isActive: 1 });

/* =========================
   PASSWORD HASHING (ADMIN)
========================== */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

/* =========================
   OTP HELPERS (UNCHANGED)
========================== */
userSchema.methods.setOTP = async function (otp, expiryMinutes = 5) {
  const salt = await bcrypt.genSalt(10);
  this.otpHash = await bcrypt.hash(String(otp), salt);
  this.otpExpiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
};

userSchema.methods.verifyOTP = async function (otp) {
  if (!this.otpHash || !this.otpExpiresAt) return false;
  if (this.otpExpiresAt < Date.now()) return false;
  return bcrypt.compare(String(otp), this.otpHash);
};

userSchema.methods.clearOTP = function () {
  this.otpHash = undefined;
  this.otpExpiresAt = undefined;
};

/* =========================
   SAFE RESPONSE
========================== */
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    mobile: this.mobile,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
