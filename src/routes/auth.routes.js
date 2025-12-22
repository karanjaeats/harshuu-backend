const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const rateLimit = require("../middlewares/rateLimit.middleware");

const router = express.Router();

router.post("/login", rateLimit, async (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({ success: false, message: "Mobile required" });
  }

  let user = await User.findOne({ mobile });
  if (!user) user = await User.create({ mobile });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ success: true, token, role: user.role });
});

module.exports = router;
