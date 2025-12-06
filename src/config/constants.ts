// NFT Marketplace Constants

// Default currency
export const DEFAULT_CURRENCY = 'USDT';

// Transaction fee percentage (2%)
export const WITHDRAWAL_FEE_PERCENTAGE = 0.02;

// Referral commission rate (10%)
export const REFERRAL_COMMISSION_RATE = 0.1;

// Order term options with ROR (Rate of Return)
export const ORDER_TERM_OPTIONS = {
  7: 0.5,   // 0.5% for 7 days
  14: 1.0,  // 1.0% for 14 days
  30: 2.5,  // 2.5% for 30 days
  60: 5.0,  // 5.0% for 60 days
  90: 8.0,  // 8.0% for 90 days
};

// Loan term options with interest rates
export const LOAN_TERM_OPTIONS = {
  7: 1.0,   // 1.0% for 7 days
  14: 1.5,  // 1.5% for 14 days
  30: 2.5,  // 2.5% for 30 days
  60: 4.0,  // 4.0% for 60 days
  90: 6.0,  // 6.0% for 90 days
};
