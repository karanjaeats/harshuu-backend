/**
 * HARSHUU Backend – Production Entry File
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./src/config/db");

const app = express();

/* =================================================
   BASIC CONFIG
================================================= */
app.set("trust proxy", 1);

/* =================================================
   DATABASE
================================================= */
connectDB();

/* =================================================
   GLOBAL MIDDLEWARES
================================================= */
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

/* =================================================
   HEALTH CHECK
================================================= */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "HARSHUU Backend",
    uptime: process.uptime(),
    time: new Date().toISOString(),
  });
});

/* =================================================
   BASE ROUTE
================================================= */
app.get("/", (req, res) => {
  res.send("🚀 HARSHUU backend is running");
});

/* =================================================
   API ROUTES (ALL ROUTES HERE)
================================================= */
app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/user", require("./src/routes/user.routes"));
app.use("/api/restaurant", require("./src/routes/restaurant.routes"));
app.use("/api/menu", require("./src/routes/menu.routes"));
app.use("/api/order", require("./src/routes/order.routes"));
app.use("/api/delivery", require("./src/routes/delivery.routes"));
app.use("/api/payment", require("./src/routes/payment.routes"));
app.use("/api/admin", require("./src/routes/admin.routes"));

/* =================================================
   404 HANDLER
================================================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

/* =================================================
   GLOBAL ERROR HANDLER (ONLY ONCE)
================================================= */
app.use((err, req, res, next) => {
  console.error("❌ ERROR:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

/* =================================================
   SERVER START (ONLY ONCE)
================================================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 HARSHUU backend running on port ${PORT}`);
});
