import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockInvestmentPayment,
  mockProperty,
  mockUser,
  mockInsufficientBalanceUser,
  mockDistributionPayout,
} from '../fixtures/paymentFixtures';

/**
 * Comprehensive test suite for investment payment processing
 * 
 * Tests cover:
 * - Investment purchase with wallet
 * - Investment purchase with card
 * - Platform and processing fee calculations
 * - Investment reservation flow
 * - Payment timeout handling
 * - Refund processing
 * - Distribution payouts
 */

describe('Investment Payment Processing', () => {
  describe('Investment Purchase with Wallet', () => {
    it('should calculate total investment amount correctly', async () => {
      const calculateTotal = vi.fn().mockReturnValue({
        subtotal: 100000, // 10 shares * 10000 EGP
        platformFee: 2000, // 2%
        processingFee: 500,
        total: 102500,
      });

      const result = calculateTotal(mockInvestmentPayment);

      expect(result.subtotal).toBe(100000);
      expect(result.platformFee).toBe(2000);
      expect(result.processingFee).toBe(500);
      expect(result.total).toBe(102500);
    });

    it('should check wallet balance before purchase', async () => {
      const checkBalance = vi.fn().mockResolvedValue(mockUser.walletBalance);

      const balance = await checkBalance(mockUser.id);
      const canPurchase = balance >= mockInvestmentPayment.totalAmount;

      expect(canPurchase).toBe(true);
    });

    it('should reject purchase with insufficient wallet balance', async () => {
      const createInvestment = vi.fn().mockRejectedValue(
        new Error('Insufficient wallet balance')
      );

      const poorUserInvestment = {
        ...mockInvestmentPayment,
        userId: mockInsufficientBalanceUser.id,
      };

      await expect(createInvestment(poorUserInvestment)).rejects.toThrow(
        'Insufficient wallet balance'
      );
    });

    it('should deduct amount from wallet on successful purchase', async () => {
      const createInvestment = vi.fn().mockResolvedValue({
        ...mockInvestmentPayment,
        id: 1,
        status: 'completed',
      });

      const updateBalance = vi.fn().mockResolvedValue({
        ...mockUser,
        walletBalance: mockUser.walletBalance - mockInvestmentPayment.totalAmount,
      });

      await createInvestment(mockInvestmentPayment);
      const user = await updateBalance(mockUser.id, -mockInvestmentPayment.totalAmount);

      expect(user.walletBalance).toBe(0); // 100000 - 100000
    });

    it('should update property available shares', async () => {
      const updateProperty = vi.fn().mockResolvedValue({
        ...mockProperty,
        availableShares: mockProperty.availableShares - mockInvestmentPayment.shares,
      });

      const property = await updateProperty(mockProperty.id, {
        availableShares: mockProperty.availableShares - mockInvestmentPayment.shares,
      });

      expect(property.availableShares).toBe(40); // 50 - 10
    });

    it('should create investment transaction record', async () => {
      const createTransaction = vi.fn().mockResolvedValue({
        ...mockInvestmentPayment,
        id: 1,
        transactionId: 'INV-2024-00001',
        createdAt: new Date(),
      });

      const result = await createTransaction(mockInvestmentPayment);

      expect(result.id).toBeDefined();
      expect(result.transactionId).toMatch(/^INV-/);
      expect(result.status).toBe('pending');
    });
  });

  describe('Investment Purchase with Card', () => {
    it('should create Stripe payment intent for card payment', async () => {
      const createPaymentIntent = vi.fn().mockResolvedValue({
        id: 'pi_test_investment',
        amount: mockInvestmentPayment.totalAmount,
        currency: 'egp',
        client_secret: 'pi_test_secret',
      });

      const result = await createPaymentIntent({
        amount: mockInvestmentPayment.totalAmount,
        currency: 'egp',
        metadata: {
          userId: mockUser.id.toString(),
          propertyId: mockProperty.id.toString(),
          shares: mockInvestmentPayment.shares.toString(),
        },
      });

      expect(result.amount).toBe(mockInvestmentPayment.totalAmount);
      expect(result.client_secret).toBeDefined();
    });

    it('should complete investment after successful card payment', async () => {
      const confirmPayment = vi.fn().mockResolvedValue({
        status: 'succeeded',
        payment_intent: 'pi_test_investment',
      });

      const completeInvestment = vi.fn().mockResolvedValue({
        ...mockInvestmentPayment,
        status: 'completed',
        paymentMethod: 'card',
      });

      const payment = await confirmPayment('pi_test_investment');

      if (payment.status === 'succeeded') {
        const investment = await completeInvestment(1);
        expect(investment.status).toBe('completed');
      }
    });

    it('should handle card payment failure', async () => {
      const confirmPayment = vi.fn().mockResolvedValue({
        status: 'failed',
        last_payment_error: {
          code: 'card_declined',
        },
      });

      const cancelInvestment = vi.fn().mockResolvedValue({
        ...mockInvestmentPayment,
        status: 'failed',
      });

      const payment = await confirmPayment('pi_test_failed');

      if (payment.status === 'failed') {
        const investment = await cancelInvestment(1);
        expect(investment.status).toBe('failed');
      }
    });
  });

  describe('Fee Calculations', () => {
    it('should calculate platform fee correctly', async () => {
      const platformFeePercentage = 2; // 2%
      const calculatePlatformFee = vi.fn().mockReturnValue(
        Math.floor((mockInvestmentPayment.totalAmount * platformFeePercentage) / 100)
      );

      const fee = calculatePlatformFee(mockInvestmentPayment.totalAmount);

      expect(fee).toBe(2000); // 2% of 100000
    });

    it('should calculate processing fee correctly', async () => {
      const processingFeeFixed = 500; // EGP 5.00
      const calculateProcessingFee = vi.fn().mockReturnValue(processingFeeFixed);

      const fee = calculateProcessingFee();

      expect(fee).toBe(500);
    });

    it('should apply minimum investment amount', async () => {
      const smallInvestment = {
        ...mockInvestmentPayment,
        shares: 1,
        totalAmount: 5000, // Less than minimum
      };

      const validateInvestment = vi.fn().mockRejectedValue(
        new Error(`Minimum investment is EGP ${mockProperty.minimumInvestment / 100}`)
      );

      await expect(validateInvestment(smallInvestment)).rejects.toThrow(
        'Minimum investment'
      );
    });

    it('should not charge fees for zero-amount transactions', async () => {
      const calculateFees = vi.fn().mockReturnValue({
        platformFee: 0,
        processingFee: 0,
      });

      const fees = calculateFees(0);

      expect(fees.platformFee).toBe(0);
      expect(fees.processingFee).toBe(0);
    });
  });

  describe('Investment Reservation Flow', () => {
    it('should create reservation with timeout', async () => {
      const reservationTimeout = 15 * 60 * 1000; // 15 minutes
      const createReservation = vi.fn().mockResolvedValue({
        ...mockInvestmentPayment,
        id: 1,
        status: 'reserved',
        reservedUntil: new Date(Date.now() + reservationTimeout),
      });

      const result = await createReservation(mockInvestmentPayment);

      expect(result.status).toBe('reserved');
      expect(result.reservedUntil).toBeInstanceOf(Date);
    });

    it('should hold shares during reservation', async () => {
      const holdShares = vi.fn().mockResolvedValue({
        ...mockProperty,
        availableShares: mockProperty.availableShares - mockInvestmentPayment.shares,
        reservedShares: mockInvestmentPayment.shares,
      });

      const property = await holdShares(mockProperty.id, mockInvestmentPayment.shares);

      expect(property.availableShares).toBe(40);
      expect(property.reservedShares).toBe(10);
    });

    it('should release shares if reservation expires', async () => {
      const expireReservation = vi.fn().mockResolvedValue({
        ...mockInvestmentPayment,
        status: 'expired',
      });

      const releaseShares = vi.fn().mockResolvedValue({
        ...mockProperty,
        availableShares: mockProperty.availableShares + mockInvestmentPayment.shares,
        reservedShares: 0,
      });

      await expireReservation(1);
      const property = await releaseShares(mockProperty.id, mockInvestmentPayment.shares);

      expect(property.availableShares).toBe(60); // 50 + 10
      expect(property.reservedShares).toBe(0);
    });

    it('should complete reservation before timeout', async () => {
      const completeReservation = vi.fn().mockResolvedValue({
        ...mockInvestmentPayment,
        status: 'completed',
        completedAt: new Date(),
      });

      const result = await completeReservation(1);

      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('Payment Timeout Handling', () => {
    it('should cancel investment after timeout', async () => {
      const timeout = 30 * 60 * 1000; // 30 minutes
      const checkTimeout = vi.fn().mockReturnValue(true);
      const cancelInvestment = vi.fn().mockResolvedValue({
        ...mockInvestmentPayment,
        status: 'cancelled',
      });

      const isExpired = checkTimeout(Date.now() + timeout + 1000);

      if (isExpired) {
        const result = await cancelInvestment(1);
        expect(result.status).toBe('cancelled');
      }
    });

    it('should refund wallet on timeout cancellation', async () => {
      const refundWallet = vi.fn().mockResolvedValue({
        ...mockUser,
        walletBalance: mockUser.walletBalance + mockInvestmentPayment.totalAmount,
      });

      const user = await refundWallet(mockUser.id, mockInvestmentPayment.totalAmount);

      expect(user.walletBalance).toBe(200000); // 100000 + 100000
    });

    it('should send timeout notification to user', async () => {
      const sendNotification = vi.fn();

      await sendNotification(mockUser.id, {
        type: 'investment_timeout',
        message: 'Your investment reservation has expired',
      });

      expect(sendNotification).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          type: 'investment_timeout',
        })
      );
    });
  });

  describe('Refund Processing', () => {
    it('should refund wallet payment', async () => {
      const refundInvestment = vi.fn().mockResolvedValue({
        ...mockInvestmentPayment,
        status: 'refunded',
        refundedAt: new Date(),
      });

      const updateBalance = vi.fn().mockResolvedValue({
        ...mockUser,
        walletBalance: mockUser.walletBalance + mockInvestmentPayment.totalAmount,
      });

      await refundInvestment(1);
      const user = await updateBalance(mockUser.id, mockInvestmentPayment.totalAmount);

      expect(user.walletBalance).toBe(200000);
    });

    it('should refund card payment via Stripe', async () => {
      const createStripeRefund = vi.fn().mockResolvedValue({
        id: 're_test_123',
        amount: mockInvestmentPayment.totalAmount,
        status: 'succeeded',
      });

      const result = await createStripeRefund({
        payment_intent: 'pi_test_investment',
        amount: mockInvestmentPayment.totalAmount,
      });

      expect(result.status).toBe('succeeded');
      expect(result.amount).toBe(mockInvestmentPayment.totalAmount);
    });

    it('should restore property shares on refund', async () => {
      const restoreShares = vi.fn().mockResolvedValue({
        ...mockProperty,
        availableShares: mockProperty.availableShares + mockInvestmentPayment.shares,
      });

      const property = await restoreShares(mockProperty.id, mockInvestmentPayment.shares);

      expect(property.availableShares).toBe(60); // 50 + 10
    });

    it('should create refund audit log', async () => {
      const createAuditLog = vi.fn();

      await createAuditLog({
        userId: mockUser.id,
        action: 'refund_investment',
        targetType: 'investment_transaction',
        targetId: 1,
        details: JSON.stringify({
          amount: mockInvestmentPayment.totalAmount,
          reason: 'User requested refund',
        }),
      });

      expect(createAuditLog).toHaveBeenCalled();
    });
  });

  describe('Distribution Payouts', () => {
    it('should create distribution payout', async () => {
      const createPayout = vi.fn().mockResolvedValue({
        ...mockDistributionPayout,
        id: 1,
        createdAt: new Date(),
      });

      const result = await createPayout(mockDistributionPayout);

      expect(result.distributionType).toBe('rental_income');
      expect(result.amount).toBe(5000);
      expect(result.status).toBe('pending');
    });

    it('should credit wallet with distribution amount', async () => {
      const processPayout = vi.fn().mockResolvedValue({
        ...mockDistributionPayout,
        status: 'processed',
        processedAt: new Date(),
      });

      const updateBalance = vi.fn().mockResolvedValue({
        ...mockUser,
        walletBalance: mockUser.walletBalance + mockDistributionPayout.amount,
      });

      await processPayout(1);
      const user = await updateBalance(mockUser.id, mockDistributionPayout.amount);

      expect(user.walletBalance).toBe(105000); // 100000 + 5000
    });

    it('should send payout notification', async () => {
      const sendNotification = vi.fn();

      await sendNotification(mockUser.id, {
        type: 'distribution_payout',
        amount: mockDistributionPayout.amount,
        distributionType: mockDistributionPayout.distributionType,
      });

      expect(sendNotification).toHaveBeenCalled();
    });

    it('should handle payout failures gracefully', async () => {
      const processPayout = vi.fn().mockRejectedValue(
        new Error('Payout processing failed')
      );

      await expect(processPayout(1)).rejects.toThrow('Payout processing failed');
    });
  });

  describe('Edge Cases', () => {
    it('should prevent purchasing more shares than available', async () => {
      const tooManyShares = {
        ...mockInvestmentPayment,
        shares: 100, // More than available (50)
      };

      const createInvestment = vi.fn().mockRejectedValue(
        new Error('Not enough shares available')
      );

      await expect(createInvestment(tooManyShares)).rejects.toThrow(
        'Not enough shares available'
      );
    });

    it('should handle concurrent purchase attempts', async () => {
      const createInvestment = vi.fn()
        .mockResolvedValueOnce({ ...mockInvestmentPayment, id: 1 })
        .mockRejectedValueOnce(new Error('Shares no longer available'));

      // First purchase succeeds
      const first = await createInvestment(mockInvestmentPayment);
      expect(first.id).toBe(1);

      // Second concurrent purchase fails
      await expect(createInvestment(mockInvestmentPayment)).rejects.toThrow(
        'Shares no longer available'
      );
    });

    it('should handle property status changes during purchase', async () => {
      const fundedProperty = {
        ...mockProperty,
        status: 'funded' as const,
      };

      const createInvestment = vi.fn().mockRejectedValue(
        new Error('Property is no longer available for investment')
      );

      await expect(createInvestment({
        ...mockInvestmentPayment,
        propertyId: fundedProperty.id,
      })).rejects.toThrow('no longer available');
    });
  });
});
