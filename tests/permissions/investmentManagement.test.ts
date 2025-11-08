/**
 * Investment Management Permission Tests
 * Tests for create_investment, edit_investment, delete_investment, view_investments permissions
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestUser, cleanupTestUsers, userHasPermission } from "./testUtils";

describe("Investment Management Permissions", () => {
  const testUserIds: number[] = [];

  afterAll(async () => {
    await cleanupTestUsers(testUserIds);
  });

  describe("view_investments permission", () => {
    it("should allow user with view_investments to see investment list", async () => {
      const testUser = await createTestUser(
        "Investment Viewer",
        "investview@test.com",
        ["view_investments"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "view_investments");
      expect(hasPermission).toBe(true);
    });

    it("should not grant view_investments without explicit permission", async () => {
      const testUser = await createTestUser(
        "No Investment Perms",
        "noinvest@test.com",
        []
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "view_investments");
      expect(hasPermission).toBe(false);
    });
  });

  describe("create_investment permission", () => {
    it("should allow user with create_investment to create new investments", async () => {
      const testUser = await createTestUser(
        "Investment Creator",
        "investcreate@test.com",
        ["create_investment"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "create_investment");
      expect(hasPermission).toBe(true);
    });

    it("should not allow create without create_investment permission", async () => {
      const testUser = await createTestUser(
        "Investment Viewer 2",
        "investview2@test.com",
        ["view_investments"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "create_investment");
      expect(hasPermission).toBe(false);
    });
  });

  describe("edit_investment permission", () => {
    it("should allow user with edit_investment to modify existing investments", async () => {
      const testUser = await createTestUser(
        "Investment Editor",
        "investedit@test.com",
        ["edit_investment"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "edit_investment");
      expect(hasPermission).toBe(true);
    });

    it("should not allow edit without edit_investment permission", async () => {
      const testUser = await createTestUser(
        "Investment Viewer 3",
        "investview3@test.com",
        ["view_investments"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "edit_investment");
      expect(hasPermission).toBe(false);
    });
  });

  describe("delete_investment permission", () => {
    it("should allow user with delete_investment to remove investments", async () => {
      const testUser = await createTestUser(
        "Investment Deleter",
        "investdelete@test.com",
        ["delete_investment"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "delete_investment");
      expect(hasPermission).toBe(true);
    });

    it("should not allow delete without delete_investment permission", async () => {
      const testUser = await createTestUser(
        "Investment Viewer 4",
        "investview4@test.com",
        ["view_investments"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "delete_investment");
      expect(hasPermission).toBe(false);
    });
  });

  describe("combined investment permissions", () => {
    it("should allow user with multiple permissions to perform all actions", async () => {
      const testUser = await createTestUser(
        "Full Investment Manager",
        "fullinvestmanager@test.com",
        ["view_investments", "create_investment", "edit_investment", "delete_investment"]
      );
      testUserIds.push(testUser.id);

      expect(await userHasPermission(testUser.id, "view_investments")).toBe(true);
      expect(await userHasPermission(testUser.id, "create_investment")).toBe(true);
      expect(await userHasPermission(testUser.id, "edit_investment")).toBe(true);
      expect(await userHasPermission(testUser.id, "delete_investment")).toBe(true);
    });

    it("should enforce granular investment permissions independently", async () => {
      const testUser = await createTestUser(
        "Partial Investment Manager",
        "partialinvest@test.com",
        ["view_investments", "edit_investment"]
      );
      testUserIds.push(testUser.id);

      expect(await userHasPermission(testUser.id, "view_investments")).toBe(true);
      expect(await userHasPermission(testUser.id, "edit_investment")).toBe(true);
      expect(await userHasPermission(testUser.id, "create_investment")).toBe(false);
      expect(await userHasPermission(testUser.id, "delete_investment")).toBe(false);
    });
  });

  describe("process_distributions permission", () => {
    it("should allow user with process_distributions to process income distributions", async () => {
      const testUser = await createTestUser(
        "Distribution Processor",
        "distprocess@test.com",
        ["process_distributions"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "process_distributions");
      expect(hasPermission).toBe(true);
    });

    it("should not allow distribution processing without permission", async () => {
      const testUser = await createTestUser(
        "Investment Viewer 5",
        "investview5@test.com",
        ["view_investments"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "process_distributions");
      expect(hasPermission).toBe(false);
    });
  });
});
