const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const DeliveryPartner = require("../models/DeliveryPartner");

const router = express.Router();

router.post("/online",
  auth,
  role("DELIVERY"),
  async (req, res) => {
    await DeliveryPartner.findOneAndUpdate(
      { userId: req.user.id },
      { isOnline: true }
    );
    res.json({ success: true });
  }
);

module.exports = router;
