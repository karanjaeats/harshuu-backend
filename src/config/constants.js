/**
 * HARSHUU Backend
 * Global Constants
 * Production-grade (Zomato / Swiggy style)
 */

/**
 * USER ROLES (RBAC CORE)
 */
const ROLES = Object.freeze({
  USER: "USER",
  RESTAURANT: "RESTAURANT",
  DELIVERY: "DELIVERY",
  ADMIN: "ADMIN",
});

/**
 * ORDER STATUS FLOW
 * (STRICT – NEVER CHANGE ORDER WITHOUT MIGRATION)
 */
const ORDER_STATUS = Object.freeze({
  CREATED: "CREATED",           // Order placed, not paid yet
  PAID: "PAID",                 // Payment successful
  ACCEPTED: "ACCEPTED",         // Restaurant accepted
  PREPARING: "PREPARING",       // Food being prepared
  READY: "READY",               // Ready for pickup
  PICKED: "PICKED",             // Picked by delivery partner
  DELIVERED: "DELIVERED",       // Delivered to customer
  COMPLETED: "COMPLETED",       // Order closed successfully
  CANCELLED: "CANCELLED",       // Cancelled (user / restaurant / admin)
  REFUNDED: "REFUNDED",         // Refund completed
});

/**
 * PAYMENT STATUS
 */
const PAYMENT_STATUS = Object.freeze({
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
});

/**
 * PAYMENT METHODS
 */
const PAYMENT_METHOD = Object.freeze({
  ONLINE: "ONLINE",   // Razorpay
  COD: "COD",         // Cash on Delivery
  WALLET: "WALLET",   // HARSHUU Wallet
});

/**
 * DELIVERY PARTNER STATUS
 */
const DELIVERY_STATUS = Object.freeze({
  OFFLINE: "OFFLINE",
  ONLINE: "ONLINE",
  BUSY: "BUSY",
});

/**
 * RESTAURANT STATUS
 */
const RESTAURANT_STATUS = Object.freeze({
  PENDING: "PENDING",     // Waiting for admin approval
  ACTIVE: "ACTIVE",       // Approved & live
  SUSPENDED: "SUSPENDED", // Blocked by admin
});

/**
 * WALLET TRANSACTION TYPES
 */
const WALLET_TXN_TYPE = Object.freeze({
  CREDIT: "CREDIT",
  DEBIT: "DEBIT",
  REFUND: "REFUND",
  PAYOUT: "PAYOUT",
});

/**
 * ADMIN DEFAULT SETTINGS
 */
const DEFAULT_ADMIN_SETTINGS = Object.freeze({
  COMMISSION_PERCENT: 20,      // Platform commission
  MIN_ORDER_VALUE: 99,         // Minimum order amount
  BASE_DELIVERY_FEE: 30,       // Base delivery charge
  PER_KM_RATE: 8,              // Price per km
  SURGE_MULTIPLIER: 1.0,       // Dynamic surge factor
  MAX_DELIVERY_RADIUS_KM: 7,   // Restaurant radius
});

/**
 * FRAUD & SAFETY LIMITS
 */
const FRAUD_LIMITS = Object.freeze({
  MAX_CANCEL_PER_DAY: 3,
  MAX_FAILED_PAYMENTS: 5,
});

/**
 * OTP SETTINGS
 */
const OTP_CONFIG = Object.freeze({
  LENGTH: 6,
  EXPIRY_MINUTES: 5,
});

/**
 * EXPORTS
 */
module.exports = {
  ROLES,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  DELIVERY_STATUS,
  RESTAURANT_STATUS,
  WALLET_TXN_TYPE,
  DEFAULT_ADMIN_SETTINGS,
  FRAUD_LIMITS,
  OTP_CONFIG,
};
