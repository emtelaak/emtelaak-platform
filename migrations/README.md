# Database Migrations

This folder contains SQL migration scripts for the production database.

## How to Run Migrations

### Option 1: Using MySQL Client (Recommended for Production)

1. Connect to your production database:
   ```bash
   mysql -h your-database-host -u your-username -p your-database-name
   ```

2. Run the migration script:
   ```bash
   source /path/to/001-add-email-verification.sql
   ```

### Option 2: Using Render Shell (if database is on Render)

1. Go to your Render dashboard
2. Open your web service
3. Click "Shell" tab
4. Run:
   ```bash
   mysql -h $DATABASE_HOST -u $DATABASE_USER -p$DATABASE_PASSWORD $DATABASE_NAME < migrations/001-add-email-verification.sql
   ```

### Option 3: Using Database GUI Tool

1. Open your database in a GUI tool (TablePlus, MySQL Workbench, phpMyAdmin, etc.)
2. Open the migration file: `migrations/001-add-email-verification.sql`
3. Execute the SQL statements

## Migration Files

- `001-add-email-verification.sql` - Adds email verification columns to users table
- `add-composite-indexes.sql` - Adds performance optimization indexes (optional, for scaling)

## Important Notes

- **Always backup your database before running migrations**
- Run migrations in order (001, 002, 003, etc.)
- Test migrations on a staging database first if possible
- The email verification migration is **required** for the login to work after the latest deployment
