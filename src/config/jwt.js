/**
 * HARSHUU Backend
 * JWT Configuration & Helpers
 * Production-grade (Zomato / Swiggy style)
 */

const jwt = require("jsonwebtoken");

/**
 * ENV VALIDATION (CRITICAL)
 */
if (!process.env.JWT_ACCESS_SECRET) {
  console.error("❌ JWT_ACCESS_SECRET missing in environment variables");
  process.exit(1);
}

if (!process.env.JWT_REFRESH_SECRET) {
  console.error("❌ JWT_REFRESH_SECRET missing in environment variables");
  process.exit(1);
}

/**
 * TOKEN EXPIRY (REAL-WORLD DEFAULTS)
 */
const ACCESS_TOKEN_EXPIRES_IN = "15m";   // short-lived
const REFRESH_TOKEN_EXPIRES_IN = "30d";  // long-lived

/**
 * SIGN ACCESS TOKEN
 */
const signAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    issuer: "harshuu",
    audience: "harshuu-users",
  });
};

/**
 * SIGN REFRESH TOKEN
 */
const signRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    issuer: "harshuu",
    audience: "harshuu-users",
  });
};

/**
 * VERIFY ACCESS TOKEN
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
    issuer: "harshuu",
    audience: "harshuu-users",
  });
};

/**
 * VERIFY REFRESH TOKEN
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
    issuer: "harshuu",
    audience: "harshuu-users",
  });
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
};
