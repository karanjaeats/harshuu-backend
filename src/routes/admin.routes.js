const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const Restaurant = require("../models/Restaurant");

const router = express.Router();

router.post("/approve-restaurant",
  auth,
  role("ADMIN"),
  async (req, res) => {
    await Restaurant.findByIdAndUpdate(
      req.body.restaurantId,
      { approved: true }
    );
    res.json({ success: true });
  }
);

module.exports = router;
