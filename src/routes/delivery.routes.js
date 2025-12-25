/**
 * HARSHUU Backend
 * Delivery Partner Routes
 * Role: DELIVERY
 * Zomato / Swiggy style
 */

const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const DeliveryPartner = require("../models/deliverypartner");
const Order = require("../models/Order");
const Wallet = require("../models/Wallet");

const { ORDER_STATUS } = require("../config/constants");

const router = express.Router();

/**
 * =====================================
 * DELIVERY PARTNER PROFILE
 * =====================================
 * GET /api/delivery/me
 */
router.get(
  "/me",
  auth,
  role("DELIVERY"),
  async (req, res) => {
    try {
      const partner = await DeliveryPartner.findOne({ userId: req.user.id });

      if (!partner) {
        return res.status(404).json({
          success: false,
          message: "Delivery partner not found",
        });
      }

      return res.json({
        success: true,
        partner,
      });
    } catch (error) {
      console.error("DELIVERY PROFILE ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch profile",
      });
    }
  }
);

/**
 * =====================================
 * GO ONLINE / OFFLINE
 * =====================================
 * PATCH /api/delivery/status
 */
router.patch(
  "/status",
  auth,
  role("DELIVERY"),
  async (req, res) => {
    try {
      const { isOnline } = req.body;

      await DeliveryPartner.findOneAndUpdate(
        { userId: req.user.id },
        { isOnline }
      );

      return res.json({
        success: true,
        message: `You are now ${isOnline ? "ONLINE" : "OFFLINE"}`,
      });
    } catch (error) {
      console.error("DELIVERY STATUS ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update status",
      });
    }
  }
);

/**
 * =====================================
 * GET ASSIGNED ORDERS
 * =====================================
 * GET /api/delivery/orders
 */
router.get(
  "/orders",
  auth,
  role("DELIVERY"),
  async (req, res) => {
    try {
      const orders = await Order.find({
        deliveryPartnerId: req.user.id,
        status: {
          $in: [
            ORDER_STATUS.ACCEPTED,
            ORDER_STATUS.PREPARING,
            ORDER_STATUS.PICKED,
          ],
        },
      })
        .sort({ createdAt: -1 })
        .populate("restaurantId", "name address")
        .populate("userId", "name mobile");

      return res.json({
        success: true,
        orders,
      });
    } catch (error) {
      console.error("GET DELIVERY ORDERS ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch orders",
      });
    }
  }
);

/**
 * =====================================
 * UPDATE DELIVERY STATUS
 * =====================================
 * POST /api/delivery/orders/:orderId/status
 */
router.post(
  "/orders/:orderId/status",
  auth,
  role("DELIVERY"),
  async (req, res) => {
    try {
      const { status } = req.body;

      const order = await Order.findOne({
        _id: req.params.orderId,
        deliveryPartnerId: req.user.id,
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      order.status = status;

      // When delivered → credit wallet
      if (status === ORDER_STATUS.DELIVERED) {
        const partner = await DeliveryPartner.findOne({
          userId: req.user.id,
        });

        const earning = order.pricing.deliveryFee;

        partner.totalEarnings += earning;
        await partner.save();

        await Wallet.findOneAndUpdate(
          { userId: req.user.id },
          {
            $inc: { balance: earning },
            $push: {
              transactions: {
                amount: earning,
                type: "CREDIT",
                reason: "DELIVERY_EARNING",
              },
            },
          },
          { upsert: true }
        );
      }

      await order.save();

      return res.json({
        success: true,
        order,
      });
    } catch (error) {
      console.error("DELIVERY UPDATE ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update delivery",
      });
    }
  }
);

/**
 * =====================================
 * DELIVERY EARNINGS SUMMARY
 * =====================================
 * GET /api/delivery/earnings
 */
router.get(
  "/earnings",
  auth,
  role("DELIVERY"),
  async (req, res) => {
    try {
      const partner = await DeliveryPartner.findOne({ userId: req.user.id });
      const wallet = await Wallet.findOne({ userId: req.user.id });

      return res.json({
        success: true,
        totalEarnings: partner.totalEarnings,
        walletBalance: wallet ? wallet.balance : 0,
      });
    } catch (error) {
      console.error("EARNINGS ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch earnings",
      });
    }
  }
);

module.exports = router;
