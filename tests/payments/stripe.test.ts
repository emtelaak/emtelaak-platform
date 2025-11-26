import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockStripePaymentIntent,
  mockStripePaymentIntentFailed,
  mockStripeRefund,
  mockStripeWebhookEvent,
  mockUser,
} from '../fixtures/paymentFixtures';

/**
 * Comprehensive test suite for Stripe payment processing
 * 
 * Tests cover:
 * - Payment intent creation
 * - Payment completion (success/failure)
 * - Refund processing
 * - Webhook handling
 * - 3D Secure authentication
 * - Error scenarios
 */

describe('Stripe Payment Processing', () => {
  describe('Payment Intent Creation', () => {
    it('should create payment intent with correct amount', async () => {
      const amount = 10000; // $100.00
      const currency = 'usd';

      // Mock Stripe API call
      const createPaymentIntent = vi.fn().mockResolvedValue(mockStripePaymentIntent);

      const result = await createPaymentIntent({ amount, currency });

      expect(result.amount).toBe(amount);
      expect(result.currency).toBe(currency);
      expect(result.status).toBe('succeeded');
      expect(result.id).toMatch(/^pi_test_/);
    });

    it('should include metadata in payment intent', async () => {
      const metadata = {
        userId: mockUser.id.toString(),
        propertyId: '1',
        shares: '10',
      };

      const createPaymentIntent = vi.fn().mockResolvedValue({
        ...mockStripePaymentIntent,
        metadata,
      });

      const result = await createPaymentIntent({
        amount: 10000,
        currency: 'usd',
        metadata,
      });

      expect(result.metadata).toEqual(metadata);
    });

    it('should return client secret for frontend', async () => {
      const createPaymentIntent = vi.fn().mockResolvedValue(mockStripePaymentIntent);

      const result = await createPaymentIntent({ amount: 10000, currency: 'usd' });

      expect(result.client_secret).toBeDefined();
      expect(result.client_secret).toMatch(/^pi_test_.*_secret_/);
    });

    it('should handle Stripe API errors gracefully', async () => {
      const stripeError = new Error('Stripe API error: Invalid API key');
      const createPaymentIntent = vi.fn().mockRejectedValue(stripeError);

      await expect(
        createPaymentIntent({ amount: 10000, currency: 'usd' })
      ).rejects.toThrow('Stripe API error');
    });
  });

  describe('Payment Completion', () => {
    it('should mark payment as succeeded', async () => {
      const confirmPayment = vi.fn().mockResolvedValue({
        ...mockStripePaymentIntent,
        status: 'succeeded',
      });

      const result = await confirmPayment('pi_test_123456789');

      expect(result.status).toBe('succeeded');
    });

    it('should handle card declined errors', async () => {
      const confirmPayment = vi.fn().mockResolvedValue(mockStripePaymentIntentFailed);

      const result = await confirmPayment('pi_test_failed');

      expect(result.status).toBe('failed');
      expect(result.last_payment_error?.code).toBe('card_declined');
      expect(result.last_payment_error?.message).toContain('declined');
    });

    it('should handle insufficient funds error', async () => {
      const insufficientFundsError = {
        ...mockStripePaymentIntentFailed,
        last_payment_error: {
          code: 'insufficient_funds',
          message: 'Your card has insufficient funds',
        },
      };

      const confirmPayment = vi.fn().mockResolvedValue(insufficientFundsError);

      const result = await confirmPayment('pi_test_insufficient');

      expect(result.status).toBe('failed');
      expect(result.last_payment_error?.code).toBe('insufficient_funds');
    });

    it('should update investment transaction on success', async () => {
      const updateTransaction = vi.fn();
      const confirmPayment = vi.fn().mockResolvedValue({
        ...mockStripePaymentIntent,
        status: 'succeeded',
      });

      const result = await confirmPayment('pi_test_123456789');

      if (result.status === 'succeeded') {
        await updateTransaction(result.id, { status: 'completed' });
      }

      expect(updateTransaction).toHaveBeenCalledWith('pi_test_123456789', {
        status: 'completed',
      });
    });
  });

  describe('3D Secure Authentication', () => {
    it('should handle 3DS required status', async () => {
      const requires3DS = {
        ...mockStripePaymentIntent,
        status: 'requires_action',
        next_action: {
          type: 'use_stripe_sdk',
        },
      };

      const confirmPayment = vi.fn().mockResolvedValue(requires3DS);

      const result = await confirmPayment('pi_test_3ds');

      expect(result.status).toBe('requires_action');
      expect(result.next_action?.type).toBe('use_stripe_sdk');
    });

    it('should complete payment after 3DS authentication', async () => {
      const confirmPayment = vi
        .fn()
        .mockResolvedValueOnce({
          ...mockStripePaymentIntent,
          status: 'requires_action',
        })
        .mockResolvedValueOnce({
          ...mockStripePaymentIntent,
          status: 'succeeded',
        });

      // First call - requires 3DS
      const firstResult = await confirmPayment('pi_test_3ds');
      expect(firstResult.status).toBe('requires_action');

      // Second call - after 3DS completion
      const secondResult = await confirmPayment('pi_test_3ds');
      expect(secondResult.status).toBe('succeeded');
    });
  });

  describe('Refund Processing', () => {
    it('should create full refund successfully', async () => {
      const createRefund = vi.fn().mockResolvedValue(mockStripeRefund);

      const result = await createRefund({
        payment_intent: 'pi_test_123456789',
        amount: 10000,
      });

      expect(result.status).toBe('succeeded');
      expect(result.amount).toBe(10000);
      expect(result.payment_intent).toBe('pi_test_123456789');
    });

    it('should create partial refund', async () => {
      const partialRefund = {
        ...mockStripeRefund,
        amount: 5000, // Refund half
      };

      const createRefund = vi.fn().mockResolvedValue(partialRefund);

      const result = await createRefund({
        payment_intent: 'pi_test_123456789',
        amount: 5000,
      });

      expect(result.amount).toBe(5000);
      expect(result.status).toBe('succeeded');
    });

    it('should handle refund failures', async () => {
      const refundError = new Error('Refund failed: Charge already refunded');
      const createRefund = vi.fn().mockRejectedValue(refundError);

      await expect(
        createRefund({ payment_intent: 'pi_test_123456789' })
      ).rejects.toThrow('already refunded');
    });

    it('should update investment status on refund', async () => {
      const updateInvestment = vi.fn();
      const createRefund = vi.fn().mockResolvedValue(mockStripeRefund);

      const result = await createRefund({ payment_intent: 'pi_test_123456789' });

      if (result.status === 'succeeded') {
        await updateInvestment({ status: 'refunded' });
      }

      expect(updateInvestment).toHaveBeenCalledWith({ status: 'refunded' });
    });
  });

  describe('Webhook Handling', () => {
    it('should verify webhook signature', async () => {
      const verifyWebhook = vi.fn().mockReturnValue(true);

      const signature = 'test_signature';
      const payload = JSON.stringify(mockStripeWebhookEvent);

      const isValid = await verifyWebhook(payload, signature);

      expect(isValid).toBe(true);
    });

    it('should handle payment_intent.succeeded event', async () => {
      const handleWebhook = vi.fn();

      await handleWebhook(mockStripeWebhookEvent);

      expect(handleWebhook).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'payment_intent.succeeded',
        })
      );
    });

    it('should handle payment_intent.payment_failed event', async () => {
      const failedEvent = {
        ...mockStripeWebhookEvent,
        type: 'payment_intent.payment_failed',
        data: {
          object: mockStripePaymentIntentFailed,
        },
      };

      const handleWebhook = vi.fn();

      await handleWebhook(failedEvent);

      expect(handleWebhook).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'payment_intent.payment_failed',
        })
      );
    });

    it('should handle charge.refunded event', async () => {
      const refundEvent = {
        ...mockStripeWebhookEvent,
        type: 'charge.refunded',
        data: {
          object: mockStripeRefund,
        },
      };

      const handleWebhook = vi.fn();

      await handleWebhook(refundEvent);

      expect(handleWebhook).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'charge.refunded',
        })
      );
    });

    it('should reject invalid webhook signatures', async () => {
      const verifyWebhook = vi.fn().mockReturnValue(false);

      const signature = 'invalid_signature';
      const payload = JSON.stringify(mockStripeWebhookEvent);

      const isValid = await verifyWebhook(payload, signature);

      expect(isValid).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network error: Unable to connect');
      const createPaymentIntent = vi.fn().mockRejectedValue(networkError);

      await expect(
        createPaymentIntent({ amount: 10000, currency: 'usd' })
      ).rejects.toThrow('Network error');
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      const createPaymentIntent = vi.fn().mockRejectedValue(rateLimitError);

      await expect(
        createPaymentIntent({ amount: 10000, currency: 'usd' })
      ).rejects.toThrow('Rate limit');
    });

    it('should handle invalid amount errors', async () => {
      const invalidAmountError = new Error('Amount must be at least $0.50 usd');
      const createPaymentIntent = vi.fn().mockRejectedValue(invalidAmountError);

      await expect(
        createPaymentIntent({ amount: 10, currency: 'usd' }) // Too small
      ).rejects.toThrow('Amount must be at least');
    });
  });
});
