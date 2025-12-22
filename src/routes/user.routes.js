const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const router = express.Router();

router.get("/profile",
  auth,
  role("USER"),
  (req, res) => {
    res.json({ success: true, user: req.user });
  }
);

module.exports = router;
