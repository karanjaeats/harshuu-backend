/**
 * HARSHUU Backend
 * Invoice Utility (Production Grade)
 *
 * Handles:
 * - GST calculation
 * - Platform commission
 * - Delivery fee
 * - Itemized invoice
 * - Refund-safe totals
 */

const GST_RATE = 0.05; // 5% GST (India food delivery standard)

/**
 * ===============================
 * ROUND TO 2 DECIMALS (SAFE)
 * ===============================
 */
function round(value) {
  return Number(value.toFixed(2));
}

/**
 * ===============================
 * GENERATE INVOICE
 * ===============================
 * @param {Object} params
 * @returns {Object} invoice
 */
exports.generateInvoice = ({
  orderId,
  userId,
  restaurantId,
  items, // [{ name, price, quantity }]
  deliveryFee,
  platformCommissionPercent,
  surgeFee = 0,
  paymentMethod,
}) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Invoice items missing");
  }

  /**
   * -------------------------------
   * ITEM TOTAL
   * -------------------------------
   */
  const itemTotal = round(
    items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
  );

  /**
   * -------------------------------
   * COMMISSION
   * -------------------------------
   */
  const platformCommission = round(
    (itemTotal * platformCommissionPercent) / 100
  );

  /**
   * -------------------------------
   * GST CALCULATION
   * GST applied on:
   * - platform commission
   * - delivery fee
   * -------------------------------
   */
  const gstAmount = round(
    (platformCommission + deliveryFee) * GST_RATE
  );

  /**
   * -------------------------------
   * FINAL PAYABLE
   * -------------------------------
   */
  const grandTotal = round(
    itemTotal +
      deliveryFee +
      surgeFee +
      gstAmount
  );

  /**
   * -------------------------------
   * RESTAURANT PAYOUT
   * -------------------------------
   */
  const restaurantPayout = round(
    itemTotal - platformCommission
  );

  /**
   * -------------------------------
   * INVOICE OBJECT
   * -------------------------------
   */
  return {
    invoiceNumber: `HARSHUU-${Date.now()}-${orderId}`,
    orderId,
    userId,
    restaurantId,

    breakdown: {
      itemTotal,
      deliveryFee,
      surgeFee,
      platformCommission,
      gstAmount,
    },

    totals: {
      payableAmount: grandTotal,
      restaurantPayout,
    },

    meta: {
      paymentMethod,
      gstRate: GST_RATE,
      currency: "INR",
      generatedAt: new Date(),
    },
  };
};
