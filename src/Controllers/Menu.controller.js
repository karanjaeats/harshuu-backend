/**
 * HARSHUU Backend
 * Menu Controller
 * Production-grade (Zomato / Swiggy style)
 */

const Restaurant = require("../models/Restaurant");
const MenuCategory = require("../models/MenuCategory");
const MenuItem = require("../models/MenuItem");

/**
 * ======================================
 * GET PUBLIC MENU (USER SIDE)
 * ======================================
 * GET /api/menu/:restaurantId
 * Role: PUBLIC / USER
 */
exports.getRestaurantMenu = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      isApproved: true,
      isOpen: true,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not available",
      });
    }

    const categories = await MenuCategory.find({
      restaurantId,
      isActive: true,
    }).sort({ order: 1 });

    const categoryIds = categories.map((c) => c._id);

    const items = await MenuItem.find({
      restaurantId,
      categoryId: { $in: categoryIds },
      isAvailable: true,
    }).sort({ order: 1 });

    const menu = categories.map((category) => ({
      id: category._id,
      name: category.name,
      items: items.filter(
        (item) => String(item.categoryId) === String(category._id)
      ),
    }));

    return res.json({
      success: true,
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        cuisine: restaurant.cuisine,
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
};

/**
 * ======================================
 * GET RESTAURANT MENU (OWNER PANEL)
 * ======================================
 * GET /api/menu/restaurant/me
 * Role: RESTAURANT
 */
exports.getMyMenu = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const categories = await MenuCategory.find({
      restaurantId: restaurant._id,
    }).sort({ order: 1 });

    const items = await MenuItem.find({
      restaurantId: restaurant._id,
    }).sort({ order: 1 });

    return res.json({
      success: true,
      categories,
      items,
    });
  } catch (error) {
    console.error("GET MY MENU ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch menu",
    });
  }
};

/**
 * ======================================
 * CREATE MENU CATEGORY
 * ======================================
 * POST /api/menu/category
 * Role: RESTAURANT
 */
exports.createCategory = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      ownerId: req.user.id,
      isApproved: true,
    });

    if (!restaurant) {
      return res.status(403).json({
        success: false,
        message: "Restaurant not approved",
      });
    }

    const category = await MenuCategory.create({
      restaurantId: restaurant._id,
      name: req.body.name,
      order: req.body.order || 0,
      isActive: true,
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
 * ======================================
 * UPDATE MENU CATEGORY
 * ======================================
 * PATCH /api/menu/category/:id
 * Role: RESTAURANT
 */
exports.updateCategory = async (req, res) => {
  try {
    const updates = {};
    ["name", "order", "isActive"].forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const category = await MenuCategory.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    return res.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("UPDATE CATEGORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update category",
    });
  }
};

/**
 * ======================================
 * ADD MENU ITEM
 * ======================================
 * POST /api/menu/item
 * Role: RESTAURANT
 */
exports.createMenuItem = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      ownerId: req.user.id,
      isApproved: true,
    });

    if (!restaurant) {
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
      isVeg: req.body.isVeg,
      isAvailable: true,
      order: req.body.order || 0,
    });

    return res.status(201).json({
      success: true,
      item,
    });
  } catch (error) {
    console.error("ADD ITEM ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add menu item",
    });
  }
};

/**
 * ======================================
 * UPDATE MENU ITEM
 * ======================================
 * PATCH /api/menu/item/:id
 * Role: RESTAURANT
 */
exports.updateMenuItem = async (req, res) => {
  try {
    const updates = {};
    [
      "name",
      "price",
      "isVeg",
      "isAvailable",
      "order",
    ].forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    return res.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error("UPDATE ITEM ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update item",
    });
  }
};

/**
 * ======================================
 * DELETE MENU ITEM
 * ======================================
 * DELETE /api/menu/item/:id
 * Role: RESTAURANT
 */
exports.deleteMenuItem = async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: "Menu item deleted",
    });
  } catch (error) {
    console.error("DELETE ITEM ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete item",
    });
  }
};
