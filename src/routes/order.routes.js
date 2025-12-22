const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const Order = require("../models/Order");

const router = express.Router();

router.post("/create",
  auth,
  role("USER"),
  async (req, res) => {
    const order = await Order.create({
      userId: req.user.id,
      ...req.body
    });
    res.json({ success: true, order });
  }
);

router.post("/status",
  auth,
  async (req, res) => {
    const { orderId, status } = req.body;
    await Order.findByIdAndUpdate(orderId, { status });
    res.json({ success: true });
  }
);

module.exports = router;
