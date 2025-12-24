/**
 * HARSHUU Backend
 * Menu Category Model
 * Production-grade (Zomato / Swiggy style)
 */

const mongoose = require("mongoose");

const menuCategorySchema = new mongoose.Schema(
  {
    /**
     * RELATION
     */
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    /**
     * CATEGORY INFO
     */
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    description: {
      type: String,
      maxlength: 200,
    },

    /**
     * DISPLAY ORDER (UI SORTING)
     */
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },

    /**
     * VISIBILITY
     */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /**
     * ADMIN / SYSTEM FLAGS
     */
    isRecommended: {
      type: Boolean,
      default: false,
    },

    /**
     * METADATA
     */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * ============================
 * INDEXES (PERFORMANCE CRITICAL)
 * ============================
 */

// Prevent duplicate category names per restaurant
menuCategorySchema.index(
  { restaurantId: 1, name: 1 },
  { unique: true }
);

// Fast category listing
menuCategorySchema.index({ restaurantId: 1, isActive: 1, sortOrder: 1 });

/**
 * ============================
 * SAFE JSON RESPONSE
 * ============================
 */
menuCategorySchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    sortOrder: this.sortOrder,
    isActive: this.isActive,
    isRecommended: this.isRecommended,
  };
};

module.exports = mongoose.model("MenuCategory", menuCategorySchema);
