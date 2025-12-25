/**
 * HARSHUU Backend
 * Wallet Model
 * Production-grade (Zomato / Swiggy style)
 */

const mongoose = require("mongoose");
const { WALLET_TXN_TYPE } = require("../config/constants");

/**
 * ============================
 * WALLET TRANSACTION SCHEMA
 * ============================
 */
const walletTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(WALLET_TXN_TYPE),
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },

    description: {
      type: String,
      maxlength: 200,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/**
 * ============================
 * WALLET MAIN SCHEMA
 * ============================
 */
const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    transactions: {
      type: [walletTransactionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * ============================
 * INDEXES (ONLY HERE)
 * ============================
 */
walletSchema.index({ userId: 1 });
walletSchema.index({ "transactions.type": 1 });
walletSchema.index({ "transactions.orderId": 1 });

/**
 * ============================
 * WALLET OPERATIONS
 * ============================
 */
walletSchema.methods.credit = function ({
  amount,
  type,
  orderId,
  paymentId,
  description,
}) {
  this.balance += amount;
  this.transactions.push({
    type,
    amount,
    orderId,
    paymentId,
    description,
  });
};

walletSchema.methods.debit = function ({
  amount,
  type,
  orderId,
  description,
}) {
  if (this.balance < amount) {
    throw new Error("INSUFFICIENT_WALLET_BALANCE");
  }

  this.balance -= amount;
  this.transactions.push({
    type,
    amount,
    orderId,
    description,
  });
};

/**
 * ============================
 * SAFE RESPONSE
 * ============================
 */
walletSchema.methods.toSafeObject = function () {
  return {
    balance: this.balance,
    lastUpdated: this.updatedAt,
  };
};

module.exports = mongoose.model("Wallet", walletSchema);
