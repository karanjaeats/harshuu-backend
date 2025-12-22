const DeliveryPartner = require("../models/DeliveryPartner");

exports.assignDeliveryPartner = async () => {
  const partner = await DeliveryPartner.findOne({
    isOnline: true,
    approved: true
  });

  if (!partner) return null;

  return partner._id;
};
