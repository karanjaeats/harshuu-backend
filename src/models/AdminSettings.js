const mongoose = require("mongoose");

const adminSettingsSchema = new mongoose.Schema({
  minOrderValue: { type: Number, default: 100 },
  baseDeliveryFee: { type: Number, default: 30 },
  surgeMultiplier: { type: Number, default: 1 }
});

module.exports = mongoose.model("AdminSettings", adminSettingsSchema);
