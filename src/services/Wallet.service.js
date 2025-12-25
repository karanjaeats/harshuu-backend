/**
 * HARSHUU Backend
 * Wallet Service (Production Grade)
 */

const Wallet = require("../models/wallet");

/**
 * ===============================
 * GET OR CREATE WALLET
 * ===============================
 */
exports.getOrCreateWallet = async (userId, role) => {
  let wallet = await Wallet.findOne({ userId, role });

  if (!wallet) {
    wallet = await Wallet.create({
      userId,
      role,
      balance: 0,
      transactions: [],
    });
  }

  return wallet;
};

/**
 * ===============================
 * CREDIT WALLET
 * ===============================
 * Used for:
 * - Refunds
 * - Incentives
 * - Admin credits
 */
exports.creditWallet = async ({
  userId,
  role,
  amount,
  reference,
  reason,
}) => {
  if (amount <= 0) {
    throw new Error("Invalid credit amount");
  }

  const wallet = await exports.getOrCreateWallet(userId, role);

  wallet.balance += amount;
  wallet.transactions.push({
    type: "CREDIT",
    amount,
    reference,
    reason,
    createdAt: new Date(),
  });

  await wallet.save();

  return wallet;
};

/**
 * ===============================
 * DEBIT WALLET
 * ===============================
 * Used for:
 * - Wallet payment
 * - Penalty
 * - Settlement deduction
 */
exports.debitWallet = async ({
  userId,
  role,
  amount,
  reference,
  reason,
}) => {
  if (amount <= 0) {
    throw new Error("Invalid debit amount");
  }

  const wallet = await exports.getOrCreateWallet(userId, role);

  if (wallet.balance < amount) {
    throw new Error("Insufficient wallet balance");
  }

  wallet.balance -= amount;
  wallet.transactions.push({
    type: "DEBIT",
    amount,
    reference,
    reason,
    createdAt: new Date(),
  });

  await wallet.save();

  return wallet;
};

/**
 * ===============================
 * WALLET PAYMENT
 * ===============================
 * Used when user pays order via wallet
 */
exports.payUsingWallet = async ({
  userId,
  amount,
  orderId,
}) => {
  return exports.debitWallet({
    userId,
    role: "USER",
    amount,
    reference: orderId,
    reason: "Order payment via wallet",
  });
};

/**
 * ===============================
 * DELIVERY PARTNER EARNINGS
 * ===============================
 */
exports.creditDeliveryEarnings = async ({
  deliveryPartnerId,
  amount,
  orderId,
}) => {
  return exports.creditWallet({
    userId: deliveryPartnerId,
    role: "DELIVERY",
    amount,
    reference: orderId,
    reason: "Delivery earnings",
  });
};

/**
 * ===============================
 * RESTAURANT SETTLEMENT
 * ===============================
 */
exports.creditRestaurantSettlement = async ({
  restaurantId,
  amount,
  orderId,
}) => {
  return exports.creditWallet({
    userId: restaurantId,
    role: "RESTAURANT",
    amount,
    reference: orderId,
    reason: "Restaurant settlement",
  });
};

/**
 * ===============================
 * ADMIN ADJUSTMENT
 * ===============================
 */
exports.adminAdjustWallet = async ({
  userId,
  role,
  amount,
  type, // CREDIT or DEBIT
  reason,
}) => {
  if (type === "CREDIT") {
    return exports.creditWallet({
      userId,
      role,
      amount,
      reference: "ADMIN_ADJUSTMENT",
      reason,
    });
  }

  if (type === "DEBIT") {
    return exports.debitWallet({
      userId,
      role,
      amount,
      reference: "ADMIN_ADJUSTMENT",
      reason,
    });
  }

  throw new Error("Invalid wallet adjustment type");
};
