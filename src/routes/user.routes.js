/**
 * HARSHUU Backend
 * User Routes
 * Role: USER
 * Production-grade (Zomato / Swiggy style)
 */

const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const User = require("../models/user");
const Order = require("../models/order");
const Wallet = require("../models/wallet");

const router = express.Router();

/**
 * ==============================
 * GET USER PROFILE
 * ==============================
 * GET /api/user/profile
 */
router.get(
  "/profile",
  auth,
  role("USER"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.json({
        success: true,
        user: user.toSafeObject(),
      });
    } catch (error) {
      console.error("GET PROFILE ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch profile",
      });
    }
  }
);

/**
 * ==============================
 * UPDATE USER PROFILE
 * ==============================
 * PATCH /api/user/profile
 */
router.patch(
  "/profile",
  auth,
  role("USER"),
  async (req, res) => {
    try {
      const allowedFields = ["name", "email"];
      const updates = {};

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      const user = await User.findByIdAndUpdate(
        req.user.id,
        updates,
        { new: true }
      );

      return res.json({
        success: true,
        user: user.toSafeObject(),
      });
    } catch (error) {
      console.error("UPDATE PROFILE ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update profile",
      });
    }
  }
);

/**
 * ==============================
 * GET USER WALLET
 * ==============================
 * GET /api/user/wallet
 */
router.get(
  "/wallet",
  auth,
  role("USER"),
  async (req, res) => {
    try {
      const wallet = await Wallet.findOne({ userId: req.user.id });

      return res.json({
        success: true,
        wallet,
      });
    } catch (error) {
      console.error("GET WALLET ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch wallet",
      });
    }
  }
);

/**
 * ==============================
 * GET USER ORDERS
 * ==============================
 * GET /api/user/orders
 */
router.get(
  "/orders",
  auth,
  role("USER"),
  async (req, res) => {
    try {
      const orders = await Order.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .populate("restaurantId", "name")
        .populate("deliveryPartnerId", "name mobile");

      return res.json({
        success: true,
        orders,
      });
    } catch (error) {
      console.error("GET ORDERS ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch orders",
      });
    }
  }
);

/**
 * ==============================
 * CANCEL ORDER (USER SIDE)
 * ==============================
 * POST /api/user/orders/:orderId/cancel
 */
router.post(
  "/orders/:orderId/cancel",
  auth,
  role("USER"),
  async (req, res) => {
    try {
      const order = await Order.findOne({
        _id: req.params.orderId,
        userId: req.user.id,
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (!order.canUserCancel()) {
        return res.status(400).json({
          success: false,
          message: "Order cannot be cancelled at this stage",
        });
      }

      order.status = "CANCELLED";
      order.cancelledBy = "USER";
      order.cancelledAt = new Date();

      await order.save();

      return res.json({
        success: true,
        message: "Order cancelled successfully",
      });
    } catch (error) {
      console.error("CANCEL ORDER ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to cancel order",
      });
    }
  }
);

module.exports = router;
