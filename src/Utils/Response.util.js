/**
 * HARSHUU Backend
 * Standard API Response Utility
 *
 * Purpose:
 * - Consistent API responses
 * - Frontend-friendly structure
 * - Centralized success & error handling
 * - Production safe
 */

const buildResponse = ({
  success,
  message,
  data = null,
  errorCode = null,
  meta = null,
}) => {
  return {
    success,
    message,
    data,
    errorCode,
    meta,
    timestamp: new Date().toISOString(),
  };
};

/**
 * ===============================
 * SUCCESS RESPONSE
 * ===============================
 */
exports.success = (res, {
  statusCode = 200,
  message = "Success",
  data = null,
  meta = null,
}) => {
  return res.status(statusCode).json(
    buildResponse({
      success: true,
      message,
      data,
      meta,
    })
  );
};

/**
 * ===============================
 * CREATED RESPONSE
 * ===============================
 */
exports.created = (res, {
  message = "Resource created successfully",
  data = null,
}) => {
  return res.status(201).json(
    buildResponse({
      success: true,
      message,
      data,
    })
  );
};

/**
 * ===============================
 * ERROR RESPONSE
 * ===============================
 */
exports.error = (res, {
  statusCode = 500,
  message = "Internal Server Error",
  errorCode = "INTERNAL_ERROR",
}) => {
  return res.status(statusCode).json(
    buildResponse({
      success: false,
      message,
      errorCode,
    })
  );
};

/**
 * ===============================
 * VALIDATION ERROR
 * ===============================
 */
exports.validationError = (res, {
  message = "Validation failed",
  errors = [],
}) => {
  return res.status(400).json(
    buildResponse({
      success: false,
      message,
      errorCode: "VALIDATION_ERROR",
      meta: { errors },
    })
  );
};

/**
 * ===============================
 * UNAUTHORIZED
 * ===============================
 */
exports.unauthorized = (res, {
  message = "Unauthorized access",
}) => {
  return res.status(401).json(
    buildResponse({
      success: false,
      message,
      errorCode: "UNAUTHORIZED",
    })
  );
};

/**
 * ===============================
 * FORBIDDEN
 * ===============================
 */
exports.forbidden = (res, {
  message = "Forbidden",
}) => {
  return res.status(403).json(
    buildResponse({
      success: false,
      message,
      errorCode: "FORBIDDEN",
    })
  );
};

/**
 * ===============================
 * NOT FOUND
 * ===============================
 */
exports.notFound = (res, {
  message = "Resource not found",
}) => {
  return res.status(404).json(
    buildResponse({
      success: false,
      message,
      errorCode: "NOT_FOUND",
    })
  );
};
