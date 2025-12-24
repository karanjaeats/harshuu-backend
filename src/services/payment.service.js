/**
 * HARSHUU Backend
 * Payment Service (Production Grade)
 * Razorpay + Wallet + COD
 */

const crypto = require("crypto");
const Razorpay = require("razorpay");

const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Wallet = require("../models/Wallet");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * ===============================
 * CREATE PAYMENT ORDER
 * ===============================
 */
exports.createPaymentOrder = async ({ orderId, userId }) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.userId.toString() !== userId.toString()) {
    throw new Error("Unauthorized");
  }

  if (order.status !== "CREATED") {
    throw new Error("Invalid order state");
  }

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(order.payableAmount * 100), // paise
    currency: "INR",
    receipt: `harshuu_order_${order._id}`,
    payment_capture: 1,
  });

  await Payment.create({
    orderId: order._id,
    userId,
    amount: order.payableAmount,
    method: "ONLINE",
    gateway: "RAZORPAY",
    gatewayOrderId: razorpayOrder.id,
    status: "PENDING",
  });

  return {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
  };
};

/**
 * ===============================
 * VERIFY RAZORPAY PAYMENT
 * ===============================
 */
exports.verifyPayment = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new Error("Invalid payment signature");
  }

  const payment = await Payment.findOne({
    gatewayOrderId: razorpay_order_id,
  });

  if (!payment) {
    throw new Error("Payment record not found");
  }

  payment.gatewayPaymentId = razorpay_payment_id;
  payment.status = "SUCCESS";
  await payment.save();

  await Order.findByIdAndUpdate(payment.orderId, {
    status: "PAID",
    paidAt: new Date(),
  });

  return payment;
};

/**
 * ===============================
 * CASH ON DELIVERY
 * ===============================
 */
exports.createCODPayment = async ({ orderId, userId }) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.userId.toString() !== userId.toString()) {
    throw new Error("Unauthorized");
  }

  if (order.status !== "CREATED") {
    throw new Error("Invalid order state");
  }

  await Payment.create({
    orderId,
    userId,
    amount: order.payableAmount,
    method: "COD",
    status: "PENDING",
  });

  order.status = "PAID";
  order.paymentMode = "COD";
  await order.save();

  return { success: true };
};

/**
 * ===============================
 * WALLET PAYMENT
 * ===============================
 */
exports.walletPayment = async ({ orderId, userId }) => {
  const order = await Order.findById(orderId);
  const wallet = await Wallet.findOne({ userId });

  if (!order || !wallet) {
    throw new Error("Order or wallet not found");
  }

  if (wallet.balance < order.payableAmount) {
    throw new Error("Insufficient wallet balance");
  }

  wallet.balance -= order.payableAmount;
  await wallet.save();

  await Payment.create({
    orderId,
    userId,
    amount: order.payableAmount,
    method: "WALLET",
    status: "SUCCESS",
  });

  order.status = "PAID";
  order.paymentMode = "WALLET";
  await order.save();

  return { success: true };
};
