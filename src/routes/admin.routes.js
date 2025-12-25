/**
 * HARSHUU Backend
 * Admin Routes (God Mode)
 * Role: ADMIN
 */

const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const User = require("../models/user");
const Restaurant = require("../models/restaurant");
const DeliveryPartner = require("../models/deliverypartner");
const Order = require("../models/order");
const AdminSettings = require("../models/adminSettings");
const Wallet = require("../models/wallet");

const { ORDER_STATUS } = require("../config/constants");

const router = express.Router();

/**
 * ===============================
 * PLATFORM STATS DASHBOARD
 * ===============================
 * GET /api/admin/dashboard
 */
router.get(
  "/dashboard",
  auth,
  role("ADMIN"),
  async (req, res) => {
    try {
      const totalOrders = await Order.countDocuments();
      const completedOrders = await Order.countDocuments({
        status: ORDER_STATUS.COMPLETED,
      });

      const totalRevenueAgg = await Order.aggregate([
        { $match: { status: ORDER_STATUS.COMPLETED } },
        { $group: { _id: null, total: { $sum: "$pricing.total" } } },
      ]);

      return res.json({
        success: true,
        stats: {
          totalOrders,
          completedOrders,
          totalRevenue: totalRevenueAgg[0]?.total || 0,
        },
      });
    } catch (error) {
      console.error("ADMIN DASHBOARD ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to load dashboard",
      });
    }
  }
);

/**
 * ===============================
 * APPROVE / SUSPEND RESTAURANT
 * ===============================
 * PATCH /api/admin/restaurant/:id/status
 */
router.patch(
  "/restaurant/:id/status",
  auth,
  role("ADMIN"),
  async (req, res) => {
    try {
      const { isApproved, isSuspended } = req.body;

      await Restaurant.findByIdAndUpdate(req.params.id, {
        isApproved,
        isSuspended,
      });

      return res.json({
        success: true,
        message: "Restaurant status updated",
      });
    } catch (error) {
      console.error("RESTAURANT STATUS ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update restaurant",
      });
    }
  }
);

/**
 * ===============================
 * APPROVE / SUSPEND DELIVERY PARTNER
 * ===============================
 * PATCH /api/admin/delivery/:id/status
 */
router.patch(
  "/delivery/:id/status",
  auth,
  role("ADMIN"),
  async (req, res) => {
    try {
      const { isApproved, isSuspended } = req.body;

      await DeliveryPartner.findByIdAndUpdate(req.params.id, {
        isApproved,
        isSuspended,
      });

      return res.json({
        success: true,
        message: "Delivery partner updated",
      });
    } catch (error) {
      console.error("DELIVERY STATUS ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update delivery partner",
      });
    }
  }
);

/**
 * ===============================
 * UPDATE PLATFORM SETTINGS
 * ===============================
 * PATCH /api/admin/settings
 */
router.patch(
  "/settings",
  auth,
  role("ADMIN"),
  async (req, res) => {
    try {
      const settings = await AdminSettings.findOneAndUpdate(
        {},
        req.body,
        { new: true, upsert: true }
      );

      return res.json({
        success: true,
        settings,
      });
    } catch (error) {
      console.error("ADMIN SETTINGS ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update settings",
      });
    }
  }
);

/**
 * ===============================
 * MANUAL ORDER OVERRIDE
 * ===============================
 * POST /api/admin/order/:id/override
 */
router.post(
  "/order/:id/override",
  auth,
  role("ADMIN"),
  async (req, res) => {
    try {
      const { status } = req.body;

      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );

      return res.json({
        success: true,
        order,
      });
    } catch (error) {
      console.error("ORDER OVERRIDE ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to override order",
      });
    }
  }
);

/**
 * ===============================
 * FORCE WALLET ADJUSTMENT
 * ===============================
 * POST /api/admin/wallet/adjust
 */
router.post(
  "/wallet/adjust",
  auth,
  role("ADMIN"),
  async (req, res) => {
    try {
      const { userId, amount, reason } = req.body;

      await Wallet.findOneAndUpdate(
        { userId },
        {
          $inc: { balance: amount },
          $push: {
            transactions: {
              amount,
              type: amount > 0 ? "CREDIT" : "DEBIT",
              reason,
            },
          },
        },
        { upsert: true }
      );

      return res.json({
        success: true,
        message: "Wallet adjusted",
      });
    } catch (error) {
      console.error("WALLET ADJUST ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to adjust wallet",
      });
    }
  }
);

module.exports = router;/**
 * GET all orders
 */
router.get(
  "/orders",
  auth,
  role("ADMIN"),
  async (req, res) => {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  }
);

module.exports = router;
