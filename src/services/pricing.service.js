/**
 * HARSHUU Backend
 * Pricing Service
 * Production-grade (Zomato / Swiggy style)
 */

const AdminSettings = require("../models/AdminSettings");
const calculateDistance = require("../utils/distance");

/**
 * ======================================
 * CALCULATE ORDER PRICING
 * ======================================
 */
exports.calculateOrderPricing = async ({
  restaurant,
  itemTotal,
  userLocation,
}) => {
  /**
   * Load platform settings
   */
  const settings =
    (await AdminSettings.findOne()) ||
    (await AdminSettings.create({}));

  /**
   * Minimum order value check
   */
  if (itemTotal < settings.minimumOrderValue) {
    return {
      allowed: false,
      reason: `Minimum order value is ₹${settings.minimumOrderValue}`,
    };
  }

  /**
   * Distance calculation (KM)
   */
  const distanceKm = calculateDistance(
    restaurant.location.lat,
    restaurant.location.lng,
    userLocation.lat,
    userLocation.lng
  );

  /**
   * Delivery radius check
   */
  if (distanceKm > restaurant.deliveryRadius) {
    return {
      allowed: false,
      reason: "Delivery address is outside restaurant service area",
    };
  }

  /**
   * Delivery fee calculation
   */
  let deliveryFee =
    settings.baseDeliveryFee +
    distanceKm * settings.perKmDeliveryFee;

  /**
   * Surge pricing
   */
  let surgeMultiplier = 1;
  if (settings.isSurgeActive) {
    surgeMultiplier = settings.surgeMultiplier;
    deliveryFee *= surgeMultiplier;
  }

  /**
   * Platform commission
   */
  const commission =
    (itemTotal * settings.commissionPercentage) / 100;

  /**
   * Tax (GST)
   */
  const gst =
    ((itemTotal + deliveryFee) * settings.gstPercentage) / 100;

  /**
   * Final amount
   */
  const totalAmount =
    itemTotal + deliveryFee + gst;

  return {
    allowed: true,

    breakdown: {
      itemTotal: round(itemTotal),
      deliveryFee: round(deliveryFee),
      gst: round(gst),
      surgeMultiplier,
      commission: round(commission),
      distanceKm: round(distanceKm),
    },

    totalAmount: round(totalAmount),
  };
};

/**
 * ======================================
 * ROUND TO 2 DECIMALS
 * ======================================
 */
const round = (value) => {
  return Math.round(value * 100) / 100;
};    surgeFee,
    total: subtotal + deliveryFee + surgeFee
  };
};
