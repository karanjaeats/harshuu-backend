const razorpay = require("../config/razorpay");
const Payment = require("../models/Payment");

exports.createPaymentOrder = async (order) => {
  const razorpayOrder = await razorpay.orders.create({
    amount: order.totalAmount * 100,
    currency: "INR",
    receipt: `order_${order._id}`
  });

  await Payment.create({
    orderId: order._id,
    razorpayOrderId: razorpayOrder.id,
    amount: order.totalAmount,
    status: "CREATED"
  });

  return razorpayOrder;
};
