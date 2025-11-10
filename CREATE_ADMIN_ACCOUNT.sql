-- ============================================
-- Create Super Admin Account for Emtelaak Platform
-- ============================================

USE emtelaak;

-- Insert admin user
-- Email: waleed@emtelaak.com
-- Password: Ofok@7327797 (hashed)
-- Role: admin

INSERT INTO users (
  openId,
  name,
  email,
  password,
  loginMethod,
  role,
  status,
  preferredLanguage,
  createdAt,
  updatedAt,
  lastSignedIn
) VALUES (
  'admin_waleed_001',
  'Waleed',
  'waleed@emtelaak.com',
  '$2b$10$Kd2.24aCkFsvm.dLYDzllOGtif/qW8BsbcOPX0ORGAxCkUjhIy7ty',
  'standard',
  'admin',
  'active',
  'en',
  NOW(),
  NOW(),
  NOW()
);

-- Verify the user was created
SELECT 
  id,
  name,
  email,
  role,
  status,
  createdAt
FROM users 
WHERE email = 'waleed@emtelaak.com';

-- ============================================
-- DONE!
-- ============================================

-- You can now login at https://www.emtelaak.co/login with:
-- Email: waleed@emtelaak.com
-- Password: Ofok@7327797
