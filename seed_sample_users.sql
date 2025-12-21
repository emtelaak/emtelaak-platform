-- Sample users for Emtelaak platform
-- Note: These are test users with mock openIds

INSERT INTO users (openId, name, email, loginMethod, role, status, preferredLanguage, createdAt, updatedAt, lastSignedIn) VALUES
-- Investors
('investor_001', 'Ahmed Hassan', 'ahmed.hassan@example.com', 'email', 'user', 'active', 'ar', NOW(), NOW(), NOW()),
('investor_002', 'Sarah Johnson', 'sarah.johnson@example.com', 'google', 'user', 'active', 'en', NOW(), NOW(), NOW()),
('investor_003', 'Mohamed Ali', 'mohamed.ali@example.com', 'email', 'user', 'pending_verification', 'ar', NOW(), NOW(), NOW()),
('investor_004', 'Emily Chen', 'emily.chen@example.com', 'google', 'user', 'active', 'en', NOW(), NOW(), NOW()),
('investor_005', 'Omar Ibrahim', 'omar.ibrahim@example.com', 'email', 'user', 'active', 'ar', NOW(), NOW(), NOW()),

-- Admin users
('admin_001', 'Fatima El-Sayed', 'fatima.elsayed@emtelaak.com', 'email', 'admin', 'active', 'ar', NOW(), NOW(), NOW()),
('admin_002', 'John Smith', 'john.smith@emtelaak.com', 'google', 'admin', 'active', 'en', NOW(), NOW(), NOW()),
('admin_003', 'Layla Ahmed', 'layla.ahmed@emtelaak.com', 'email', 'admin', 'active', 'ar', NOW(), NOW(), NOW());

-- Sample user profiles
INSERT INTO user_profiles (userId, phone, dateOfBirth, nationality, idType, idNumber, address, city, country, postalCode, createdAt, updatedAt)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE '%ahmed%' THEN '+20 100 123 4567'
    WHEN u.email LIKE '%sarah%' THEN '+1 555 123 4567'
    WHEN u.email LIKE '%mohamed%' THEN '+20 101 234 5678'
    WHEN u.email LIKE '%emily%' THEN '+1 555 234 5678'
    WHEN u.email LIKE '%omar%' THEN '+20 102 345 6789'
    WHEN u.email LIKE '%fatima%' THEN '+20 100 987 6543'
    WHEN u.email LIKE '%john%' THEN '+1 555 987 6543'
    WHEN u.email LIKE '%layla%' THEN '+20 101 876 5432'
  END as phone,
  DATE_SUB(NOW(), INTERVAL 30 YEAR) as dateOfBirth,
  CASE 
    WHEN u.preferredLanguage = 'ar' THEN 'Egypt'
    ELSE 'United States'
  END as nationality,
  'national_id' as idType,
  CONCAT('ID', LPAD(u.id, 8, '0')) as idNumber,
  CASE 
    WHEN u.preferredLanguage = 'ar' THEN '123 Tahrir Square'
    ELSE '456 Main Street'
  END as address,
  CASE 
    WHEN u.preferredLanguage = 'ar' THEN 'Cairo'
    ELSE 'New York'
  END as city,
  CASE 
    WHEN u.preferredLanguage = 'ar' THEN 'Egypt'
    ELSE 'United States'
  END as country,
  CASE 
    WHEN u.preferredLanguage = 'ar' THEN '11511'
    ELSE '10001'
  END as postalCode,
  NOW() as createdAt,
  NOW() as updatedAt
FROM users u
WHERE u.openId LIKE 'investor_%' OR u.openId LIKE 'admin_%';

-- Sample admin permissions
INSERT INTO admin_permissions (userId, canManageUsers, canEditContent, canManageProperties, canReviewKYC, canApproveInvestments, canManageTransactions, canViewFinancials, canAccessCRM, canViewAnalytics, canManageSettings, createdAt, updatedAt)
SELECT 
  u.id,
  CASE WHEN u.email LIKE '%fatima%' THEN TRUE ELSE FALSE END,
  TRUE,
  TRUE,
  CASE WHEN u.email LIKE '%john%' THEN TRUE ELSE FALSE END,
  CASE WHEN u.email LIKE '%fatima%' THEN TRUE ELSE FALSE END,
  FALSE,
  TRUE,
  TRUE,
  TRUE,
  CASE WHEN u.email LIKE '%fatima%' THEN TRUE ELSE FALSE END,
  NOW(),
  NOW()
FROM users u
WHERE u.role = 'admin';
