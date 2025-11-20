import { describe, it, expect, beforeAll } from 'vitest';
import { createCaller } from '../server/_core/trpc';
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
    const caller = createCaller({
      user: unverifiedUser,
      req: {} as any,
      res: {} as any,
    });

    await expect(
      caller.investmentFlow.createReservation({
        offeringId: 1,
        shareQuantity: 10,
        expirationMinutes: 30,
      })
    ).rejects.toThrow(/verify your email/i);
  });

  it('should allow verified users to create investment reservations', async () => {
    const caller = createCaller({
      user: verifiedUser,
      req: {} as any,
      res: {} as any,
    });

    // This should not throw an error
    const result = await caller.investmentFlow.createReservation({
      offeringId: 1,
      shareQuantity: 10,
      expirationMinutes: 30,
    });

    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('reservationId');
  });

  it('should block unverified users from joining waitlist', async () => {
    const caller = createCaller({
      user: unverifiedUser,
      req: {} as any,
      res: {} as any,
    });

    await expect(
      caller.properties.joinWaitlist({
        propertyId: 1,
      })
    ).rejects.toThrow(/verify your email/i);
  });

  it('should allow verified users to join waitlist', async () => {
    const caller = createCaller({
      user: verifiedUser,
      req: {} as any,
      res: {} as any,
    });

    // This should not throw an error
    const result = await caller.properties.joinWaitlist({
      propertyId: 1,
    });

    expect(result).toHaveProperty('success', true);
  });
});
