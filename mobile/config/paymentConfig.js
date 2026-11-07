/**
 * TushuDiary Payment & Lifetime Premium Configuration
 * One-Time Payment: ₹499 for Lifetime VIP Access
 */

export const PAYMENT_CONFIG = {
  planName: 'TushuDiary Lifetime Premium',
  amount: 499,
  currency: 'INR',
  currencySymbol: '₹',
  billingType: 'One-Time Payment (Lifetime Access)',
  // Primary UPI ID provided for receiving payment (can be changed anytime)
  defaultUpiId: 'tushpendrakumar@okaxis',
  merchantName: 'CodeByTushu',
  supportEmail: 'tushpendrakumar@gmail.com',
  features: [
    { 
      id: 'wallet', 
      title: 'Premium Private Wallet', 
      desc: 'AES-256 Encrypted luxury wallet with custom categories, audit log & 30-day recycle bin' 
    },
    { 
      id: 'app_lock', 
      title: 'Biometric App Lock', 
      desc: 'Fingerprint, Face Unlock & PIN security protection for your private records' 
    },
    { 
      id: 'backup_sync', 
      title: 'Advanced Cloud Backup & Sync', 
      desc: 'Seamless multi-device synchronization & permanent cloud data restore' 
    },
    { 
      id: 'analytics', 
      title: 'Financial Analytics & Smart Insights', 
      desc: 'Interactive cashflow charts, monthly expense breakdowns & AI saving suggestions' 
    },
    { 
      id: 'reports', 
      title: 'PDF & Excel Export Reports', 
      desc: '1-click financial statements and tax expense reports ready for download' 
    },
    { 
      id: 'storage', 
      title: 'Unlimited High-Res Storage', 
      desc: 'Store unlimited receipts, bills, documents & media with zero compression' 
    },
    { 
      id: 'reminders', 
      title: 'Smart Automated Reminders', 
      desc: 'Recurring push alerts for bills, EMIs, medications & family routines' 
    },
    { 
      id: 'lifetime', 
      title: 'Lifetime Updates & Support', 
      desc: 'All future premium features & app updates included forever with zero recurring fees' 
    },
  ]
};
