/**
 * HARSHUU Backend
 * Admin Controller (GOD MODE)
 * Production-grade – Zomato / Swiggy style
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
 * GET ADMIN DASHBOARD STATS
 * ===============================
 * GET /api/admin/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    const [
      users,
      restaurants,
      deliveryPartners,
      orders,
      completedOrders,
    ] = await Promise.all([
      User.countDocuments({ role: "USER" }),
      Restaurant.countDocuments(),
      DeliveryPartner.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: "COMPLETED" }),
    ]);

    const revenueAgg = await Order.aggregate([
      { $match: { status: "COMPLETED" } },
      { $group: { _id: null, total: { $sum: "$pricing.totalAmount" } } },
    ]);

    return res.json({
      success: true,
      stats: {
        users,
        restaurants,
        deliveryPartners,
        orders,
        completedOrders,
        totalRevenue: revenueAgg[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
};

/**
 * ===============================
 * APPROVE / SUSPEND RESTAURANT
 * ===============================
 * PATCH /api/admin/restaurant/:id
 */
exports.updateRestaurantStatus = async (req, res) => {
  try {
    const { isApproved, isSuspended } = req.body;

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { isApproved, isSuspended },
      { new: true }
    );

    await AdminLog.create({
      adminId: req.user.id,
      action: "RESTAURANT_STATUS_UPDATE",
      meta: { restaurantId: restaurant._id, isApproved, isSuspended },
    });

    return res.json({
      success: true,
      restaurant,
    });
  } catch (error) {
    console.error("RESTAURANT STATUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update restaurant",
    });
  }
};

/**
 * ===============================
 * APPROVE / SUSPEND DELIVERY PARTNER
 * ===============================
 * PATCH /api/admin/delivery/:id
 */
exports.updateDeliveryPartnerStatus = async (req, res) => {
  try {
    const { isApproved, isSuspended } = req.body;

    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.params.id,
      { isApproved, isSuspended },
      { new: true }
    );

    await AdminLog.create({
      adminId: req.user.id,
      action: "DELIVERY_STATUS_UPDATE",
      meta: { deliveryPartnerId: partner._id, isApproved, isSuspended },
    });

    return res.json({
      success: true,
      partner,
    });
  } catch (error) {
    console.error("DELIVERY STATUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update delivery partner",
    });
  }
};

/**
 * ===============================
 * UPDATE PLATFORM SETTINGS
 * ===============================
 * PATCH /api/admin/settings
 */
exports.updateSettings = async (req, res) => {
  try {
    const settings = await AdminSettings.findOneAndUpdate(
      {},
      req.body,
      { new: true, upsert: true }
    );

    await AdminLog.create({
      adminId: req.user.id,
      action: "SETTINGS_UPDATE",
      meta: req.body,
    });

    return res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("SETTINGS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update settings",
    });
  }
};

/**
 * ===============================
 * MANUAL ORDER OVERRIDE
 * ===============================
 * PATCH /api/admin/order/:id
 */
exports.overrideOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    await AdminLog.create({
      adminId: req.user.id,
      action: "ORDER_OVERRIDE",
      meta: { orderId: order._id, status },
    });

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
};

/**
 * ===============================
 * FRAUD MONITORING (BASIC)
 * ===============================
 * GET /api/admin/fraud
 */
exports.getFraudSignals = async (req, res) => {
  try {
    const suspiciousUsers = await Order.aggregate([
      { $match: { status: "CANCELLED" } },
      {
        $group: {
          _id: "$userId",
          cancelled: { $sum: 1 },
        },
      },
      { $match: { cancelled: { $gte: 5 } } },
    ]);

    return res.json({
      success: true,
      suspiciousUsers,
    });
  } catch (error) {
    console.error("FRAUD CHECK ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch fraud data",
    });
  }
};

/**
 * ===============================
 * ADMIN ACTIVITY LOGS
 * ===============================
 * GET /api/admin/logs
 */
exports.getAdminLogs = async (req, res) => {
  try {
    const logs = await AdminLog.find()
      .populate("adminId", "name mobile")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error("ADMIN LOG ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin logs",
    });
  }
};
