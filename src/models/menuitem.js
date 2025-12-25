/**
 * HARSHUU Backend
 * Menu Item Model
 * Production-grade (Zomato / Swiggy style)
 */

const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    /**
     * RELATIONS
     */
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuCategory",
      required: true,
      index: true,
    },

    /**
     * BASIC INFO
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
      maxlength: 300,
    },

    /**
     * PRICING
     */
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountedPrice: {
      type: Number,
      min: 0,
    },

    /**
     * FOOD TYPE
     */
    isVeg: {
      type: Boolean,
      default: true,
      index: true,
    },

    /**
     * AVAILABILITY
     */
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },

    availableFrom: {
      type: String, // "10:00"
    },

    availableTo: {
      type: String, // "23:00"
    },

    /**
     * ADDONS / EXTRAS
     */
    addons: [
      {
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    /**
     * IMAGES
     */
    image: {
      type: String,
    },

    /**
     * POPULARITY (DENORMALIZED)
     */
    orderCount: {
      type: Number,
      default: 0,
    },

    /**
     * ADMIN / SYSTEM FLAGS
     */
    isRecommended: {
      type: Boolean,
      default: false,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * ============================
 * INDEXES (CRITICAL)
 * ============================
 */

// Prevent duplicate item name per restaurant
menuItemSchema.index(
  { restaurantId: 1, name: 1 },
  { unique: true }
);

// Fast menu listing
menuItemSchema.index({
  restaurantId: 1,
  categoryId: 1,
  isAvailable: 1,
  isDeleted: 1,
});

// Text search
menuItemSchema.index({ name: "text", description: "text" });

/**
 * ============================
 * SAFE JSON RESPONSE
 * ============================
 */
menuItemSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    price: this.discountedPrice || this.price,
    isVeg: this.isVeg,
    isAvailable: this.isAvailable,
    image: this.image,
    addons: this.addons,
    isRecommended: this.isRecommended,
  };
};

module.exports = mongoose.model("MenuItem", menuItemSchema);
