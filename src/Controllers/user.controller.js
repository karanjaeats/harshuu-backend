/**
 * HARSHUU Backend
 * User Controller
 * Zomato / Swiggy style
 */

const User = require("../models/User");
const Order = require("../models/Order");
const Wallet = require("../models/Wallet");
const Review = require("../models/Review");

/**
 * ===============================
 * GET MY PROFILE
 * ===============================
 * GET /api/user/me
 */
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-__v");

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
};

/**
 * ===============================
 * UPDATE PROFILE
 * ===============================
 * PATCH /api/user/me
 */
exports.updateMyProfile = async (req, res) => {
  try {
    const allowedFields = ["name", "email"];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field]) {
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
};

/**
 * ===============================
 * GET MY ORDERS
 * ===============================
 * GET /api/user/orders
 */
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate("restaurantId", "name address")
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
};

/**
 * ===============================
 * GET SINGLE ORDER
 * ===============================
 * GET /api/user/orders/:orderId
 */
exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user.id,
    })
      .populate("restaurantId")
      .populate("deliveryPartnerId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("GET ORDER DETAILS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
};

/**
 * ===============================
 * GET WALLET
 * ===============================
 * GET /api/user/wallet
 */
exports.getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user.id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

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
};

/**
 * ===============================
 * ADD REVIEW
 * ===============================
 * POST /api/user/review
 */
exports.addReview = async (req, res) => {
  try {
    const { restaurantId, rating, comment } = req.body;

    if (!restaurantId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Restaurant and rating required",
      });
    }

    const hasOrdered = await Order.exists({
      userId: req.user.id,
      restaurantId,
      status: "COMPLETED",
    });

    if (!hasOrdered) {
      return res.status(403).json({
        success: false,
        message: "You can review only after order completion",
      });
    }

    const review = await Review.create({
      userId: req.user.id,
      restaurantId,
      rating,
      comment,
    });

    return res.json({
      success: true,
      review,
    });
  } catch (error) {
    console.error("ADD REVIEW ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add review",
    });
  }
};

/**
 * ===============================
 * DEACTIVATE ACCOUNT
 * ===============================
 * DELETE /api/user/deactivate
 */
exports.deactivateAccount = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      isActive: false,
    });

    return res.json({
      success: true,
      message: "Account deactivated",
    });
  } catch (error) {
    console.error("DEACTIVATE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to deactivate account",
    });
  }
};
