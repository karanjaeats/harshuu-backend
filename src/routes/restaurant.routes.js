const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const Restaurant = require("../models/Restaurant");

const router = express.Router();

router.post("/register",
  auth,
  role("RESTAURANT"),
  async (req, res) => {
    const restaurant = await Restaurant.create({
      ownerId: req.user.id,
      ...req.body
    });
    res.json({ success: true, restaurant });
  }
);

router.patch("/open-close",
  auth,
  role("RESTAURANT"),
  async (req, res) => {
    await Restaurant.findOneAndUpdate(
      { ownerId: req.user.id },
      { isOpen: req.body.isOpen }
    );
    res.json({ success: true });
  }
);

module.exports = router;
