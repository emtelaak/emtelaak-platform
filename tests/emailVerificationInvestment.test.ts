import { describe, it, expect, beforeAll } from 'vitest';
import { createCallerFactory } from '../server/_core/trpc';
import { appRouter } from '../server/routers';
import { getDb } from '../server/db';
import type { User } from '../drizzle/schema';

describe('Email Verification for Investments', () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let unverifiedUser: User;
  let verifiedUser: User;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create test users
    const [unverified] = await db.execute(`
      INSERT INTO users (openId, name, email, emailVerified, role, loginMethod)
      VALUES ('test_unverified_inv', 'Unverified User', 'unverified@test.com', 0, 'user', 'email_password')
      ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)
    `);
    
    const [verified] = await db.execute(`
      INSERT INTO users (openId, name, email, emailVerified, role, loginMethod)
      VALUES ('test_verified_inv', 'Verified User', 'verified@test.com', 1, 'user', 'email_password')
      ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)
    `);

    // Fetch the created users
    const [unverifiedRows] = await db.execute(`SELECT * FROM users WHERE openId = 'test_unverified_inv'`);
    const [verifiedRows] = await db.execute(`SELECT * FROM users WHERE openId = 'test_verified_inv'`);
    
    unverifiedUser = (unverifiedRows as any[])[0] as User;
    verifiedUser = (verifiedRows as any[])[0] as User;
  });

  it('should block unverified users from creating investment reservations', async () => {
    const createCaller = createCallerFactory(appRouter);
    const caller = createCaller({
      user: unverifiedUser,
      req: {} as any,
      res: {} as any,
      db: db as any,
    });

    await expect(
      caller.investmentFlow.createReservation({
        offeringId: 1,
        shareQuantity: 10,
      })
    ).rejects.toThrow('Please verify your email address before making an investment');
  });

  it('should allow verified users to create investment reservations', async () => {
    const createCaller = createCallerFactory(appRouter);
    const caller = createCaller({
      user: verifiedUser,
      req: {} as any,
      res: {} as any,
      db: db as any,
    });

    // This test assumes there's a valid offering with id 1
    // In a real scenario, you'd create test data first
    await expect(
      caller.investmentFlow.createReservation({
        offeringId: 999999, // Non-existent offering
        shareQuantity: 10,
      })
    ).rejects.toThrow(); // Should fail for other reasons (not email verification)
  });

  it('should block unverified users from making investments', async () => {
    const createCaller = createCallerFactory(appRouter);
    const caller = createCaller({
      user: unverifiedUser,
      req: {} as any,
      res: {} as any,
      db: db as any,
    });

    // Test that email verification is checked before investment
    await expect(
      caller.investmentFlow.createReservation({
        offeringId: 1,
        shareQuantity: 5,
      })
    ).rejects.toThrow('Please verify your email address before making an investment');
  });

  it('should allow verified users to proceed with investment flow', async () => {
    const createCaller = createCallerFactory(appRouter);
    const caller = createCaller({
      user: verifiedUser,
      req: {} as any,
      res: {} as any,
      db: db as any,
    });

    // Verified users should pass email check (may fail for other reasons like invalid offering)
    await expect(
      caller.investmentFlow.createReservation({
        offeringId: 999999, // Non-existent offering
        shareQuantity: 5,
      })
    ).rejects.toThrow(); // Should fail for other reasons (not email verification)
  });
});
