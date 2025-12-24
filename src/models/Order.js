/**
 * HARSHUU Backend
 * Order Model
 * Production-grade (Zomato / Swiggy style)
 */

const mongoose = require("mongoose");
const {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
} = require("../config/constants");

const orderSchema = new mongoose.Schema(
  {
    /**
     * RELATIONS
     */
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

    deliveryPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // role = DELIVERY
      index: true,
    },

    /**
     * ORDER ITEMS (PRICE SNAPSHOT)
     * ⚠️ Never change after order placed
     */
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true,
        },

        name: String,

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        price: {
          type: Number,
          required: true,
          min: 0,
        },

        addons: [
          {
            name: String,
            price: Number,
          },
        ],

        totalPrice: {
          type: Number,
          required: true,
        },
      },
    ],

    /**
     * PRICING BREAKUP (BACKEND CALCULATED ONLY)
     */
    pricing: {
      itemTotal: {
        type: Number,
        required: true,
      },

      deliveryFee: {
        type: Number,
        required: true,
      },

      surgeFee: {
        type: Number,
        default: 0,
      },

      tax: {
        type: Number,
        default: 0,
      },

      discount: {
        type: Number,
        default: 0,
      },

      grandTotal: {
        type: Number,
        required: true,
      },
    },

    /**
     * PAYMENT INFO
     */
    payment: {
      method: {
        type: String,
        enum: Object.values(PAYMENT_METHOD),
        required: true,
      },

      status: {
        type: String,
        enum: Object.values(PAYMENT_STATUS),
        default: PAYMENT_STATUS.PENDING,
        index: true,
      },

      razorpayOrderId: String,
      razorpayPaymentId: String,
    },

    /**
     * ORDER STATUS FLOW
     */
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.CREATED,
      index: true,
    },

    statusHistory: [
      {
        status: String,
        at: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    /**
     * DELIVERY DETAILS
     */
    deliveryAddress: {
      address: String,
      lat: Number,
      lng: Number,
    },

    distanceKm: {
      type: Number,
    },

    estimatedDeliveryTimeMin: {
      type: Number,
    },

    /**
     * CANCELLATION & REFUND
     */
    cancelledBy: {
      type: String, // USER | RESTAURANT | ADMIN
    },

    cancelReason: {
      type: String,
    },

    refundAmount: {
      type: Number,
      default: 0,
    },

    /**
     * FLAGS
     */
    isTestOrder: {
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
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, createdAt: -1 });
orderSchema.index({ deliveryPartnerId: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

/**
 * ============================
 * STATUS HELPERS
 * ============================
 */

/**
 * Update order status safely
 */
orderSchema.methods.updateStatus = function (newStatus) {
  this.status = newStatus;
  this.statusHistory.push({ status: newStatus });
};

/**
 * ============================
 * SAFE JSON RESPONSE
 * ============================
 */
orderSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    status: this.status,
    items: this.items,
    pricing: this.pricing,
    payment: {
      method: this.payment.method,
      status: this.payment.status,
    },
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("Order", orderSchema);
