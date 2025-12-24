/**
 * HARSHUU Backend
 * Admin Settings Model
 * Production-grade (Zomato / Swiggy style)
 */

const mongoose = require("mongoose");
const { DEFAULT_ADMIN_SETTINGS } = require("../config/constants");

const adminSettingsSchema = new mongoose.Schema(
  {
    /**
     * COMMISSION & PRICING
     */
    commissionPercent: {
      type: Number,
      default: DEFAULT_ADMIN_SETTINGS.COMMISSION_PERCENT,
      min: 0,
      max: 50,
    },

    minOrderValue: {
      type: Number,
      default: DEFAULT_ADMIN_SETTINGS.MIN_ORDER_VALUE,
      min: 0,
    },

    baseDeliveryFee: {
      type: Number,
      default: DEFAULT_ADMIN_SETTINGS.BASE_DELIVERY_FEE,
      min: 0,
    },

    perKmRate: {
      type: Number,
      default: DEFAULT_ADMIN_SETTINGS.PER_KM_RATE,
      min: 0,
    },

    surgeMultiplier: {
      type: Number,
      default: DEFAULT_ADMIN_SETTINGS.SURGE_MULTIPLIER,
      min: 1,
      max: 5,
    },

    maxDeliveryRadiusKm: {
      type: Number,
      default: DEFAULT_ADMIN_SETTINGS.MAX_DELIVERY_RADIUS_KM,
      min: 1,
      max: 20,
    },

    /**
     * CANCELLATION RULES
     */
    userCancelWindowMin: {
      type: Number,
      default: 5, // minutes after order placement
      min: 0,
    },

    restaurantCancelPenalty: {
      type: Number,
      default: 50, // flat penalty
      min: 0,
    },

    /**
     * DELIVERY PARTNER CONFIG
     */
    deliveryIncentivePerOrder: {
      type: Number,
      default: 10,
      min: 0,
    },

    /**
     * FEATURE FLAGS
     */
    enableCOD: {
      type: Boolean,
      default: true,
    },

    enableWallet: {
      type: Boolean,
      default: true,
    },

    enableSurgePricing: {
      type: Boolean,
      default: true,
    },

    /**
     * METADATA
     */
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // ADMIN
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * ============================
 * SINGLETON ENFORCEMENT
 * ============================
 * Only ONE settings document should exist
 */
adminSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model("AdminSettings", adminSettingsSchema);
