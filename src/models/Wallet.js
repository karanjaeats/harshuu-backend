const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  balance: { type: Number, default: 0 },
  transactions: [{
    amount: Number,
    type: { type: String, enum: ["CREDIT", "DEBIT"] },
    note: String,
    date: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model("Wallet", walletSchema);
