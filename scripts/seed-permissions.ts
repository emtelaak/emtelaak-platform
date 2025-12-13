import { getDb } from "../server/db";
import { permissions } from "../drizzle/schema";

/**
 * Seed permissions table with all available permissions
 * Run this script once to populate the permissions table
 */

const permissionsData = [
  // User Management
  {
    name: "Manage Users",
    description: "Create, edit, and delete user accounts",
    category: "user_management",
  },
  {
    name: "Bulk Upload Users",
    description: "Upload multiple users via CSV/Excel files",
    category: "user_management",
  },
  {
    name: "View User Details",
    description: "View detailed user information and profiles",
    category: "user_management",
  },
  {
    name: "Manage User Roles",
    description: "Assign and modify user roles and permissions",
    category: "user_management",
  },

  // Investment Management
  {
    name: "Approve Investments",
    description: "Review and approve investment transactions",
    category: "investment_management",
  },
  {
    name: "View Investments",
    description: "View all investment transactions and details",
    category: "investment_management",
  },
  {
    name: "Manage Investment Limits",
    description: "Set and modify investment limits for users",
    category: "investment_management",
  },
  {
    name: "Process Distributions",
    description: "Create and process income distributions to investors",
    category: "investment_management",
  },

  // Property Management
  {
    name: "Manage Properties",
    description: "Create, edit, and delete property listings",
    category: "property_management",
  },
  {
    name: "Upload Property Images",
    description: "Upload and manage property images and media",
    category: "property_management",
  },
  {
    name: "Edit Property Content",
    description: "Edit property descriptions and details",
    category: "property_management",
  },
  {
    name: "Manage Property Status",
    description: "Change property status (draft, available, funded, etc.)",
    category: "property_management",
  },

  // KYC Management
  {
    name: "Review KYC Documents",
    description: "Review and verify user KYC documents",
    category: "kyc_management",
  },
  {
    name: "Approve KYC",
    description: "Approve or reject KYC submissions",
    category: "kyc_management",
  },
  {
    name: "Request Additional Documents",
    description: "Request additional documentation from users",
    category: "kyc_management",
  },
  {
    name: "Manage Verification Levels",
    description: "Set user verification levels (Level 0, 1, 2)",
    category: "kyc_management",
  },

  // Financial Management
  {
    name: "Manage Transactions",
    description: "View and manage all financial transactions",
    category: "financial_management",
  },
  {
    name: "View Financials",
    description: "Access financial reports and analytics",
    category: "financial_management",
  },
  {
    name: "Approve Deposits",
    description: "Review and approve user deposit requests",
    category: "financial_management",
  },
  {
    name: "Approve Withdrawals",
    description: "Review and approve user withdrawal requests",
    category: "financial_management",
  },
  {
    name: "Edit Invoices",
    description: "Create and edit investment invoices",
    category: "financial_management",
  },
  {
    name: "Delete Invoices",
    description: "Delete invoices (requires special authorization)",
    category: "financial_management",
  },

  // System Management
  {
    name: "Access CRM",
    description: "Access customer relationship management system",
    category: "system_management",
  },
  {
    name: "View Analytics",
    description: "View platform analytics and reports",
    category: "system_management",
  },
  {
    name: "Manage Settings",
    description: "Modify platform settings and configuration",
    category: "system_management",
  },
  {
    name: "View Audit Logs",
    description: "Access audit logs and system activity history",
    category: "system_management",
  },
  {
    name: "Manage Roles",
    description: "Create, edit, and delete user roles",
    category: "system_management",
  },
  {
    name: "Manage Permissions",
    description: "Assign and modify role permissions",
    category: "system_management",
  },
];

async function seedPermissions() {
  try {
    console.log("🌱 Starting permissions seed...");
    
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection failed");
    }

    // Check if permissions already exist
    const existingPermissions = await db.select().from(permissions);
    
    if (existingPermissions.length > 0) {
      console.log(`⚠️  Found ${existingPermissions.length} existing permissions. Skipping seed.`);
      console.log("   To re-seed, please truncate the permissions table first.");
      return;
    }

    // Insert all permissions
    console.log(`📝 Inserting ${permissionsData.length} permissions...`);
    
    for (const permission of permissionsData) {
      await db.insert(permissions).values(permission);
      console.log(`   ✓ ${permission.name}`);
    }

    console.log("✅ Permissions seeded successfully!");
    console.log(`   Total permissions: ${permissionsData.length}`);
    console.log(`   Categories: ${new Set(permissionsData.map(p => p.category)).size}`);
    
  } catch (error) {
    console.error("❌ Error seeding permissions:", error);
    throw error;
  }
}

// Run the seed function
seedPermissions()
  .then(() => {
    console.log("\n🎉 Seed completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seed failed:", error);
    process.exit(1);
  });
