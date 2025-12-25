/**
 * HARSHUU Backend
 * MongoDB Connection Layer
 * Production-grade (Zomato / Swiggy style)
 */

const mongoose = require("mongoose");
const User = require("../models/user");

const createDefaultAdmin = async () => {
  try {
    const adminMobile = process.env.ADMIN_MOBILE;

    if (!adminMobile) {
      console.warn("⚠️ ADMIN_MOBILE not set, skipping admin auto-create");
      return;
    }

    const existingAdmin = await User.findOne({
      mobile: adminMobile,
      role: "ADMIN",
    });

    if (!existingAdmin) {
      await User.create({
        mobile: adminMobile,
        role: "ADMIN",
        isActive: true,
      });

      console.log(`✅ Default ADMIN created: ${adminMobile}`);
    } else {
      console.log(`ℹ️ ADMIN already exists: ${adminMobile}`);
    }
  } catch (err) {
    console.error("❌ Admin auto-create failed:", err.message);
  }
};

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI missing in environment variables");
      process.exit(1);
    }

    // MongoDB connection
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "harshuu",
      autoIndex: false,        // production best practice
      maxPoolSize: 10,         // connection pooling
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(
      `✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`
    );

    // 🔐 AUTO CREATE ADMIN (ONLY ON SUCCESSFUL DB CONNECT)
    await createDefaultAdmin();

    /**
     * Connection listeners (REAL-WORLD SAFETY)
     */
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB runtime error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected. Reconnecting...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔁 MongoDB reconnected");
    });

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1); // crash app (important in production)
  }
};

module.exports = connectDB;
