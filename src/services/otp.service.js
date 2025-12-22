const otpStore = new Map(); // TEMP (Redis later)

exports.sendOTP = (mobile) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(mobile, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

  console.log(`OTP for ${mobile}: ${otp}`); // SMS integration later
  return true;
};

exports.verifyOTP = (mobile, otp) => {
  const record = otpStore.get(mobile);

  if (!record) return false;
  if (Date.now() > record.expiresAt) return false;

  return record.otp === otp;
};
