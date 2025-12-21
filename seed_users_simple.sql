-- Sample users for Emtelaak platform

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
INSERT INTO user_profiles (userId, firstNameEn, lastNameEn, firstNameAr, lastNameAr, dateOfBirth, nationality, city, country, postalCode, preferredLanguage, preferredCurrency, createdAt, updatedAt)
SELECT 
  u.id,
  CASE 
    WHEN u.name = 'Ahmed Hassan' THEN 'Ahmed'
    WHEN u.name = 'Sarah Johnson' THEN 'Sarah'
    WHEN u.name = 'Mohamed Ali' THEN 'Mohamed'
    WHEN u.name = 'Emily Chen' THEN 'Emily'
    WHEN u.name = 'Omar Ibrahim' THEN 'Omar'
    WHEN u.name = 'Fatima El-Sayed' THEN 'Fatima'
    WHEN u.name = 'John Smith' THEN 'John'
    WHEN u.name = 'Layla Ahmed' THEN 'Layla'
  END as firstNameEn,
  CASE 
    WHEN u.name = 'Ahmed Hassan' THEN 'Hassan'
    WHEN u.name = 'Sarah Johnson' THEN 'Johnson'
    WHEN u.name = 'Mohamed Ali' THEN 'Ali'
    WHEN u.name = 'Emily Chen' THEN 'Chen'
    WHEN u.name = 'Omar Ibrahim' THEN 'Ibrahim'
    WHEN u.name = 'Fatima El-Sayed' THEN 'El-Sayed'
    WHEN u.name = 'John Smith' THEN 'Smith'
    WHEN u.name = 'Layla Ahmed' THEN 'Ahmed'
  END as lastNameEn,
  CASE 
    WHEN u.name = 'Ahmed Hassan' THEN 'أحمد'
    WHEN u.name = 'Mohamed Ali' THEN 'محمد'
    WHEN u.name = 'Omar Ibrahim' THEN 'عمر'
    WHEN u.name = 'Fatima El-Sayed' THEN 'فاطمة'
    WHEN u.name = 'Layla Ahmed' THEN 'ليلى'
    ELSE NULL
  END as firstNameAr,
  CASE 
    WHEN u.name = 'Ahmed Hassan' THEN 'حسن'
    WHEN u.name = 'Mohamed Ali' THEN 'علي'
    WHEN u.name = 'Omar Ibrahim' THEN 'إبراهيم'
    WHEN u.name = 'Fatima El-Sayed' THEN 'السيد'
    WHEN u.name = 'Layla Ahmed' THEN 'أحمد'
    ELSE NULL
  END as lastNameAr,
  DATE_SUB(NOW(), INTERVAL 30 YEAR) as dateOfBirth,
  CASE 
    WHEN u.preferredLanguage = 'ar' THEN 'Egypt'
    ELSE 'United States'
  END as nationality,
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
  u.preferredLanguage as preferredLanguage,
  CASE 
    WHEN u.preferredLanguage = 'ar' THEN 'EGP'
    ELSE 'USD'
  END as preferredCurrency,
  NOW() as createdAt,
  NOW() as updatedAt
FROM users u
WHERE u.openId LIKE 'investor_%' OR u.openId LIKE 'admin_%';

-- Sample admin permissions
INSERT INTO admin_permissions (userId, canManageUsers, canEditContent, canManageProperties, canReviewKYC, canApproveInvestments, canManageTransactions, canViewFinancials, canAccessCRM, canViewAnalytics, canManageSettings, createdAt, updatedAt)
SELECT 
  u.id,
  CASE WHEN u.name = 'Fatima El-Sayed' THEN TRUE ELSE FALSE END,
  TRUE,
  TRUE,
  CASE WHEN u.name = 'John Smith' THEN TRUE ELSE FALSE END,
  CASE WHEN u.name = 'Fatima El-Sayed' THEN TRUE ELSE FALSE END,
  FALSE,
  TRUE,
  TRUE,
  TRUE,
  CASE WHEN u.name = 'Fatima El-Sayed' THEN TRUE ELSE FALSE END,
  NOW(),
  NOW()
FROM users u
WHERE u.role = 'admin';
