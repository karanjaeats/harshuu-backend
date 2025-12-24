/**
 * HARSHUU Backend
 * Restaurant Controller
 * Production-grade (Zomato / Swiggy style)
 */

const Restaurant = require("../models/Restaurant");
const MenuCategory = require("../models/MenuCategory");
const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");
const AdminSettings = require("../models/AdminSettings");

/**
 * ===============================
 * REGISTER RESTAURANT
 * ===============================
 * POST /api/restaurant/register
 * Role: RESTAURANT
 */
exports.registerRestaurant = async (req, res) => {
  try {
    const existing = await Restaurant.findOne({ ownerId: req.user.id });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Restaurant already registered",
      });
    }

    const restaurant = await Restaurant.create({
      ownerId: req.user.id,
      name: req.body.name,
      address: req.body.address,
      location: req.body.location, // { lat, lng }
      cuisine: req.body.cuisine,
      isOpen: false,
      isApproved: false,
    });

    return res.status(201).json({
      success: true,
      message: "Restaurant registered. Awaiting admin approval.",
      restaurant,
    });
  } catch (error) {
    console.error("REGISTER RESTAURANT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Restaurant registration failed",
    });
  }
};

/**
 * ===============================
 * GET MY RESTAURANT
 * ===============================
 * GET /api/restaurant/me
 */
exports.getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      ownerId: req.user.id,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    return res.json({
      success: true,
      restaurant,
    });
  } catch (error) {
    console.error("GET RESTAURANT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch restaurant",
    });
  }
};

/**
 * ===============================
 * UPDATE RESTAURANT PROFILE
 * ===============================
 * PATCH /api/restaurant/me
 */
exports.updateRestaurant = async (req, res) => {
  try {
    const updates = {};
    const allowed = ["name", "address", "cuisine", "deliveryRadius"];

    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    });

    const restaurant = await Restaurant.findOneAndUpdate(
      { ownerId: req.user.id },
      updates,
      { new: true }
    );

    return res.json({
      success: true,
      restaurant,
    });
  } catch (error) {
    console.error("UPDATE RESTAURANT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
};

/**
 * ===============================
 * OPEN / CLOSE RESTAURANT
 * ===============================
 * PATCH /api/restaurant/open-close
 */
exports.toggleOpenClose = async (req, res) => {
  try {
    const { isOpen } = req.body;

    const restaurant = await Restaurant.findOneAndUpdate(
      { ownerId: req.user.id, isApproved: true },
      { isOpen },
      { new: true }
    );

    if (!restaurant) {
      return res.status(403).json({
        success: false,
        message: "Restaurant not approved or not found",
      });
    }

    return res.json({
      success: true,
      isOpen: restaurant.isOpen,
    });
  } catch (error) {
    console.error("OPEN CLOSE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};

/**
 * ===============================
 * CREATE MENU CATEGORY
 * ===============================
 * POST /api/restaurant/menu/category
 */
exports.createCategory = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });

    if (!restaurant || !restaurant.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Restaurant not approved",
      });
    }

    const category = await MenuCategory.create({
      restaurantId: restaurant._id,
      name: req.body.name,
    });

    return res.status(201).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("CREATE CATEGORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
};

/**
 * ===============================
 * ADD MENU ITEM
 * ===============================
 * POST /api/restaurant/menu/item
 */
exports.addMenuItem = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });

    if (!restaurant || !restaurant.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Restaurant not approved",
      });
    }

    const item = await MenuItem.create({
      restaurantId: restaurant._id,
      categoryId: req.body.categoryId,
      name: req.body.name,
      price: req.body.price,
      isAvailable: true,
      isVeg: req.body.isVeg,
    });

    return res.status(201).json({
      success: true,
      item,
    });
  } catch (error) {
    console.error("ADD MENU ITEM ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add menu item",
    });
  }
};

/**
 * ===============================
 * GET INCOMING ORDERS
 * ===============================
 * GET /api/restaurant/orders
 */
exports.getIncomingOrders = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });

    const orders = await Order.find({
      restaurantId: restaurant._id,
      status: { $in: ["PAID", "ACCEPTED", "PREPARING"] },
    })
      .populate("userId", "name mobile")
      .sort({ createdAt: 1 });

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
 * ACCEPT / REJECT ORDER
 * ===============================
 * PATCH /api/restaurant/order/:id
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["ACCEPTED", "REJECTED", "PREPARING"];

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

    return res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("ORDER STATUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update order",
    });
  }
};

/**
 * ===============================
 * RESTAURANT EARNINGS
 * ===============================
 * GET /api/restaurant/earnings
 */
exports.getEarnings = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    const settings = await AdminSettings.findOne();

    const orders = await Order.find({
      restaurantId: restaurant._id,
      status: "COMPLETED",
    });

    const gross = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const commission = (gross * settings.restaurantCommission) / 100;
    const net = gross - commission;

    return res.json({
      success: true,
      gross,
      commission,
      net,
    });
  } catch (error) {
    console.error("EARNINGS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate earnings",
    });
  }
};
