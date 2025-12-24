/**
 * HARSHUU Backend
 * Payment Model
 * Production-grade (Zomato / Swiggy style)
 */

const mongoose = require("mongoose");
const {
  PAYMENT_STATUS,
  PAYMENT_METHOD,
} = require("../config/constants");

const paymentSchema = new mongoose.Schema(
  {
    /**
     * RELATIONS
     */
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    /**
     * PAYMENT DETAILS
     */
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },

    /**
     * AMOUNTS (SNAPSHOT)
     */
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    /**
     * RAZORPAY FIELDS (ONLINE PAYMENTS)
     */
    razorpayOrderId: {
      type: String,
      index: true,
    },

    razorpayPaymentId: {
      type: String,
      index: true,
    },

    razorpaySignature: {
      type: String,
    },

    /**
     * REFUND INFO
     */
    refundAmount: {
      type: Number,
      default: 0,
    },

    refundReason: {
      type: String,
    },

    refundedAt: {
      type: Date,
    },

    /**
     * META / AUDIT
     */
    initiatedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
    },

    isTestPayment: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * ============================
 * INDEXES (CRITICAL FOR SCALE)
 * ============================
 */
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ razorpayPaymentId: 1 });

/**
 * ============================
 * STATUS HELPERS
 * ============================
 */
paymentSchema.methods.markSuccess = function () {
  this.status = PAYMENT_STATUS.SUCCESS;
  this.completedAt = new Date();
};

paymentSchema.methods.markFailed = function () {
  this.status = PAYMENT_STATUS.FAILED;
  this.completedAt = new Date();
};

paymentSchema.methods.markRefunded = function (amount, reason) {
  this.status = PAYMENT_STATUS.REFUNDED;
  this.refundAmount = amount;
  this.refundReason = reason;
  this.refundedAt = new Date();
};

/**
 * ============================
 * SAFE JSON RESPONSE
 * ============================
 */
paymentSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    orderId: this.orderId,
    method: this.method,
    status: this.status,
    amount: this.amount,
    currency: this.currency,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("Payment", paymentSchema);
