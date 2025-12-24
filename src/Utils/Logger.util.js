/**
 * HARSHUU Backend
 * Centralized Logger Utility
 *
 * Features:
 * - Structured logs
 * - Environment based logging
 * - Safe for production
 * - Works on Render / Railway / AWS
 */

const os = require("os");

const ENV = process.env.NODE_ENV || "development";

/**
 * ===============================
 * BASE LOG FORMATTER
 * ===============================
 */
function formatLog(level, message, meta = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: "HARSHUU-BACKEND",
    env: ENV,
    host: os.hostname(),
    message,
    ...meta,
  });
}

/**
 * ===============================
 * INFO LOG
 * ===============================
 */
exports.info = (message, meta = {}) => {
  console.log(formatLog("INFO", message, meta));
};

/**
 * ===============================
 * WARN LOG
 * ===============================
 */
exports.warn = (message, meta = {}) => {
  console.warn(formatLog("WARN", message, meta));
};

/**
 * ===============================
 * ERROR LOG
 * ===============================
 */
exports.error = (message, error = null, meta = {}) => {
  console.error(
    formatLog("ERROR", message, {
      ...meta,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack:
              ENV === "production"
                ? undefined
                : error.stack,
          }
        : undefined,
    })
  );
};

/**
 * ===============================
 * REQUEST LOGGER
 * ===============================
 * (For API analytics & debugging)
 */
exports.requestLog = (req) => {
  exports.info("Incoming request", {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    userId: req.user?.id,
  });
};
