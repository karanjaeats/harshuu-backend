/**
 * HARSHUU Backend
 * Restaurant Model
 * Production-grade (Zomato / Swiggy style)
 */

const mongoose = require("mongoose");
const { RESTAURANT_STATUS } = require("../config/constants");

const restaurantSchema = new mongoose.Schema(
  {
    /**
     * OWNERSHIP
     */
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /**
     * BASIC DETAILS
     */
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true,
    },

    description: {
      type: String,
      maxlength: 500,
    },

    phone: {
      type: String,
      required: true,
    },

    /**
     * ADDRESS & LOCATION
     */
    address: {
      fullAddress: String,
      city: {
        type: String,
        index: true,
      },
      area: String,
      pincode: String,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },

    /**
     * STATUS & VISIBILITY
     */
    status: {
      type: String,
      enum: Object.values(RESTAURANT_STATUS),
      default: RESTAURANT_STATUS.PENDING,
      index: true,
    },

    isOpen: {
      type: Boolean,
      default: false,
      index: true,
    },

    /**
     * DELIVERY CONFIG
     */
    deliveryRadiusKm: {
      type: Number,
      default: 5,
      min: 1,
      max: 15,
    },

    avgPreparationTimeMin: {
      type: Number,
      default: 30,
    },

    /**
     * COMMISSION & PAYOUT
     */
    commissionPercent: {
      type: Number,
      default: 20,
      min: 0,
      max: 40,
    },

    /**
     * RATINGS (DENORMALIZED FOR PERFORMANCE)
     */
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
     * IMAGES
     */
    images: [
      {
        type: String,
      },
    ],

    /**
     * ADMIN FLAGS
     */
    isFeatured: {
      type: Boolean,
      default: false,
    },

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

// Geo-spatial index (distance based delivery)
restaurantSchema.index({ location: "2dsphere" });

// Search & filters
restaurantSchema.index({ name: "text", "address.city": 1 });
restaurantSchema.index({ status: 1, isOpen: 1 });

/**
 * ============================
 * SAFE JSON RESPONSE
 * ============================
 */
restaurantSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    address: this.address,
    isOpen: this.isOpen,
    rating: this.rating,
    ratingCount: this.ratingCount,
    deliveryRadiusKm: this.deliveryRadiusKm,
    avgPreparationTimeMin: this.avgPreparationTimeMin,
    images: this.images,
  };
};

module.exports = mongoose.model("Restaurant", restaurantSchema);
