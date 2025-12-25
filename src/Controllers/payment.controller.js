/**
 * HARSHUU Backend
 * Payment Controller
 * Production-grade (Zomato / Swiggy style)
 */

const crypto = require("crypto");
const Order = require("../models/order");
const Payment = require("../models/payment");
const Wallet = require("../models/wallet");
const razorpay = require("../config/razorpay");
const paymentService = require("../services/payment.service");

/**
 * ======================================
 * CREATE RAZORPAY ORDER
 * ======================================
 * POST /api/payment/create
 * Role: USER
 */
exports.createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentMethod === "COD") {
      return res.status(400).json({
        success: false,
        message: "COD order does not require payment",
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.pricing.totalAmount * 100), // paise
      currency: "INR",
      receipt: `order_${order._id}`,
    });

    await Payment.create({
      orderId: order._id,
      userId: order.userId,
      razorpayOrderId: razorpayOrder.id,
      amount: order.pricing.totalAmount,
      status: "CREATED",
      method: order.paymentMethod,
    });

    return res.json({
      success: true,
      razorpayOrder,
    });
  } catch (error) {
    console.error("CREATE PAYMENT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create payment order",
    });
  }
};

/**
 * ======================================
 * VERIFY PAYMENT (CLIENT CALLBACK)
 * ======================================
 * POST /api/payment/verify
 * Role: USER
 */
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        status: "PAID",
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    await paymentService.onPaymentSuccess(payment.orderId);

    return res.json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Payment verification error",
    });
  }
};

/**
 * ======================================
 * RAZORPAY WEBHOOK (SOURCE OF TRUTH)
 * ======================================
 * POST /api/payment/webhook
 * Role: PUBLIC (secured by signature)
 */
exports.razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest !== req.headers["x-razorpay-signature"]) {
      return res.status(400).send("Invalid signature");
    }

    const event = req.body.event;

    if (event === "payment.captured") {
      const paymentEntity = req.body.payload.payment.entity;

      const payment = await Payment.findOneAndUpdate(
        { razorpayOrderId: paymentEntity.order_id },
        {
          razorpayPaymentId: paymentEntity.id,
          status: "PAID",
        },
        { new: true }
      );

      if (payment) {
        await paymentService.onPaymentSuccess(payment.orderId);
      }
    }

    return res.json({ status: "ok" });
  } catch (error) {
    console.error("WEBHOOK ERROR:", error);
    return res.status(500).json({ status: "error" });
  }
};

/**
 * ======================================
 * WALLET PAYMENT
 * ======================================
 * POST /api/payment/wallet
 * Role: USER
 */
exports.payUsingWallet = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    const wallet = await Wallet.findOne({ userId: req.user.id });

    if (!order || !wallet) {
      return res.status(404).json({
        success: false,
        message: "Order or wallet not found",
      });
    }

    if (wallet.balance < order.pricing.totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    wallet.balance -= order.pricing.totalAmount;
    await wallet.save();

    await Payment.create({
      orderId: order._id,
      userId: req.user.id,
      amount: order.pricing.totalAmount,
      status: "PAID",
      method: "WALLET",
    });

    await paymentService.onPaymentSuccess(order._id);

    return res.json({
      success: true,
      message: "Payment successful using wallet",
    });
  } catch (error) {
    console.error("WALLET PAYMENT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Wallet payment failed",
    });
  }
};
