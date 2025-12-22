const AdminSettings = require("../models/AdminSettings");
const { getDistanceInKm } = require("../utils/distance");

exports.calculatePrice = async ({
  items,
  restaurantLocation,
  userLocation
}) => {
  const settings = await AdminSettings.findOne();

  const subtotal = items.reduce(
    (sum, i) => sum + i.price * i.qty, 0
  );

  if (subtotal < settings.minOrderValue) {
    throw new Error("Minimum order value not met");
  }

  const distance = getDistanceInKm(
    restaurantLocation.lat,
    restaurantLocation.lng,
    userLocation.lat,
    userLocation.lng
  );

  const deliveryFee =
    settings.baseDeliveryFee + distance * 5;

  const surgeFee =
    settings.surgeMultiplier > 1
      ? deliveryFee * (settings.surgeMultiplier - 1)
      : 0;

  return {
    subtotal,
    deliveryFee,
    surgeFee,
    total: subtotal + deliveryFee + surgeFee
  };
};
