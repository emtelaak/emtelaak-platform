/**
 * Seed script to populate default permissions and roles
 * Run this once to initialize the permissions system
 */

import { getDb } from "./db";
import { permissions, roles, rolePermissions } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

const defaultPermissions = [
  // User Management
  { name: "view_users", description: "View user list and details", category: "users" },
  { name: "create_user", description: "Create new users", category: "users" },
  { name: "edit_user", description: "Edit existing users", category: "users" },
  { name: "delete_user", description: "Delete users", category: "users" },
  { name: "change_user_roles", description: "Assign roles to users", category: "users" },
  { name: "manage_permissions", description: "Assign individual permissions to users", category: "users" },
  
  // KYC Management
  { name: "view_kyc", description: "View KYC submissions", category: "kyc" },
  { name: "approve_kyc", description: "Approve or reject KYC documents", category: "kyc" },
  { name: "manage_kyc_settings", description: "Configure KYC requirements", category: "kyc" },
  
  // Property Management
  { name: "view_properties", description: "View property listings", category: "properties" },
  { name: "create_properties", description: "Create new property listings", category: "properties" },
  { name: "edit_properties", description: "Edit existing properties", category: "properties" },
  { name: "delete_properties", description: "Delete properties", category: "properties" },
  { name: "manage_property_documents", description: "Upload and manage property documents", category: "properties" },
  
  // Investment Management
  { name: "view_investments", description: "View all investments", category: "investments" },
  { name: "create_investment", description: "Create new investment records", category: "investments" },
  { name: "edit_investment", description: "Edit existing investment records", category: "investments" },
  { name: "delete_investment", description: "Delete investment records", category: "investments" },
  { name: "process_distributions", description: "Process income distributions", category: "investments" },
  
  // Analytics & Reports
  { name: "view_analytics", description: "View platform analytics and reports", category: "analytics" },
  { name: "export_data", description: "Export platform data", category: "analytics" },
  
  // Platform Settings
  { name: "manage_settings", description: "Modify platform settings", category: "settings" },
  { name: "manage_fees", description: "Configure platform fees", category: "settings" },
  { name: "view_audit_logs", description: "View audit logs", category: "settings" },
  
  // Role Management
  { name: "view_roles", description: "View roles and permissions", category: "roles" },
  { name: "manage_roles", description: "Create, edit, and delete roles", category: "roles" },
];

const defaultRoles = [
  {
    name: "super_admin",
    description: "Full system access with all permissions",
    isSystem: true,
    permissions: defaultPermissions.map(p => p.name), // All permissions
  },
  {
    name: "admin",
    description: "Standard administrator with most permissions",
    isSystem: true,
    permissions: [
      "view_users", "create_user", "edit_user", "delete_user",
      "view_kyc", "approve_kyc",
      "view_properties", "create_properties", "edit_properties", "manage_property_documents",
      "view_investments", "process_distributions",
      "view_analytics",
    ],
  },
  {
    name: "kyc_reviewer",
    description: "Can review and approve KYC submissions",
    isSystem: true,
    permissions: ["view_users", "view_kyc", "approve_kyc"],
  },
  {
    name: "property_manager",
    description: "Can manage property listings",
    isSystem: true,
    permissions: [
      "view_properties", "create_properties", "edit_properties", "manage_property_documents",
      "view_analytics",
    ],
  },
  {
    name: "analyst",
    description: "Can view analytics and export data",
    isSystem: true,
    permissions: ["view_users", "view_properties", "view_investments", "view_analytics", "export_data"],
  },
];

export async function seedPermissions() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  console.log("Seeding permissions...");

  // Insert permissions
  for (const perm of defaultPermissions) {
    const existing = await db.select().from(permissions).where(eq(permissions.name, perm.name)).limit(1);
    if (existing.length === 0) {
      await db.insert(permissions).values(perm);
      console.log(`✓ Created permission: ${perm.name}`);
    }
  }

  console.log("Seeding roles...");

  // Insert roles and role permissions
  for (const role of defaultRoles) {
    const { permissions: rolePerms, ...roleData } = role;
    
    let roleId: number;
    const existingRole = await db.select().from(roles).where(eq(roles.name, role.name)).limit(1);
    
    if (existingRole.length === 0) {
      const result = await db.insert(roles).values(roleData);
      roleId = Number(result[0].insertId);
      console.log(`✓ Created role: ${role.name}`);
    } else {
      roleId = existingRole[0].id;
      console.log(`  Role already exists: ${role.name}`);
    }

    // Assign permissions to role
    for (const permName of rolePerms) {
      const perm = await db.select().from(permissions).where(eq(permissions.name, permName)).limit(1);
      if (perm.length > 0) {
        const existing = await db.select()
          .from(rolePermissions)
          .where(and(
            eq(rolePermissions.roleId, roleId),
            eq(rolePermissions.permissionId, perm[0].id)
          ))
          .limit(1);
        
        if (existing.length === 0) {
          await db.insert(rolePermissions).values({
            roleId,
            permissionId: perm[0].id,
          });
        }
      }
    }
  }

  console.log("✓ Permissions and roles seeded successfully!");
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPermissions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error seeding permissions:", error);
      process.exit(1);
    });
}
