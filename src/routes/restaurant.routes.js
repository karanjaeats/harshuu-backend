const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const Restaurant = require("../models/Restaurant");

const router = express.Router();

/**
 * RESTAURANT REGISTER (Only RESTAURANT role)
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
          message: "Restaurant already registered"
        });
      }

      const restaurant = await Restaurant.create({
        ownerId: req.user.id,
        name: req.body.name,
        address: req.body.address,
        location: req.body.location, // { lat, lng }
        deliveryRadius: req.body.deliveryRadius || 5
      });

      res.json({
        success: true,
        restaurant
      });
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
