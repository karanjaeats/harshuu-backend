const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const Menu = require("../models/Menu");

const router = express.Router();

router.post("/add",
  auth,
  role("RESTAURANT"),
  async (req, res) => {
    const item = await Menu.create(req.body);
    res.json({ success: true, item });
  }
);

router.get("/:restaurantId", async (req, res) => {
  const menu = await Menu.find({ restaurantId: req.params.restaurantId });
  res.json({ success: true, menu });
});

module.exports = router;
