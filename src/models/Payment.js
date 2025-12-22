const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  razorpayOrderId: String,
  paymentId: String,
  amount: Number,
  method: String,
  status: { type: String, default: "CREATED" }
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
