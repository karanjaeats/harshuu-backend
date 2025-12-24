/**
 * HARSHUU Backend
 * Global Error Handling Middleware (Production Grade)
 */

module.exports = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // ===============================
  // MONGOOSE BAD OBJECT ID
  // ===============================
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // ===============================
  // MONGOOSE DUPLICATE KEY
  // ===============================
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }

  // ===============================
  // MONGOOSE VALIDATION ERROR
  // ===============================
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // ===============================
  // JWT ERRORS
  // ===============================
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token expired";
  }

  // ===============================
  // LOG ERROR (SERVER SIDE)
  // ===============================
  console.error("🔥 ERROR:", {
    path: req.originalUrl,
    method: req.method,
    message: err.message,
    stack: err.stack,
  });

  // ===============================
  // RESPONSE (CLIENT SAFE)
  // ===============================
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
};
