/**
 * HARSHUU Backend
 * Delivery Partner Controller
 * Production-grade (Zomato / Swiggy style)
 */

const DeliveryPartner = require("../models/deliverypartner");
const Order = require("../models/order");
const Wallet = require("../models/wallet");
const AdminSettings = require("../models/adminSettings");

/**
 * ===============================
 * REGISTER DELIVERY PARTNER
 * ===============================
 * POST /api/delivery/register
 * Role: DELIVERY
 */
exports.registerDeliveryPartner = async (req, res) => {
  try {
    const exists = await DeliveryPartner.findOne({ userId: req.user.id });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Delivery partner already registered",
      });
    }

    const partner = await DeliveryPartner.create({
      userId: req.user.id,
      name: req.body.name,
      mobile: req.body.mobile,
      vehicleType: req.body.vehicleType,
      isApproved: false,
      isOnline: false,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful. Awaiting admin approval.",
      partner,
    });
  } catch (error) {
    console.error("REGISTER DELIVERY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

/**
 * ===============================
 * SET ONLINE / OFFLINE
 * ===============================
 * PATCH /api/delivery/status
 * Role: DELIVERY
 */
exports.setOnlineStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;

    const partner = await DeliveryPartner.findOneAndUpdate(
      { userId: req.user.id, isApproved: true },
      { isOnline },
      { new: true }
    );

    if (!partner) {
      return res.status(403).json({
        success: false,
        message: "Delivery partner not approved",
      });
    }

    return res.json({
      success: true,
      isOnline: partner.isOnline,
    });
  } catch (error) {
    console.error("ONLINE STATUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};

/**
 * ===============================
 * GET ASSIGNED ORDERS
 * ===============================
 * GET /api/delivery/orders
 * Role: DELIVERY
 */
exports.getAssignedOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      deliveryPartnerId: req.user.id,
      status: { $in: ["PICKED", "DELIVERED"] },
    })
      .populate("restaurantId", "name address")
      .populate("userId", "name mobile")
      .sort({ createdAt: 1 });

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
};

/**
 * ===============================
 * UPDATE DELIVERY STATUS
 * ===============================
 * PATCH /api/delivery/order/:id
 * Role: DELIVERY
 */
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["PICKED", "DELIVERED", "COMPLETED"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      deliveryPartnerId: req.user.id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.status = status;
    await order.save();

    // Credit delivery earnings
    if (status === "COMPLETED") {
      await Wallet.findOneAndUpdate(
        { userId: req.user.id },
        { $inc: { balance: order.pricing.deliveryFee } },
        { upsert: true, new: true }
      );
    }

    return res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("DELIVERY STATUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
};

/**
 * ===============================
 * DELIVERY EARNINGS
 * ===============================
 * GET /api/delivery/earnings
 * Role: DELIVERY
 */
exports.getEarnings = async (req, res) => {
  try {
    const completedOrders = await Order.find({
      deliveryPartnerId: req.user.id,
      status: "COMPLETED",
    });

    const total = completedOrders.reduce(
      (sum, o) => sum + o.pricing.deliveryFee,
      0
    );

    const wallet = await Wallet.findOne({ userId: req.user.id });

    return res.json({
      success: true,
      totalEarned: total,
      walletBalance: wallet ? wallet.balance : 0,
    });
  } catch (error) {
    console.error("DELIVERY EARNINGS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch earnings",
    });
  }
};
