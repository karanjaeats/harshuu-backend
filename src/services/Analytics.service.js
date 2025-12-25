/**
 * HARSHUU Backend
 * Analytics Service (Production Grade)
 */

const Order = require("../models/order");
const Payment = require("../models/payment");
const Restaurant = require("../models/restaurant");
const DeliveryPartner = require("../models/deliverypartner");

/**
 * ===============================
 * PLATFORM LEVEL ANALYTICS (ADMIN)
 * ===============================
 */
exports.getPlatformAnalytics = async () => {
  const totalOrders = await Order.countDocuments();
  const completedOrders = await Order.countDocuments({
    status: "COMPLETED",
  });
  const cancelledOrders = await Order.countDocuments({
    status: "CANCELLED",
  });

  const revenueAgg = await Payment.aggregate([
    { $match: { status: "PAID" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const revenue = revenueAgg[0]?.total || 0;

  const activeRestaurants = await Restaurant.countDocuments({
    isApproved: true,
  });

  const activeDeliveryPartners = await DeliveryPartner.countDocuments({
    isApproved: true,
  });

  return {
    totalOrders,
    completedOrders,
    cancelledOrders,
    revenue,
    activeRestaurants,
    activeDeliveryPartners,
  };
};

/**
 * ===============================
 * RESTAURANT ANALYTICS
 * ===============================
 */
exports.getRestaurantAnalytics = async (restaurantId) => {
  const orders = await Order.find({ restaurantId });

  let totalRevenue = 0;
  let completed = 0;
  let cancelled = 0;

  for (const order of orders) {
    if (order.status === "COMPLETED") {
      completed++;
      totalRevenue += order.totalAmount;
    }
    if (order.status === "CANCELLED") {
      cancelled++;
    }
  }

  return {
    totalOrders: orders.length,
    completedOrders: completed,
    cancelledOrders: cancelled,
    totalRevenue,
  };
};

/**
 * ===============================
 * DELIVERY PARTNER ANALYTICS
 * ===============================
 */
exports.getDeliveryPartnerAnalytics = async (partnerId) => {
  const orders = await Order.find({
    deliveryPartnerId: partnerId,
    status: "COMPLETED",
  });

  let totalEarnings = 0;
  let totalDeliveries = orders.length;

  for (const order of orders) {
    totalEarnings += order.deliveryFee || 0;
  }

  return {
    totalDeliveries,
    totalEarnings,
  };
};

/**
 * ===============================
 * DAILY ORDER HEATMAP
 * (For admin dashboard / insights)
 * ===============================
 */
exports.getDailyOrderHeatmap = async () => {
  const heatmap = await Order.aggregate([
    {
      $group: {
        _id: {
          hour: { $hour: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.hour": 1 } },
  ]);

  return heatmap.map((h) => ({
    hour: h._id.hour,
    orders: h.count,
  }));
};
