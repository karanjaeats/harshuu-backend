/**
 * HARSHUU Backend
 * Delivery Partner Model
 * Production-grade (Zomato / Swiggy style)
 */

const mongoose = require("mongoose");
const { DELIVERY_STATUS } = require("../config/constants");

const deliveryPartnerSchema = new mongoose.Schema(
  {
    /**
     * LINK TO USER (RBAC)
     */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    /**
     * BASIC DETAILS
     */
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    mobile: {
      type: String,
      required: true,
      index: true,
    },

    /**
     * VEHICLE INFO
     */
    vehicleType: {
      type: String,
      enum: ["BIKE", "SCOOTER", "BICYCLE"],
      default: "BIKE",
    },

    vehicleNumber: {
      type: String,
      trim: true,
    },

    /**
     * STATUS & AVAILABILITY
     */
    status: {
      type: String,
      enum: Object.values(DELIVERY_STATUS),
      default: DELIVERY_STATUS.OFFLINE,
      index: true,
    },

    isApproved: {
      type: Boolean,
      default: false, // admin approval required
      index: true,
    },

    /**
     * LIVE LOCATION (FOR AUTO ASSIGNMENT)
     */
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
      },
      updatedAt: {
        type: Date,
      },
    },

    /**
     * EARNINGS & PAYOUT
     */
    earnings: {
      today: {
        type: Number,
        default: 0,
      },
      week: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        default: 0,
      },
    },

    lastPayoutAt: {
      type: Date,
    },

    /**
     * PERFORMANCE METRICS
     */
    totalDeliveries: {
      type: Number,
      default: 0,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    ratingCount: {
      type: Number,
      default: 0,
    },

    /**
     * ADMIN FLAGS
     */
    isSuspended: {
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

// Geo index for nearest delivery partner search
deliveryPartnerSchema.index({ location: "2dsphere" });

// Availability lookup
deliveryPartnerSchema.index({ status: 1, isApproved: 1 });

/**
 * ============================
 * SAFE JSON RESPONSE
 * ============================
 */
deliveryPartnerSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    status: this.status,
    rating: this.rating,
    totalDeliveries: this.totalDeliveries,
    vehicleType: this.vehicleType,
  };
};

module.exports = mongoose.model(
  "DeliveryPartner",
  deliveryPartnerSchema
);
