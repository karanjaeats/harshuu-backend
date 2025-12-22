const express = require("express");
const auth = require("../middlewares/auth.middleware");
const Payment = require("../models/Payment");

const router = express.Router();

router.post("/create",
  auth,
  async (req, res) => {
    const payment = await Payment.create(req.body);
    res.json({ success: true, payment });
  }
);

module.exports = router;
