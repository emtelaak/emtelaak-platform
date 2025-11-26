/**
 * Test fixtures for payment processing tests
 */

export const mockStripePaymentIntent = {
  id: 'pi_test_123456789',
  object: 'payment_intent',
  amount: 10000, // $100.00
  currency: 'usd',
  status: 'succeeded',
  client_secret: 'pi_test_123456789_secret_test123',
  payment_method: 'pm_test_card',
  created: Math.floor(Date.now() / 1000),
};

export const mockStripePaymentIntentFailed = {
  ...mockStripePaymentIntent,
  id: 'pi_test_failed',
  status: 'failed',
  last_payment_error: {
    code: 'card_declined',
    message: 'Your card was declined',
  },
};

export const mockStripeRefund = {
  id: 're_test_123456789',
  object: 'refund',
  amount: 10000,
  currency: 'usd',
  payment_intent: 'pi_test_123456789',
  status: 'succeeded',
  created: Math.floor(Date.now() / 1000),
};

export const mockStripeWebhookEvent = {
  id: 'evt_test_123',
  object: 'event',
  type: 'payment_intent.succeeded',
  data: {
    object: mockStripePaymentIntent,
  },
  created: Math.floor(Date.now() / 1000),
};

export const mockWalletDeposit = {
  userId: 1,
  type: 'deposit' as const,
  amount: 50000, // EGP 500.00 in cents
  status: 'pending' as const,
  paymentMethod: 'bank_transfer' as const,
  receiptUrl: 'https://example.com/receipt.pdf',
};

export const mockWalletWithdrawal = {
  userId: 1,
  type: 'withdrawal' as const,
  amount: 20000, // EGP 200.00 in cents
  status: 'pending' as const,
  paymentMethod: 'bank_transfer' as const,
};

export const mockInvestmentPayment = {
  userId: 1,
  propertyId: 1,
  shares: 10,
  sharePrice: 10000, // EGP 100.00 per share
  totalAmount: 100000, // EGP 1,000.00
  platformFee: 2000, // 2% = EGP 20.00
  processingFee: 500, // EGP 5.00
  status: 'pending' as const,
};

export const mockProperty = {
  id: 1,
  name: 'Test Property',
  nameAr: 'عقار تجريبي',
  description: 'Test property for investment',
  propertyType: 'residential' as const,
  investmentType: 'buy_to_let' as const,
  status: 'available' as const,
  totalValue: 1000000, // EGP 10,000.00
  sharePrice: 10000, // EGP 100.00 per share
  totalShares: 100,
  availableShares: 50,
  minimumInvestment: 10000,
  expectedReturn: 12,
  location: 'Cairo, Egypt',
};

export const mockUser = {
  id: 1,
  openId: 'test_user_123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user' as const,
  status: 'active' as const,
  walletBalance: 100000, // EGP 1,000.00
};

export const mockInsufficientBalanceUser = {
  ...mockUser,
  id: 2,
  openId: 'test_user_poor',
  walletBalance: 1000, // EGP 10.00 - insufficient
};

export const mockDistributionPayout = {
  userId: 1,
  investmentTransactionId: 1,
  amount: 5000, // EGP 50.00
  distributionType: 'rental_income' as const,
  distributionDate: new Date(),
  status: 'pending' as const,
};
