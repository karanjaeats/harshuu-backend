/**
 * HARSHUU Backend
 * Order Service
 * Production-grade (Zomato / Swiggy style)
 */

const Order = require("../models/order");
const Restaurant = require("../models/restaurant");
const DeliveryPartner = require("../models/deliverypartner");
const Wallet = require("../models/wallet");
const AdminSettings = require("../models/adminSettings");

const assignmentService = require("./assignment.service");

/**
 * ======================================
 * AFTER PAYMENT SUCCESS
 * ======================================
 * Called from payment.service / webhook
 */
exports.onPaymentSuccess = async (orderId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status !== "PAYMENT_PENDING") {
    return order;
  }

  order.status = "PAID";
  await order.save();

  // Assign delivery partner asynchronously
  await assignmentService.assignDeliveryPartner(order._id);

  return order;
};

/**
 * ======================================
 * ACCEPT ORDER (RESTAURANT)
 * ======================================
 */
exports.acceptOrder = async (orderId, restaurantOwnerId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  const restaurant = await Restaurant.findOne({
    _id: order.restaurantId,
    ownerId: restaurantOwnerId,
    isApproved: true,
  });

  if (!restaurant) {
    throw new Error("Unauthorized restaurant");
  }

  if (order.status !== "PAID") {
    throw new Error("Order cannot be accepted");
  }

  order.status = "ACCEPTED";
  await order.save();

  return order;
};

/**
 * ======================================
 * REJECT ORDER (RESTAURANT)
 * ======================================
 */
exports.rejectOrder = async (orderId, restaurantOwnerId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  const restaurant = await Restaurant.findOne({
    _id: order.restaurantId,
    ownerId: restaurantOwnerId,
  });

  if (!restaurant) {
    throw new Error("Unauthorized restaurant");
  }

  if (!["PAID", "CREATED"].includes(order.status)) {
    throw new Error("Order cannot be rejected");
  }

  order.status = "CANCELLED";
  await order.save();

  return order;
};

/**
 * ======================================
 * COMPLETE ORDER (DELIVERY)
 * ======================================
 */
exports.completeOrder = async (orderId, deliveryPartnerId) => {
  const order = await Order.findOne({
    _id: orderId,
    deliveryPartnerId,
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status !== "DELIVERED") {
    throw new Error("Order not deliverable");
  }

  order.status = "COMPLETED";
  await order.save();

  // Credit delivery earnings
  await Wallet.findOneAndUpdate(
    { userId: deliveryPartnerId },
    { $inc: { balance: order.pricing.deliveryFee } },
    { upsert: true }
  );

  return order;
};

/**
 * ======================================
 * ADMIN FORCE CANCEL
 * ======================================
 */
exports.adminCancelOrder = async (orderId, reason) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  order.status = "CANCELLED";
  order.adminCancelReason = reason;
  await order.save();

  return order;
};

/**
 * ======================================
 * FETCH ORDER VISIBILITY
 * ======================================
 */
exports.getOrderForUser = async (orderId, userId) => {
  return Order.findOne({ _id: orderId, userId })
    .populate("restaurantId", "name")
    .populate("deliveryPartnerId", "name mobile");
};

exports.getOrderForRestaurant = async (orderId, restaurantOwnerId) => {
  const order = await Order.findById(orderId).populate("userId", "name mobile");

  if (!order) return null;

  const restaurant = await Restaurant.findOne({
    _id: order.restaurantId,
    ownerId: restaurantOwnerId,
  });

  if (!restaurant) return null;

  return order;
};

exports.getOrderForDelivery = async (orderId, deliveryPartnerId) => {
  return Order.findOne({
    _id: orderId,
    deliveryPartnerId,
  }).populate("restaurantId", "name address");
};
