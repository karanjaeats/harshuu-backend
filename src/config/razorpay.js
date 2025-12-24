/**
 * HARSHUU Backend
 * Razorpay Configuration
 * Production-grade (Zomato / Swiggy style)
 */

const Razorpay = require("razorpay");

/**
 * ENV VALIDATION (CRITICAL FOR PAYMENTS)
 */
if (!process.env.RAZORPAY_KEY_ID) {
  console.error("❌ RAZORPAY_KEY_ID missing in environment variables");
  process.exit(1);
}

if (!process.env.RAZORPAY_KEY_SECRET) {
  console.error("❌ RAZORPAY_KEY_SECRET missing in environment variables");
  process.exit(1);
}

/**
 * CREATE RAZORPAY INSTANCE
 */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * PAYMENT NOTES TEMPLATE
 * (used in orders, refunds, reconciliation)
 */
const buildPaymentNotes = ({
  orderId,
  userId,
  restaurantId,
  deliveryPartnerId,
}) => ({
  platform: "HARSHUU",
  orderId: String(orderId),
  userId: String(userId),
  restaurantId: String(restaurantId),
  deliveryPartnerId: deliveryPartnerId
    ? String(deliveryPartnerId)
    : "UNASSIGNED",
});

/**
 * CREATE RAZORPAY ORDER (SERVER-SIDE ONLY)
 */
const createRazorpayOrder = async ({
  amount, // in paise
  currency = "INR",
  receipt,
  notes,
}) => {
  try {
    return await razorpay.orders.create({
      amount,
      currency,
      receipt,
      notes,
      payment_capture: 1, // auto-capture (industry standard)
    });
  } catch (error) {
    console.error("❌ Razorpay order creation failed:", error);
    throw new Error("PAYMENT_ORDER_CREATION_FAILED");
  }
};

/**
 * VERIFY PAYMENT SIGNATURE
 * (Used in webhook / payment verification)
 */
const verifyPaymentSignature = ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  const crypto = require("crypto");

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  return generatedSignature === razorpay_signature;
};

module.exports = {
  razorpay,
  createRazorpayOrder,
  verifyPaymentSignature,
  buildPaymentNotes,
};
