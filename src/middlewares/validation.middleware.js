/**
 * Validation Middleware
 * Centralized request validation using express-validator
 *
 * Usage:
 * router.post(
 *   "/route",
 *   validate([
 *     body("field").notEmpty(),
 *     body("phone").isMobilePhone("en-IN")
 *   ]),
 *   controller
 * )
 */

const { validationResult } = require("express-validator");

/**
 * validate()
 * @param {Array} validations - express-validator rules
 */
const validate = (validations = []) => {
  return async (req, res, next) => {
    try {
      // Run all validations
      for (const validation of validations) {
        const result = await validation.run(req);
        if (!result.isEmpty()) break;
      }

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(422).json({
          success: false,
          message: "Validation failed",
          errors: errors.array().map(err => ({
            field: err.param,
            message: err.msg
          }))
        });
      }

      next();
    } catch (error) {
      console.error("Validation Middleware Error:", error);
      return res.status(500).json({
        success: false,
        message: "Validation processing error"
      });
    }
  };
};

module.exports = validate;
