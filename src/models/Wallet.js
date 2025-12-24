/**
 * HARSHUU Backend
 * Wallet Model
 * Production-grade (Zomato / Swiggy style)
 */

const mongoose = require("mongoose");
const { WALLET_TXN_TYPE } = require("../config/constants");

const walletTransactionSchema = new mongoose.Schema(
  {
    /**
     * TRANSACTION INFO
     */
    type: {
      type: String,
      enum: Object.values(WALLET_TXN_TYPE),
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    /**
     * CONTEXT (TRACEABILITY)
     */
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      index: true,
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

const walletSchema = new mongoose.Schema(
  {
    /**
     * OWNER (USER / DELIVERY / RESTAURANT PAYOUT)
     */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    /**
     * CURRENT BALANCE
     */
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    /**
     * LEDGER (SOURCE OF TRUTH)
     */
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
 * INDEXES
 * ============================
 */
walletSchema.index({ userId: 1 });
walletSchema.index({ "transactions.type": 1 });
walletSchema.index({ "transactions.orderId": 1 });

/**
 * ============================
 * WALLET OPERATIONS (ATOMIC)
 * ============================
 */

/**
 * Credit wallet (refund, incentive, payout)
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

/**
 * Debit wallet (wallet payment)
 */
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
 * SAFE JSON RESPONSE
 * ============================
 */
walletSchema.methods.toSafeObject = function () {
  return {
    balance: this.balance,
    lastUpdated: this.updatedAt,
  };
};

module.exports = mongoose.model("Wallet", walletSchema);
