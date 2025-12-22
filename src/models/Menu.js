const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
  category: String,
  name: String,
  price: Number,
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Menu", menuSchema);
