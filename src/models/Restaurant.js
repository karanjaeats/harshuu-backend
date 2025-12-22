const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  address: String,
  location: {
    lat: Number,
    lng: Number
  },
  deliveryRadius: { type: Number, default: 5 }, // km
  isOpen: { type: Boolean, default: false },
  commissionPercent: { type: Number, default: 20 },
  approved: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Restaurant", restaurantSchema);
