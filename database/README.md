# Emtelaak Database Setup

## Database Requirements
- MySQL 8.0+ or TiDB (recommended for production)
- Minimum 2GB RAM for database server

## Schema Management
The database schema is managed using Drizzle ORM. The schema definition is in `drizzle/schema.ts`.

## Setup Instructions

### 1. Create Database
```sql
CREATE DATABASE emtelaak CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configure Connection
Set the DATABASE_URL environment variable:
```
DATABASE_URL=mysql://username:password@host:3306/emtelaak
```

### 3. Run Migrations
```bash
pnpm db:push
```

This will create all tables based on the schema in `drizzle/schema.ts`.

## Tables Overview

### Core Tables
- `users` - User accounts and authentication
- `user_profiles` - Extended user profile information
- `user_sessions` - Active login sessions
- `user_2fa` - Two-factor authentication settings
- `trusted_devices` - Remembered devices for 2FA

### Properties & Investments
- `properties` - Property listings
- `property_images` - Property image gallery
- `property_documents` - Property-related documents
- `property_financials` - Financial data for properties
- `investments` - User investments in properties
- `investment_transactions` - Transaction history

### Wallet & Payments
- `user_wallets` - User wallet balances
- `wallet_transactions` - Deposit/withdrawal history
- `user_bank_accounts` - Linked bank accounts

### KYC & Compliance
- `kyc_documents` - Uploaded KYC documents
- `kyc_questionnaire_responses` - KYC questionnaire answers

### Admin & Security
- `admin_permissions` - Admin role permissions
- `security_events` - Security audit log
- `blocked_ips` - IP blocking for security

### Support
- `support_conversations` - Live chat conversations
- `support_messages` - Chat messages
- `kb_categories` - Knowledge base categories
- `kb_articles` - Knowledge base articles

## Seed Data
Sample seed files are provided in the root directory:
- `seed_properties.sql` - Sample properties
- `seed_sample_users.sql` - Test users
- `seed_knowledge_base.sql` - KB articles
