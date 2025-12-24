/**
 * HARSHUU Backend – Production Entry File
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./src/config/db");
const rateLimiter = require("./src/middlewares/rateLimit.middleware");

const app = express();

/**
 * App Config
 */
app.set("trust proxy", 1);

/**
 * Database Connection
 */
connectDB();

/**
 * Global Middlewares
 */
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

/**
 * Health Check
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "HARSHUU Backend",
    uptime: process.uptime(),
    time: new Date().toISOString(),
  });
});

/**
 * Base Route
 */
app.get("/", (req, res) => {
  res.send("HARSHUU backend is running 🚀");
});

/**
 * API Routes
 */
app.use("/api/auth", rateLimiter, require("./src/routes/auth.routes"));
app.use("/api/user", require("./src/routes/user.routes"));
app.use("/api/restaurant", require("./src/routes/restaurant.routes"));
app.use("/api/menu", require("./src/routes/menu.routes"));
app.use("/api/order", require("./src/routes/order.routes"));
app.use("/api/delivery", require("./src/routes/delivery.routes"));
app.use("/api/payment", require("./src/routes/payment.routes"));
app.use("/api/admin", require("./src/routes/admin.routes"));

/**
 * 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
  console.error("ERROR:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

/**
 * Server Start
 */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 HARSHUU backend running on port ${PORT}`);
});
