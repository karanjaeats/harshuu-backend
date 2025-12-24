/**
 * HARSHUU Backend
 * Menu Routes
 * Roles:
 * - PUBLIC (users can view menu)
 * - RESTAURANT (manage menu)
 */

const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const Restaurant = require("../models/Restaurant");
const MenuCategory = require("../models/MenuCategory");
const MenuItem = require("../models/MenuItem");

const router = express.Router();

/**
 * =====================================
 * GET MENU BY RESTAURANT (PUBLIC)
 * =====================================
 * GET /api/menu/:restaurantId
 */
router.get("/:restaurantId", async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || !restaurant.isOpen) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not available",
      });
    }

    const categories = await MenuCategory.find({ restaurantId }).lean();

    const categoryIds = categories.map(c => c._id);

    const items = await MenuItem.find({
      restaurantId,
      categoryId: { $in: categoryIds },
      isAvailable: true,
    }).lean();

    const menu = categories.map(category => ({
      id: category._id,
      name: category.name,
      items: items.filter(
        item => item.categoryId.toString() === category._id.toString()
      ),
    }));

    return res.json({
      success: true,
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        isOpen: restaurant.isOpen,
      },
      menu,
    });
  } catch (error) {
    console.error("GET MENU ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch menu",
    });
  }
});

/**
 * =====================================
 * UPDATE MENU ITEM AVAILABILITY
 * =====================================
 * PATCH /api/menu/item/:itemId/availability
 * Role: RESTAURANT
 */
router.patch(
  "/item/:itemId/availability",
  auth,
  role("RESTAURANT"),
  async (req, res) => {
    try {
      const { isAvailable } = req.body;

      const item = await MenuItem.findById(req.params.itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Menu item not found",
        });
      }

      item.isAvailable = isAvailable;
      await item.save();

      return res.json({
        success: true,
        message: "Item availability updated",
      });
    } catch (error) {
      console.error("UPDATE ITEM AVAILABILITY ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update availability",
      });
    }
  }
);

/**
 * =====================================
 * UPDATE MENU ITEM PRICE / NAME
 * =====================================
 * PATCH /api/menu/item/:itemId
 * Role: RESTAURANT
 */
router.patch(
  "/item/:itemId",
  auth,
  role("RESTAURANT"),
  async (req, res) => {
    try {
      const updates = {};
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.price !== undefined) updates.price = req.body.price;

      const item = await MenuItem.findByIdAndUpdate(
        req.params.itemId,
        updates,
        { new: true }
      );

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Menu item not found",
        });
      }

      return res.json({
        success: true,
        item,
      });
    } catch (error) {
      console.error("UPDATE ITEM ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update menu item",
      });
    }
  }
);

/**
 * =====================================
 * DELETE MENU ITEM
 * =====================================
 * DELETE /api/menu/item/:itemId
 * Role: RESTAURANT
 */
router.delete(
  "/item/:itemId",
  auth,
  role("RESTAURANT"),
  async (req, res) => {
    try {
      const item = await MenuItem.findByIdAndDelete(req.params.itemId);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Menu item not found",
        });
      }

      return res.json({
        success: true,
        message: "Menu item deleted",
      });
    } catch (error) {
      console.error("DELETE ITEM ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete menu item",
      });
    }
  }
);

module.exports = router;
