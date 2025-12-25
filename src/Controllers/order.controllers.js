/**
 * HARSHUU Backend
 * Order Controller
 * Production-grade (Zomato / Swiggy style)
 */

const Order = require("../models/order");
const Restaurant = require("../models/restaurant");
const MenuItem = require("../models/menuitem");
const DeliveryPartner = require("../models/deliverypartner");
const Wallet = require("../models/wallet");
const AdminSettings = require("../models/adminSettings");

const pricingService = require("../services/pricing.service");
const assignmentService = require("../services/assignment.service");
const paymentService = require("../services/payment.service");

/**
 * ======================================
 * CREATE ORDER (USER)
 * ======================================
 * POST /api/order
 */
exports.createOrder = async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      isApproved: true,
      isOpen: true,
    });

    if (!restaurant) {
      return res.status(400).json({
        success: false,
        message: "Restaurant not available",
      });
    }

    // Fetch items & calculate item total
    let itemTotal = 0;
    const orderItems = [];

    for (const cartItem of items) {
      const item = await MenuItem.findOne({
        _id: cartItem.itemId,
        restaurantId,
        isAvailable: true,
      });

      if (!item) {
        return res.status(400).json({
          success: false,
          message: "Invalid menu item",
        });
      }

      itemTotal += item.price * cartItem.quantity;

      orderItems.push({
        itemId: item._id,
        name: item.name,
        price: item.price,
        quantity: cartItem.quantity,
      });
    }

    // Pricing (distance, surge, minimum order)
    const pricing = await pricingService.calculateOrderPricing({
      restaurant,
      itemTotal,
      userLocation: deliveryAddress.location,
    });

    if (!pricing.allowed) {
      return res.status(400).json({
        success: false,
        message: pricing.reason,
      });
    }

    // Create order
    const order = await Order.create({
      userId: req.user.id,
      restaurantId,
      items: orderItems,
      deliveryAddress,
      pricing,
      paymentMethod,
      status: paymentMethod === "COD" ? "CREATED" : "PAYMENT_PENDING",
    });

    // Online payment
    if (paymentMethod !== "COD") {
      const payment = await paymentService.createPayment(order);
      return res.status(201).json({
        success: true,
        orderId: order._id,
        payment,
      });
    }

    return res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Order creation failed",
    });
  }
};

/**
 * ======================================
 * PAYMENT CONFIRMATION (WEBHOOK HANDLED SEPARATELY)
 * ======================================
 * PATCH /api/order/:id/paid
 */
exports.markOrderPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.status = "PAID";
    await order.save();

    // Assign delivery partner
    await assignmentService.assignDeliveryPartner(order._id);

    return res.json({
      success: true,
      message: "Payment confirmed",
    });
  } catch (error) {
    console.error("PAYMENT CONFIRM ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Payment confirmation failed",
    });
  }
};

/**
 * ======================================
 * GET USER ORDERS
 * ======================================
 * GET /api/order/my
 */
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate("restaurantId", "name")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("GET USER ORDERS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

/**
 * ======================================
 * GET ORDER DETAILS
 * ======================================
 * GET /api/order/:id
 */
exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("restaurantId", "name")
      .populate("deliveryPartnerId", "name mobile");

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
 * ======================================
 * CANCEL ORDER (USER)
 * ======================================
 * PATCH /api/order/:id/cancel
 */
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!["CREATED", "PAID"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled now",
      });
    }

    order.status = "CANCELLED";
    await order.save();

    // Refund if prepaid
    if (order.paymentMethod !== "COD") {
      await paymentService.refund(order);
    }

    return res.json({
      success: true,
      message: "Order cancelled",
    });
  } catch (error) {
    console.error("CANCEL ORDER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
    });
  }
};

/**
 * ======================================
 * UPDATE ORDER STATUS (RESTAURANT / DELIVERY)
 * ======================================
 * PATCH /api/order/:id/status
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowed = [
      "ACCEPTED",
      "PREPARING",
      "PICKED",
      "DELIVERED",
      "COMPLETED",
    ];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.status = status;
    await order.save();

    // Delivery partner earnings
    if (status === "COMPLETED" && order.deliveryPartnerId) {
      const wallet = await Wallet.findOneAndUpdate(
        { userId: order.deliveryPartnerId },
        { $inc: { balance: order.pricing.deliveryFee } },
        { upsert: true, new: true }
      );
    }

    return res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
};
