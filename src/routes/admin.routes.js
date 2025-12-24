const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");

const router = express.Router();

/**
 * GET all pending restaurants
 */
router.get(
  "/restaurants/pending",
  auth,
  role("ADMIN"),
  async (req, res) => {
    const restaurants = await Restaurant.find({ approved: false });
    res.json({ success: true, restaurants });
  }
);

/**
 * APPROVE restaurant
 */
router.patch(
  "/restaurants/:id/approve",
  auth,
  role("ADMIN"),
  async (req, res) => {
    await Restaurant.findByIdAndUpdate(req.params.id, {
      approved: true
    });
    res.json({ success: true });
  }
);

/**
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
