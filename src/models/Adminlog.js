/**
 * HARSHUU Backend
 * Admin Action Log Model
 * Production-grade (Zomato / Swiggy style)
 *
 * Purpose:
 * - Audit trail for every admin action
 * - Compliance, fraud investigation, rollback support
 * - Immutable logs (never update, only insert)
 */

const mongoose = require("mongoose");

const adminLogSchema = new mongoose.Schema(
  {
    /**
     * WHO PERFORMED ACTION
     */
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    adminRole: {
      type: String, // ADMIN / SUPER_ADMIN (future-proof)
      default: "ADMIN",
    },

    /**
     * WHAT ACTION
     */
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
      // e.g. APPROVE_RESTAURANT, SUSPEND_DELIVERY, REFUND_ORDER
    },

    /**
     * ON WHICH ENTITY
     */
    entityType: {
      type: String,
      required: true,
      trim: true,
      index: true,
      // e.g. USER, RESTAURANT, ORDER, DELIVERY_PARTNER, PAYMENT
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },

    /**
     * CHANGE SNAPSHOT (FOR AUDIT)
     */
    previousData: {
      type: mongoose.Schema.Types.Mixed,
    },

    newData: {
      type: mongoose.Schema.Types.Mixed,
    },

    /**
     * CONTEXT
     */
    reason: {
      type: String,
      maxlength: 300,
    },

    ipAddress: {
      type: String,
    },

    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * ============================
 * INDEXES (AUDIT & SEARCH)
 * ============================
 */
adminLogSchema.index({ createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });
adminLogSchema.index({ entityType: 1, entityId: 1 });

/**
 * ============================
 * STATIC HELPER (SAFE LOGGING)
 * ============================
 */
adminLogSchema.statics.logAction = async function ({
  adminId,
  adminRole,
  action,
  entityType,
  entityId,
  previousData,
  newData,
  reason,
  ipAddress,
  userAgent,
}) {
  return this.create({
    adminId,
    adminRole,
    action,
    entityType,
    entityId,
    previousData,
    newData,
    reason,
    ipAddress,
    userAgent,
  });
};

module.exports = mongoose.model("AdminLog", adminLogSchema);
