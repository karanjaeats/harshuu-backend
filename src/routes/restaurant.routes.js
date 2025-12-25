/**
 * HARSHUU Backend
 * Restaurant Routes
 * Roles: RESTAURANT, ADMIN
 * Production-grade (Zomato / Swiggy style)
 */

const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");
const MenuCategory = require("../models/MenuCategory");
const MenuItem = require("../models/MenuItem");

const { ORDER_STATUS } = require("../config/constants");

const router = express.Router();

/**
 * =====================================
 * REGISTER / ONBOARD RESTAURANT
 * =====================================
 * POST /api/restaurant/register
 * Role: RESTAURANT
 */
router.post(
  "/register",
  auth,
  role("RESTAURANT"),
  async (req, res) => {
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
        deliveryRadiusKm: req.body.deliveryRadiusKm,
      });

      return res.status(201).json({
        success: true,
        restaurant,
      });
    } catch (error) {
      console.error("RESTAURANT REGISTER ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to register restaurant",
      });
    }
  }
);

/**
 * =====================================
 * GET OWN RESTAURANT PROFILE
 * =====================================
 * GET /api/restaurant/me
 * Role: RESTAURANT
 */
router.get(
  "/me",
  auth,
  role("RESTAURANT"),
  async (req, res) => {
    try {
      const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
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
  }
);

/**
 * =====================================
 * OPEN / CLOSE RESTAURANT
 * =====================================
 * PATCH /api/restaurant/status
 * Role: RESTAURANT
 */
router.patch(
  "/status",
  auth,
  role("RESTAURANT"),
  async (req, res) => {
    try {
      const { isOpen } = req.body;

      await Restaurant.findOneAndUpdate(
        { ownerId: req.user.id },
        { isOpen }
      );

      return res.json({
        success: true,
        message: `Restaurant ${isOpen ? "opened" : "closed"}`,
      });
    } catch (error) {
      console.error("STATUS UPDATE ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update status",
      });
    }
  }
);

/**
 * =====================================
 * ADD MENU CATEGORY
 * =====================================
 * POST /api/restaurant/menu/category
 * Role: RESTAURANT
 */
router.post(
  "/menu/category",
  auth,
  role("RESTAURANT"),
  async (req, res) => {
    try {
      const restaurant = await Restaurant.findOne({ ownerId: req.user.id });

      const category = await MenuCategory.create({
        restaurantId: restaurant._id,
        name: req.body.name,
      });

      return res.status(201).json({
        success: true,
        category,
      });
    } catch (error) {
      console.error("ADD CATEGORY ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to add category",
      });
    }
  }
);

/**
 * =====================================
 * ADD MENU ITEM
 * =====================================
 * POST /api/restaurant/menu/item
 * Role: RESTAURANT
 */
router.post(
  "/menu/item",
  auth,
  role("RESTAURANT"),
  async (req, res) => {
    try {
      const restaurant = await Restaurant.findOne({ ownerId: req.user.id });

      const item = await MenuItem.create({
        restaurantId: restaurant._id,
        categoryId: req.body.categoryId,
        name: req.body.name,
        price: req.body.price,
        isAvailable: true,
      });

      return res.status(201).json({
        success: true,
        item,
      });
    } catch (error) {
      console.error("ADD ITEM ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to add item",
      });
    }
  }
);

/**
 * =====================================
 * GET RESTAURANT ORDERS
 * =====================================
 * GET /api/restaurant/orders
 * Role: RESTAURANT
 */
router.get(
  "/orders",
  auth,
  role("RESTAURANT"),
  async (req, res) => {
    try {
      const restaurant = await Restaurant.findOne({ ownerId: req.user.id });

      const orders = await Order.find({
        restaurantId: restaurant._id,
      })
        .sort({ createdAt: -1 })
        .populate("userId", "name mobile")
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
 * =====================================
 * ACCEPT / REJECT ORDER
 * =====================================
 * POST /api/restaurant/orders/:id/action
 * Role: RESTAURANT
 */
router.post(
  "/orders/:id/action",
  auth,
  role("RESTAURANT"),
  async (req, res) => {
    try {
      const { action } = req.body; // ACCEPT / REJECT

      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (action === "ACCEPT") {
        order.status = ORDER_STATUS.ACCEPTED;
      } else if (action === "REJECT") {
        order.status = ORDER_STATUS.CANCELLED;
        order.cancelledBy = "RESTAURANT";
      }

      await order.save();

      return res.json({
        success: true,
        message: `Order ${action.toLowerCase()}ed`,
      });
    } catch (error) {
      console.error("ORDER ACTION ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to process order",
      });
    }
  }
);

module.exports = router;     
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Restaurant registration failed"
      });
    }
  }
);

/**
 * OPEN / CLOSE RESTAURANT
 */
router.patch(
  "/open-close",
  auth,
  role("RESTAURANT"),
  async (req, res) => {
    try {
      await Restaurant.findOneAndUpdate(
        { ownerId: req.user.id },
        { isOpen: req.body.isOpen }
      );

      res.json({
        success: true,
        message: "Restaurant status updated"
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to update status"
      });
    }
  }
);

/**
 * PUBLIC – LIST RESTAURANTS (For Home Page)
 * NO AUTH REQUIRED
 */
router.get("/public", async (req, res) => {
  try {
    const restaurants = await Restaurant.find({
      approved: true,
      isOpen: true
    }).select("name address location");

    res.json({
      success: true,
      restaurants
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch restaurants"
    });
  }
});

module.exports = router;
