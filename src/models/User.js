const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String },
  mobile: { type: String, required: true, unique: true },
  role: {
    type: String,
    enum: ["USER", "RESTAURANT", "DELIVERY", "ADMIN"],
    default: "USER"
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
