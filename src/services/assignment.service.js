/**
 * HARSHUU Backend
 * Delivery Assignment Service
 * Zomato / Swiggy style (production grade)
 */

const Order = require("../models/order");
const DeliveryPartner = require("../models/deliverypartner");
const Restaurant = require("../models/restaurant");
const { haversineDistance } = require("../utils/distance");

/**
 * CONFIG
 */
const MAX_ASSIGNMENT_RADIUS_KM = 6; // city based
const ASSIGNMENT_TIMEOUT_MS = 15000;

/**
 * ======================================
 * ASSIGN DELIVERY PARTNER
 * ======================================
 */
exports.assignDeliveryPartner = async (orderId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (!["PAID", "ACCEPTED"].includes(order.status)) {
    return null;
  }

  // Prevent double assignment
  if (order.deliveryPartnerId) {
    return order;
  }

  const restaurant = await Restaurant.findById(order.restaurantId);

  if (!restaurant || !restaurant.location) {
    throw new Error("Restaurant location missing");
  }

  /**
   * Fetch available delivery partners
   */
  const partners = await DeliveryPartner.find({
    isApproved: true,
    isOnline: true,
    isBusy: false,
    location: { $exists: true },
  });

  if (!partners.length) {
    return null;
  }

  /**
   * Calculate distance
   */
  const rankedPartners = partners
    .map((partner) => {
      const distance = haversineDistance(
        restaurant.location.coordinates[1],
        restaurant.location.coordinates[0],
        partner.location.coordinates[1],
        partner.location.coordinates[0]
      );

      return { partner, distance };
    })
    .filter((p) => p.distance <= MAX_ASSIGNMENT_RADIUS_KM)
    .sort((a, b) => a.distance - b.distance);

  if (!rankedPartners.length) {
    return null;
  }

  /**
   * Assign nearest available partner (atomic lock)
   */
  for (const entry of rankedPartners) {
    const updated = await DeliveryPartner.findOneAndUpdate(
      {
        _id: entry.partner._id,
        isBusy: false,
        isOnline: true,
      },
      { isBusy: true },
      { new: true }
    );

    if (!updated) continue;

    order.deliveryPartnerId = updated._id;
    order.status = "PICKUP_PENDING";
    order.assignedAt = new Date();
    await order.save();

    /**
     * Auto unassign if partner does not accept
     */
    setTimeout(async () => {
      const freshOrder = await Order.findById(order._id);
      if (
        freshOrder &&
        freshOrder.status === "PICKUP_PENDING" &&
        String(freshOrder.deliveryPartnerId) === String(updated._id)
      ) {
        freshOrder.deliveryPartnerId = null;
        freshOrder.status = "ACCEPTED";
        await freshOrder.save();

        await DeliveryPartner.findByIdAndUpdate(updated._id, {
          isBusy: false,
        });

        // retry assignment
        await exports.assignDeliveryPartner(order._id);
      }
    }, ASSIGNMENT_TIMEOUT_MS);

    return order;
  }

  return null;
};

/**
 * ======================================
 * DELIVERY PARTNER ACCEPT ORDER
 * ======================================
 */
exports.acceptDelivery = async (orderId, partnerId) => {
  const order = await Order.findOne({
    _id: orderId,
    deliveryPartnerId: partnerId,
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status !== "PICKUP_PENDING") {
    throw new Error("Order not assignable");
  }

  order.status = "PICKED";
  await order.save();

  return order;
};

/**
 * ======================================
 * DELIVERY PARTNER COMPLETE
 * ======================================
 */
exports.markDelivered = async (orderId, partnerId) => {
  const order = await Order.findOne({
    _id: orderId,
    deliveryPartnerId: partnerId,
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status !== "PICKED") {
    throw new Error("Order not picked");
  }

  order.status = "DELIVERED";
  await order.save();

  await DeliveryPartner.findByIdAndUpdate(partnerId, {
    isBusy: false,
  });

  return order;
};
