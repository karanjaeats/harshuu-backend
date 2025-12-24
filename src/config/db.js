/**
 * HARSHUU Backend
 * MongoDB Connection Layer
 * Production-grade (Zomato / Swiggy style)
 */

const mongoose = require("mongoose");

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
