/**
 * Payment Configuration
 * One-time ₹499 Lifetime Premium Setup
 */

module.exports = {
  planName: 'TushuDiary Lifetime Premium',
  amount: 499,
  currency: 'INR',
  currencySymbol: '₹',
  billingType: 'One-Time Lifetime Access',
  // Configurable UPI ID (can also be overridden via environment variable)
  defaultUpiId: process.env.ADMIN_UPI_ID || 'tushpendrakumar@okaxis',
  merchantName: 'CodeByTushu',
  supportEmail: 'tushpendrakumar@gmail.com',
};
