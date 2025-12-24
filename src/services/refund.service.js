/**
 * HARSHUU Backend
 * Refund Service (Production Grade)
 */

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
 * PROCESS REFUND
 * ===============================
 * Used when:
 * - Order cancelled
 * - Restaurant rejected
 * - Admin forced refund
 */
exports.processRefund = async ({ orderId, reason = "Order Cancelled" }) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  const payment = await Payment.findOne({ orderId });
  if (!payment) {
    throw new Error("Payment record not found");
  }

  if (payment.status === "REFUNDED") {
    throw new Error("Payment already refunded");
  }

  // ===============================
  // ONLINE (RAZORPAY) REFUND
  // ===============================
  if (payment.method === "ONLINE") {
    if (!payment.gatewayPaymentId) {
      throw new Error("Invalid Razorpay payment reference");
    }

    const refund = await razorpay.payments.refund(
      payment.gatewayPaymentId,
      {
        amount: Math.round(payment.amount * 100), // paise
        notes: { reason },
      }
    );

    payment.status = "REFUNDED";
    payment.refundId = refund.id;
    payment.refundReason = reason;
    payment.refundedAt = new Date();
    await payment.save();
  }

  // ===============================
  // WALLET REFUND
  // ===============================
  if (payment.method === "WALLET") {
    const wallet = await Wallet.findOne({ userId: payment.userId });
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    wallet.balance += payment.amount;
    await wallet.save();

    payment.status = "REFUNDED";
    payment.refundReason = reason;
    payment.refundedAt = new Date();
    await payment.save();
  }

  // ===============================
  // COD (NO REFUND NEEDED)
  // ===============================
  if (payment.method === "COD") {
    payment.status = "CANCELLED";
    payment.refundReason = reason;
    await payment.save();
  }

  // ===============================
  // UPDATE ORDER
  // ===============================
  order.status = "CANCELLED";
  order.cancelReason = reason;
  order.cancelledAt = new Date();
  await order.save();

  return {
    success: true,
    message: "Refund processed successfully",
    orderId: order._id,
    paymentStatus: payment.status,
  };
};
