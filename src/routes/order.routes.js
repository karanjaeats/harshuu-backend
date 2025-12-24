/**
 * HARSHUU Backend
 * Order Routes
 * Roles: USER, RESTAURANT, DELIVERY, ADMIN
 * Zomato / Swiggy style lifecycle
 */

const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const MenuItem = require("../models/MenuItem");
const DeliveryPartner = require("../models/DeliveryPartner");

const pricingService = require("../services/pricing.service");
const assignmentService = require("../services/assignment.service");

const { ORDER_STATUS } = require("../config/constants");

const router = express.Router();

/**
 * ==================================================
 * PLACE ORDER (USER)
 * ==================================================
 * POST /api/order
 */
router.post(
  "/",
  auth,
  role("USER"),
  async (req, res) => {
    try {
      const { restaurantId, items, address, location } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No items in order",
        });
      }

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant || !restaurant.isOpen) {
        return res.status(400).json({
          success: false,
          message: "Restaurant not available",
        });
      }

      // Fetch menu items securely
      const menuItems = await MenuItem.find({
        _id: { $in: items.map(i => i.itemId) },
        restaurantId,
      });

      if (menuItems.length !== items.length) {
        return res.status(400).json({
          success: false,
          message: "Invalid menu items",
        });
      }

      // Backend price calculation
      const pricing = await pricingService.calculate({
        restaurant,
        menuItems,
        items,
        userLocation: location,
      });

      const order = await Order.create({
        userId: req.user.id,
        restaurantId,
        items: pricing.items,
        pricing,
        deliveryAddress: address,
        deliveryLocation: location,
        status: ORDER_STATUS.CREATED,
      });

      return res.status(201).json({
        success: true,
        order,
      });
    } catch (error) {
      console.error("PLACE ORDER ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to place order",
      });
    }
  }
);

/**
 * ==================================================
 * GET ORDER DETAILS (USER / RESTAURANT / DELIVERY / ADMIN)
 * ==================================================
 * GET /api/order/:orderId
 */
router.get(
  "/:orderId",
  auth,
  async (req, res) => {
    try {
      const order = await Order.findById(req.params.orderId)
        .populate("restaurantId", "name")
        .populate("deliveryPartnerId", "name mobile");

      if (!order || !order.canView(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      return res.json({
        success: true,
        order,
      });
    } catch (error) {
      console.error("GET ORDER ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch order",
      });
    }
  }
);

/**
 * ==================================================
 * RESTAURANT ACCEPT / REJECT
 * ==================================================
 * POST /api/order/:orderId/restaurant-action
 */
router.post(
  "/:orderId/restaurant-action",
  auth,
  role("RESTAURANT"),
  async (req, res) => {
    try {
      const { action } = req.body;

      const order = await Order.findById(req.params.orderId);
      if (!order || !order.canRestaurantAct(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: "Action not allowed",
        });
      }

      if (action === "ACCEPT") {
        order.status = ORDER_STATUS.ACCEPTED;
        await assignmentService.assignDeliveryPartner(order);
      } else if (action === "REJECT") {
        order.status = ORDER_STATUS.CANCELLED;
        order.cancelledBy = "RESTAURANT";
      }

      await order.save();

      return res.json({
        success: true,
        order,
      });
    } catch (error) {
      console.error("RESTAURANT ACTION ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update order",
      });
    }
  }
);

/**
 * ==================================================
 * DELIVERY STATUS UPDATE
 * ==================================================
 * POST /api/order/:orderId/delivery-status
 */
router.post(
  "/:orderId/delivery-status",
  auth,
  role("DELIVERY"),
  async (req, res) => {
    try {
      const { status } = req.body;

      const order = await Order.findById(req.params.orderId);
      if (!order || !order.canDeliveryUpdate(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      order.status = status;
      await order.save();

      return res.json({
        success: true,
        order,
      });
    } catch (error) {
      console.error("DELIVERY UPDATE ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update delivery status",
      });
    }
  }
);

/**
 * ==================================================
 * USER CANCEL ORDER
 * ==================================================
 * POST /api/order/:orderId/cancel
 */
router.post(
  "/:orderId/cancel",
  auth,
  role("USER"),
  async (req, res) => {
    try {
      const order = await Order.findOne({
        _id: req.params.orderId,
        userId: req.user.id,
      });

      if (!order || !order.canUserCancel()) {
        return res.status(400).json({
          success: false,
          message: "Order cannot be cancelled",
        });
      }

      order.status = ORDER_STATUS.CANCELLED;
      order.cancelledBy = "USER";
      await order.save();

      return res.json({
        success: true,
        message: "Order cancelled",
      });
    } catch (error) {
      console.error("USER CANCEL ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to cancel order",
      });
    }
  }
);

module.exports = router;
