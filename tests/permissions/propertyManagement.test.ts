/**
 * Property Management Permission Tests
 * Tests for view_properties, create_properties, edit_properties, delete_properties, manage_property_documents permissions
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestUser, cleanupTestUsers, userHasPermission } from "./testUtils";

describe("Property Management Permissions", () => {
  const testUserIds: number[] = [];

  afterAll(async () => {
    await cleanupTestUsers(testUserIds);
  });

  describe("view_properties permission", () => {
    it("should allow user with view_properties to see property list", async () => {
      const testUser = await createTestUser(
        "Property Viewer",
        "propview@test.com",
        ["view_properties"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "view_properties");
      expect(hasPermission).toBe(true);
    });

    it("should not grant view_properties without explicit permission", async () => {
      const testUser = await createTestUser(
        "No Property Perms",
        "noprop@test.com",
        []
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "view_properties");
      expect(hasPermission).toBe(false);
    });
  });

  describe("create_properties permission", () => {
    it("should allow user with create_properties to create new properties", async () => {
      const testUser = await createTestUser(
        "Property Creator",
        "propcreate@test.com",
        ["create_properties"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "create_properties");
      expect(hasPermission).toBe(true);
    });

    it("should not allow create without create_properties permission", async () => {
      const testUser = await createTestUser(
        "Property Viewer 2",
        "propview2@test.com",
        ["view_properties"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "create_properties");
      expect(hasPermission).toBe(false);
    });
  });

  describe("edit_properties permission", () => {
    it("should allow user with edit_properties to modify existing properties", async () => {
      const testUser = await createTestUser(
        "Property Editor",
        "propedit@test.com",
        ["edit_properties"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "edit_properties");
      expect(hasPermission).toBe(true);
    });

    it("should not allow edit without edit_properties permission", async () => {
      const testUser = await createTestUser(
        "Property Viewer 3",
        "propview3@test.com",
        ["view_properties"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "edit_properties");
      expect(hasPermission).toBe(false);
    });
  });

  describe("delete_properties permission", () => {
    it("should allow user with delete_properties to remove properties", async () => {
      const testUser = await createTestUser(
        "Property Deleter",
        "propdelete@test.com",
        ["delete_properties"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "delete_properties");
      expect(hasPermission).toBe(true);
    });

    it("should not allow delete without delete_properties permission", async () => {
      const testUser = await createTestUser(
        "Property Viewer 4",
        "propview4@test.com",
        ["view_properties"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "delete_properties");
      expect(hasPermission).toBe(false);
    });
  });

  describe("manage_property_documents permission", () => {
    it("should allow user with manage_property_documents to manage documents", async () => {
      const testUser = await createTestUser(
        "Document Manager",
        "docmanage@test.com",
        ["manage_property_documents"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "manage_property_documents");
      expect(hasPermission).toBe(true);
    });

    it("should not allow document management without permission", async () => {
      const testUser = await createTestUser(
        "Property Viewer 5",
        "propview5@test.com",
        ["view_properties"]
      );
      testUserIds.push(testUser.id);

      const hasPermission = await userHasPermission(testUser.id, "manage_property_documents");
      expect(hasPermission).toBe(false);
    });
  });

  describe("combined property permissions", () => {
    it("should allow user with multiple permissions to perform all actions", async () => {
      const testUser = await createTestUser(
        "Full Property Manager",
        "fullpropmanager@test.com",
        [
          "view_properties",
          "create_properties",
          "edit_properties",
          "delete_properties",
          "manage_property_documents"
        ]
      );
      testUserIds.push(testUser.id);

      expect(await userHasPermission(testUser.id, "view_properties")).toBe(true);
      expect(await userHasPermission(testUser.id, "create_properties")).toBe(true);
      expect(await userHasPermission(testUser.id, "edit_properties")).toBe(true);
      expect(await userHasPermission(testUser.id, "delete_properties")).toBe(true);
      expect(await userHasPermission(testUser.id, "manage_property_documents")).toBe(true);
    });

    it("should enforce granular property permissions independently", async () => {
      const testUser = await createTestUser(
        "Partial Property Manager",
        "partialprop@test.com",
        ["view_properties", "edit_properties", "manage_property_documents"]
      );
      testUserIds.push(testUser.id);

      expect(await userHasPermission(testUser.id, "view_properties")).toBe(true);
      expect(await userHasPermission(testUser.id, "edit_properties")).toBe(true);
      expect(await userHasPermission(testUser.id, "manage_property_documents")).toBe(true);
      expect(await userHasPermission(testUser.id, "create_properties")).toBe(false);
      expect(await userHasPermission(testUser.id, "delete_properties")).toBe(false);
    });
  });

  describe("property acquisition workflow permissions", () => {
    it("should allow property acquisition specialist with specific permissions", async () => {
      const testUser = await createTestUser(
        "Property Acquisition Specialist",
        "acquisition@test.com",
        ["view_properties", "create_properties", "manage_property_documents"]
      );
      testUserIds.push(testUser.id);

      // Can view and create properties, manage documents
      expect(await userHasPermission(testUser.id, "view_properties")).toBe(true);
      expect(await userHasPermission(testUser.id, "create_properties")).toBe(true);
      expect(await userHasPermission(testUser.id, "manage_property_documents")).toBe(true);
      
      // Cannot edit or delete existing properties
      expect(await userHasPermission(testUser.id, "edit_properties")).toBe(false);
      expect(await userHasPermission(testUser.id, "delete_properties")).toBe(false);
    });

    it("should allow property maintenance staff with limited permissions", async () => {
      const testUser = await createTestUser(
        "Property Maintenance",
        "maintenance@test.com",
        ["view_properties", "edit_properties"]
      );
      testUserIds.push(testUser.id);

      // Can view and edit properties
      expect(await userHasPermission(testUser.id, "view_properties")).toBe(true);
      expect(await userHasPermission(testUser.id, "edit_properties")).toBe(true);
      
      // Cannot create, delete, or manage documents
      expect(await userHasPermission(testUser.id, "create_properties")).toBe(false);
      expect(await userHasPermission(testUser.id, "delete_properties")).toBe(false);
      expect(await userHasPermission(testUser.id, "manage_property_documents")).toBe(false);
    });
  });
});
