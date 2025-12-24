/**
 * HARSHUU Backend
 * Role-Based Access Control Middleware (Production Grade)
 */

module.exports = function roleMiddleware(...allowedRoles) {
  return function (req, res, next) {
    try {
      // auth.middleware must run before this
      if (!req.user || !req.user.role) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access",
        });
      }

      const userRole = req.user.role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Access denied for this role",
        });
      }

      next();
    } catch (error) {
      console.error("ROLE MIDDLEWARE ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Role validation failed",
      });
    }
  };
};
