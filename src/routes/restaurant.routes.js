/**
 * HARSHUU Backend
 * Restaurant Routes
 * Roles: RESTAURANT, ADMIN
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
 * REGISTER RESTAURANT
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
        location: req.body.location,
        deliveryRadiusKm: req.body.deliveryRadiusKm,
      });

      res.status(201).json({
        success: true,
        restaurant,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Restaurant registration failed",
      });
    }
  }
);

/**
 * GET OWN RESTAURANT
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

      res.json({
        success: true,
        restaurant,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch restaurant",
      });
    }
  }
);

/**
 * OPEN / CLOSE RESTAURANT
 */
router.patch(
  "/status",
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
        message: "Restaurant status updated",
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to update status",
      });
    }
  }
);

/**
 * ADD MENU CATEGORY
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

      res.status(201).json({
        success: true,
        category,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to add category",
      });
    }
  }
);

/**
 * ADD MENU ITEM
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

      res.status(201).json({
        success: true,
        item,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to add item",
      });
    }
  }
);

/**
 * GET RESTAURANT ORDERS
 */
router.get(
  "/orders",
  auth,
  role("RESTAURANT"),
  async (req, res) => {
    try {
      const restaurant = await Restaurant.findOne({ ownerId: req.user.id });

      const orders = await Order.find({ restaurantId: restaurant._id })
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        orders,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch orders",
      });
    }
  }
);

/**
 * PUBLIC RESTAURANTS LIST
 */
router.get("/public", async (req, res) => {
  try {
    const restaurants = await Restaurant.find({
      approved: true,
      isOpen: true,
    }).select("name address location");

    res.json({
      success: true,
      restaurants,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch restaurants",
    });
  }
});

module.exports = router;
