/**
 * HARSHUU Backend
 * Environment Configuration Loader
 * Production-grade (Fail-fast strategy)
 */

const requiredEnv = [
  "NODE_ENV",
  "PORT",

  // Database
  "MONGODB_URI",

  // JWT
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "JWT_ACCESS_EXPIRES_IN",
  "JWT_REFRESH_EXPIRES_IN",

  // Razorpay
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
];

function loadEnv() {
  const missing = requiredEnv.filter(
    (key) => !process.env[key] || process.env[key].trim() === ""
  );

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error("🚨 Server startup aborted");
    process.exit(1);
  }

  return {
    nodeEnv: process.env.NODE_ENV,
    port: Number(process.env.PORT),

    mongoUri: process.env.MONGODB_URI,

    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET,
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    },

    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID,
      keySecret: process.env.RAZORPAY_KEY_SECRET,
    },
  };
}

module.exports = loadEnv();
