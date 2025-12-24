/**
 * HARSHUU Backend
 * Notification Service (Production Grade)
 *
 * Supports:
 * - In-app notifications
 * - SMS (pluggable provider)
 * - WhatsApp (pluggable provider)
 */

const User = require("../models/User");
const Order = require("../models/Order");

/**
 * ===============================
 * IN-APP NOTIFICATION
 * ===============================
 */
exports.sendInAppNotification = async ({
  userId,
  role,
  title,
  message,
  meta = {},
}) => {
  await User.findByIdAndUpdate(userId, {
    $push: {
      notifications: {
        title,
        message,
        meta,
        role,
        isRead: false,
        createdAt: new Date(),
      },
    },
  });

  return true;
};

/**
 * ===============================
 * SMS NOTIFICATION (PLUGGABLE)
 * ===============================
 * Integrate:
 * - Twilio
 * - MSG91
 * - Fast2SMS
 * - AWS SNS
 */
exports.sendSMS = async ({ mobile, message }) => {
  if (!mobile || !message) return false;

  // 🔌 PROVIDER INTEGRATION POINT
  // Example:
  // await smsProvider.send({ to: mobile, text: message });

  console.log(`📩 SMS → ${mobile}: ${message}`);
  return true;
};

/**
 * ===============================
 * WHATSAPP NOTIFICATION (PLUGGABLE)
 * ===============================
 * Integrate:
 * - WhatsApp Cloud API
 * - Gupshup
 * - Interakt
 */
exports.sendWhatsApp = async ({ mobile, message }) => {
  if (!mobile || !message) return false;

  // 🔌 PROVIDER INTEGRATION POINT
  console.log(`💬 WhatsApp → ${mobile}: ${message}`);
  return true;
};

/**
 * ===============================
 * ORDER STATUS NOTIFICATIONS
 * ===============================
 */
exports.notifyOrderStatusChange = async (orderId, status) => {
  const order = await Order.findById(orderId)
    .populate("userId")
    .populate("restaurantId")
    .populate("deliveryPartnerId");

  if (!order) return;

  const userMessage = `Your order #${order._id} is now ${status}`;
  const restaurantMessage = `Order #${order._id} status updated to ${status}`;
  const deliveryMessage = `Order #${order._id} status: ${status}`;

  // USER
  if (order.userId) {
    await exports.sendInAppNotification({
      userId: order.userId._id,
      role: "USER",
      title: "Order Update",
      message: userMessage,
      meta: { orderId },
    });

    await exports.sendSMS({
      mobile: order.userId.mobile,
      message: userMessage,
    });
  }

  // RESTAURANT
  if (order.restaurantId) {
    await exports.sendInAppNotification({
      userId: order.restaurantId.ownerId,
      role: "RESTAURANT",
      title: "Order Update",
      message: restaurantMessage,
      meta: { orderId },
    });
  }

  // DELIVERY PARTNER
  if (order.deliveryPartnerId) {
    await exports.sendInAppNotification({
      userId: order.deliveryPartnerId._id,
      role: "DELIVERY",
      title: "Delivery Update",
      message: deliveryMessage,
      meta: { orderId },
    });
  }
};

/**
 * ===============================
 * OTP NOTIFICATION
 * ===============================
 */
exports.sendOTP = async ({ mobile, otp }) => {
  const message = `Your HARSHUU OTP is ${otp}. Valid for 5 minutes.`;
  await exports.sendSMS({ mobile, message });
};

/**
 * ===============================
 * ADMIN ALERT
 * ===============================
 */
exports.notifyAdmin = async ({ title, message }) => {
  const admins = await User.find({ role: "ADMIN" });

  for (const admin of admins) {
    await exports.sendInAppNotification({
      userId: admin._id,
      role: "ADMIN",
      title,
      message,
    });
  }
};
