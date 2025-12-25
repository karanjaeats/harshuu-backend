/**
 * HARSHUU Backend
 * Admin Service (God Mode – Production Grade)
 */

const User = require("../models/user");
const Restaurant = require("../models/restaurant");
const DeliveryPartner = require("../models/deliverypartner");
const Order = require("../models/order");
const Payment = require("../models/payment");
const Wallet = require("../models/wallet");
const AdminSettings = require("../models/adminSettings");
const AdminLog = require("../models/adminlog");

/**
 * ===============================
 * ADMIN SETTINGS
 * ===============================
 */
exports.getAdminSettings = async () => {
  let settings = await AdminSettings.findOne();
  if (!settings) {
    settings = await AdminSettings.create({});
  }
  return settings;
};

exports.updateAdminSettings = async (data, adminId) => {
  const settings = await exports.getAdminSettings();

  Object.assign(settings, data);
  await settings.save();

  await AdminLog.create({
    adminId,
    action: "UPDATE_SETTINGS",
    meta: data,
  });

  return settings;
};

/**
 * ===============================
 * RESTAURANT APPROVAL
 * ===============================
 */
exports.approveRestaurant = async (restaurantId, adminId) => {
  const restaurant = await Restaurant.findByIdAndUpdate(
    restaurantId,
    { isApproved: true },
    { new: true }
  );

  if (!restaurant) throw new Error("Restaurant not found");

  await AdminLog.create({
    adminId,
    action: "APPROVE_RESTAURANT",
    targetId: restaurantId,
  });

  return restaurant;
};

exports.suspendRestaurant = async (restaurantId, reason, adminId) => {
  const restaurant = await Restaurant.findByIdAndUpdate(
    restaurantId,
    {
      isApproved: false,
      suspensionReason: reason,
    },
    { new: true }
  );

  if (!restaurant) throw new Error("Restaurant not found");

  await AdminLog.create({
    adminId,
    action: "SUSPEND_RESTAURANT",
    targetId: restaurantId,
    meta: { reason },
  });

  return restaurant;
};

/**
 * ===============================
 * DELIVERY PARTNER APPROVAL
 * ===============================
 */
exports.approveDeliveryPartner = async (partnerId, adminId) => {
  const partner = await DeliveryPartner.findByIdAndUpdate(
    partnerId,
    { isApproved: true },
    { new: true }
  );

  if (!partner) throw new Error("Delivery partner not found");

  await AdminLog.create({
    adminId,
    action: "APPROVE_DELIVERY_PARTNER",
    targetId: partnerId,
  });

  return partner;
};

exports.suspendDeliveryPartner = async (partnerId, reason, adminId) => {
  const partner = await DeliveryPartner.findByIdAndUpdate(
    partnerId,
    {
      isApproved: false,
      suspensionReason: reason,
    },
    { new: true }
  );

  if (!partner) throw new Error("Delivery partner not found");

  await AdminLog.create({
    adminId,
    action: "SUSPEND_DELIVERY_PARTNER",
    targetId: partnerId,
    meta: { reason },
  });

  return partner;
};

/**
 * ===============================
 * MANUAL ORDER OVERRIDE
 * ===============================
 */
exports.overrideOrderStatus = async (
  orderId,
  newStatus,
  adminId,
  note
) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  order.status = newStatus;
  order.adminOverrideNote = note || "Admin override";
  await order.save();

  await AdminLog.create({
    adminId,
    action: "ORDER_OVERRIDE",
    targetId: orderId,
    meta: { newStatus, note },
  });

  return order;
};

/**
 * ===============================
 * MANUAL REFUND (ADMIN)
 * ===============================
 */
exports.forceRefund = async (orderId, adminId, reason) => {
  const payment = await Payment.findOne({ orderId });
  if (!payment) throw new Error("Payment not found");

  payment.status = "REFUNDED";
  payment.refundReason = reason || "Admin forced refund";
  payment.refundedAt = new Date();
  await payment.save();

  await Order.findByIdAndUpdate(orderId, {
    status: "CANCELLED",
    cancelReason: reason,
  });

  await AdminLog.create({
    adminId,
    action: "FORCE_REFUND",
    targetId: orderId,
    meta: { reason },
  });

  return payment;
};

/**
 * ===============================
 * WALLET ADJUSTMENT (ADMIN)
 * ===============================
 */
exports.adjustWallet = async ({
  userId,
  role,
  amount,
  type,
  reason,
  adminId,
}) => {
  const wallet = await Wallet.findOne({ userId, role });
  if (!wallet) throw new Error("Wallet not found");

  if (type === "CREDIT") wallet.balance += amount;
  if (type === "DEBIT") wallet.balance -= amount;

  wallet.transactions.push({
    type,
    amount,
    reference: "ADMIN_ADJUSTMENT",
    reason,
    createdAt: new Date(),
  });

  await wallet.save();

  await AdminLog.create({
    adminId,
    action: "WALLET_ADJUSTMENT",
    targetId: userId,
    meta: { role, amount, type, reason },
  });

  return wallet;
};

/**
 * ===============================
 * ANALYTICS DASHBOARD
 * ===============================
 */
exports.getPlatformAnalytics = async () => {
  const totalOrders = await Order.countDocuments();
  const completedOrders = await Order.countDocuments({
    status: "COMPLETED",
  });

  const revenueAgg = await Payment.aggregate([
    { $match: { status: "PAID" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const revenue = revenueAgg[0]?.total || 0;

  return {
    totalOrders,
    completedOrders,
    revenue,
  };
};
