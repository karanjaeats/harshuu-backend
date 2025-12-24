/**
 * HARSHUU Backend
 * Review Model
 * Zomato / Swiggy style
 */

const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    // Who wrote the review
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Which restaurant
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    // Which order (important for fraud prevention)
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true, // one review per order
    },

    // Rating 1–5
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Optional text review
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // Optional food vs delivery breakdown
    foodRating: {
      type: Number,
      min: 1,
      max: 5,
    },

    deliveryRating: {
      type: Number,
      min: 1,
      max: 5,
    },

    // Moderation
    isHidden: {
      type: Boolean,
      default: false,
    },

    hiddenReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * ============================
 * INDEXES (Performance)
 * ============================
 */
reviewSchema.index({ restaurantId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, restaurantId: 1 });

/**
 * ============================
 * STATIC: CALCULATE AVG RATING
 * ============================
 */
reviewSchema.statics.calculateRestaurantRating = async function (
  restaurantId
) {
  const stats = await this.aggregate([
    {
      $match: {
        restaurantId: new mongoose.Types.ObjectId(restaurantId),
        isHidden: false,
      },
    },
    {
      $group: {
        _id: "$restaurantId",
        avgRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  return stats[0] || { avgRating: 0, totalReviews: 0 };
};

/**
 * ============================
 * SAFE RESPONSE
 * ============================
 */
reviewSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    rating: this.rating,
    comment: this.comment,
    foodRating: this.foodRating,
    deliveryRating: this.deliveryRating,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("Review", reviewSchema);
