/**
 * HARSHUU Backend
 * Core Express App Configuration
 *
 * This file ONLY configures the app.
 * Server start (listen) MUST be handled in index.js
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const rateLimiter = require("./middlewares/ratelimit.middleware");
const errorHandler = require("./middlewares/error.middleware");

/**
 * Create Express App
 */
const app = express();

/**
 * Trust proxy (IMPORTANT for Render / Railway / AWS / Nginx)
 */
app.set("trust proxy", 1);

/**
 * ======================
 * GLOBAL MIDDLEWARES
 * ======================
 */
app.use(cors({
  origin: "*", // later restrict via ENV
  credentials: true
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

/**
 * ======================
 * RATE LIMITING
 * ======================
 */
app.use("/api", rateLimiter);

/**
 * ======================
 * HEALTH CHECK
 * ======================
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "HARSHUU Backend",
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * ======================
 * BASE ROUTE
 * ======================
 */
app.get("/", (req, res) => {
  res.send("🚀 HARSHUU backend is running");
});

/**
 * ======================
 * API ROUTES
 * ======================
 */
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/user", require("./routes/user.routes"));
app.use("/api/restaurant", require("./routes/restaurant.routes"));
app.use("/api/menu", require("./routes/menu.routes"));
app.use("/api/order", require("./routes/order.routes"));
app.use("/api/delivery", require("./routes/delivery.routes"));
app.use("/api/payment", require("./routes/payment.routes"));
app.use("/api/admin", require("./routes/admin.routes"));

/**
 * ======================
 * 404 HANDLER
 * ======================
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

/**
 * ======================
 * GLOBAL ERROR HANDLER
 * ======================
 */
app.use(errorHandler);

module.exports = app;
