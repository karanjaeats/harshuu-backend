const razorpay = require("../config/razorpay");
const Payment = require("../models/Payment");

exports.processRefund = async (paymentId, amount) => {
  await razorpay.payments.refund(paymentId, {
    amount: amount * 100
  });

  await Payment.findOneAndUpdate(
    { paymentId },
    { status: "REFUNDED" }
  );

  return true;
};
