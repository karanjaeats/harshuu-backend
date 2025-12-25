/**
 * HARSHUU Backend
 * Pricing Service
 * Production-grade (Zomato / Swiggy style)
 */

const AdminSettings = require("../models/adminSettings");
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
   * Base delivery fee
   */
  const baseDeliveryFee =
    settings.baseDeliveryFee +
    distanceKm * settings.perKmDeliveryFee;

  /**
   * Surge pricing
   */
  let surgeMultiplier = 1;
  let surgeFee = 0;

  if (settings.isSurgeActive) {
    surgeMultiplier = settings.surgeMultiplier;
    surgeFee = baseDeliveryFee * (surgeMultiplier - 1);
  }

  /**
   * Final delivery fee
   */
  const deliveryFee = baseDeliveryFee + surgeFee;

  /**
   * Platform commission (for reporting)
   */
  const commission =
    (itemTotal * settings.commissionPercentage) / 100;

  /**
   * Tax (GST)
   */
  const gst =
    ((itemTotal + deliveryFee) * settings.gstPercentage) / 100;

  /**
   * Final payable amount
   */
  const totalAmount =
    itemTotal + deliveryFee + gst;

  return {
    allowed: true,

    breakdown: {
      itemTotal: round(itemTotal),
      baseDeliveryFee: round(baseDeliveryFee),
      surgeFee: round(surgeFee),
      deliveryFee: round(deliveryFee),
      gst: round(gst),
      commission: round(commission),
      surgeMultiplier,
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
};