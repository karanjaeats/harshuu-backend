/**
 * HARSHUU Backend
 * Rate limiting Middleware (Production Grade)
 */

const ratelimit = require("express-rate-limit");

/**
 * ===============================
 * GENERAL API RATE LIMIT
 * ===============================
 * Applied to:
 * - Auth routes
 * - Public APIs
 */
const generallimiter = ratelimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

/**
 * ===============================
 * OTP / AUTH RATE LIMIT
 * ===============================
 * Strict limiter for:
 * - OTP send
 * - OTP verify
 * - Login
 */
const authlimiter = ratelimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // 10 OTP attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many authentication attempts. Please wait before retrying.",
  },
});

/**
 * ===============================
 * ORDER / PAYMENT RATE LIMIT
 * ===============================
 * Prevents order spam & payment abuse
 */
const orderlimiter = ratelimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 order/payment actions
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many order requests. Please slow down and try again.",
  },
});

module.exports = {
  generallimiter,
  authlimiter,
  orderlimiter,
};
