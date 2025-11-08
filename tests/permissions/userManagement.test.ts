/**
 * User Management Permission Tests
 * Tests for create_user, edit_user, delete_user, view_users permissions
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestUser, cleanupTestUsers, userHasPermission } from "./testUtils";

describe("User Management Permissions", () => {
  const testUserIds: number[] = [];

  afterAll(async () => {
    await cleanupTestUsers(testUserIds);
  });

  describe("view_users permission", () => {
    it("should allow user with view_users to see user list", async () => {
      const testUser = await createTestUser(
        "View Only User",
        "viewonly@test.com",
        ["view_users"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "view_users");
      expect(hasPermission).toBe(true);
    });

    it("should not grant view_users without explicit permission", async () => {
      const testUser = await createTestUser(
        "No Permissions User",
        "noperms@test.com",
        []
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "view_users");
      expect(hasPermission).toBe(false);
    });
  });

  describe("create_user permission", () => {
    it("should allow user with create_user to create new users", async () => {
      const testUser = await createTestUser(
        "User Creator",
        "creator@test.com",
        ["create_user"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "create_user");
      expect(hasPermission).toBe(true);
    });

    it("should not allow create without create_user permission", async () => {
      const testUser = await createTestUser(
        "View Only User 2",
        "viewonly2@test.com",
        ["view_users"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "create_user");
      expect(hasPermission).toBe(false);
    });
  });

  describe("edit_user permission", () => {
    it("should allow user with edit_user to modify existing users", async () => {
      const testUser = await createTestUser(
        "User Editor",
        "editor@test.com",
        ["edit_user"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "edit_user");
      expect(hasPermission).toBe(true);
    });

    it("should not allow edit without edit_user permission", async () => {
      const testUser = await createTestUser(
        "View Only User 3",
        "viewonly3@test.com",
        ["view_users"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "edit_user");
      expect(hasPermission).toBe(false);
    });
  });

  describe("delete_user permission", () => {
    it("should allow user with delete_user to remove users", async () => {
      const testUser = await createTestUser(
        "User Deleter",
        "deleter@test.com",
        ["delete_user"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "delete_user");
      expect(hasPermission).toBe(true);
    });

    it("should not allow delete without delete_user permission", async () => {
      const testUser = await createTestUser(
        "View Only User 4",
        "viewonly4@test.com",
        ["view_users"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "delete_user");
      expect(hasPermission).toBe(false);
    });
  });

  describe("combined permissions", () => {
    it("should allow user with multiple permissions to perform all actions", async () => {
      const testUser = await createTestUser(
        "Full User Manager",
        "fullmanager@test.com",
        ["view_users", "create_user", "edit_user", "delete_user"]
      );
      testUserIds.push(testUser.id);

      expect(await userHasPermission(testUser.id, "view_users")).toBe(true);
      expect(await userHasPermission(testUser.id, "create_user")).toBe(true);
      expect(await userHasPermission(testUser.id, "edit_user")).toBe(true);
      expect(await userHasPermission(testUser.id, "delete_user")).toBe(true);
    });

    it("should enforce granular permissions independently", async () => {
      const testUser = await createTestUser(
        "Partial Manager",
        "partial@test.com",
        ["view_users", "edit_user"]
      );
      testUserIds.push(testUser.id);

      expect(await userHasPermission(testUser.id, "view_users")).toBe(true);
      expect(await userHasPermission(testUser.id, "edit_user")).toBe(true);
      expect(await userHasPermission(testUser.id, "create_user")).toBe(false);
      expect(await userHasPermission(testUser.id, "delete_user")).toBe(false);
    });
  });
});
