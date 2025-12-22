const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const app = express();

/**
 * App Config
 */
app.set("trust proxy", 1);

/**
 * Middlewares
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
    time: new Date().toISOString()
  });
});

/**
 * Base Route
 */
app.get("/", (req, res) => {
  res.send("HARSHUU backend is running 🚀");
});

/**
 * 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found"
  });
});

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
});

/**
 * Server Start
 */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`HARSHUU backend running on port ${PORT}`);
});
