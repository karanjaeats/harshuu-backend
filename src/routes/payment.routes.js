/**
 * HARSHUU Backend
 * Payment Routes
 * Roles: USER, ADMIN
 * Razorpay + COD + Refund (Zomato style)
 */

const express = require("express");
const crypto = require("crypto");

const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const razorpay = require("../config/razorpay");
const { ORDER_STATUS, PAYMENT_STATUS } = require("../config/constants");

const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Wallet = require("../models/Wallet");

const router = express.Router();

/**
 * =====================================
 * CREATE PAYMENT ORDER (RAZORPAY)
 * =====================================
 * POST /api/payment/create
 * Role: USER
 */
router.post(
  "/create",
  auth,
  role("USER"),
  async (req, res) => {
    try {
      const { orderId, method } = req.body;

      const order = await Order.findOne({
        _id: orderId,
        userId: req.user.id,
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // COD flow
      if (method === "COD") {
        order.paymentMethod = "COD";
        order.paymentStatus = PAYMENT_STATUS.PENDING;
        order.status = ORDER_STATUS.PAID;

        await order.save();

        await Payment.create({
          orderId: order._id,
          userId: req.user.id,
          amount: order.pricing.total,
          method: "COD",
          status: PAYMENT_STATUS.PENDING,
        });

        return res.json({
          success: true,
          message: "COD selected",
        });
      }

      // Razorpay flow
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(order.pricing.total * 100),
        currency: "INR",
        receipt: `harshuu_${order._id}`,
      });

      await Payment.create({
        orderId: order._id,
        userId: req.user.id,
        amount: order.pricing.total,
        method: "RAZORPAY",
        razorpayOrderId: razorpayOrder.id,
        status: PAYMENT_STATUS.CREATED,
      });

      return res.json({
        success: true,
        razorpayOrder,
      });
    } catch (error) {
      console.error("CREATE PAYMENT ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create payment",
      });
    }
  }
);

/**
 * =====================================
 * VERIFY RAZORPAY PAYMENT
 * =====================================
 * POST /api/payment/verify
 * Role: USER
 */
router.post(
  "/verify",
  auth,
  role("USER"),
  async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body;

      const payment = await Payment.findOne({
        razorpayOrderId: razorpay_order_id,
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment record not found",
        });
      }

      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: "Payment verification failed",
        });
      }

      payment.status = PAYMENT_STATUS.SUCCESS;
      payment.razorpayPaymentId = razorpay_payment_id;
      await payment.save();

      await Order.findByIdAndUpdate(payment.orderId, {
        paymentStatus: PAYMENT_STATUS.SUCCESS,
        status: ORDER_STATUS.PAID,
      });

      return res.json({
        success: true,
        message: "Payment verified successfully",
      });
    } catch (error) {
      console.error("VERIFY PAYMENT ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Payment verification failed",
      });
    }
  }
);

/**
 * =====================================
 * REFUND PAYMENT (ADMIN)
 * =====================================
 * POST /api/payment/refund
 * Role: ADMIN
 */
router.post(
  "/refund",
  auth,
  role("ADMIN"),
  async (req, res) => {
    try {
      const { orderId, amount } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      await Wallet.findOneAndUpdate(
        { userId: order.userId },
        {
          $inc: { balance: amount },
          $push: {
            transactions: {
              amount,
              type: "CREDIT",
              reason: "ORDER_REFUND",
            },
          },
        },
        { upsert: true }
      );

      order.status = ORDER_STATUS.CANCELLED;
      order.paymentStatus = PAYMENT_STATUS.REFUNDED;
      await order.save();

      return res.json({
        success: true,
        message: "Refund processed to wallet",
      });
    } catch (error) {
      console.error("REFUND ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to process refund",
      });
    }
  }
);

module.exports = router;
