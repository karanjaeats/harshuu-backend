const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
  deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryPartner" },

  items: [{
    menuId: { type: mongoose.Schema.Types.ObjectId, ref: "Menu" },
    name: String,
    price: Number,
    qty: Number
  }],

  subtotal: Number,
  deliveryFee: Number,
  surgeFee: Number,
  totalAmount: Number,

  status: {
    type: String,
    enum: [
      "CREATED", "PAID", "ACCEPTED",
      "PREPARING", "PICKED",
      "DELIVERED", "COMPLETED", "CANCELLED"
    ],
    default: "CREATED"
  },

  paymentStatus: { type: String, default: "PENDING" },
  cancellationReason: String

}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
