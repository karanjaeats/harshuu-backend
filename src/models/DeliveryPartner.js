const mongoose = require("mongoose");

const deliveryPartnerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isOnline: { type: Boolean, default: false },
  approved: { type: Boolean, default: false },
  totalEarnings: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("DeliveryPartner", deliveryPartnerSchema);
