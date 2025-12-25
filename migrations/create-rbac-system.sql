-- =====================================================
-- RBAC System Migration
-- Role-Based Access Control with Menu Visibility Management
-- =====================================================

-- 1. Create Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default roles
INSERT INTO roles (name, description, is_system_role) VALUES
('super_admin', 'Super Administrator with full system access', TRUE),
('admin', 'Administrator with limited system access', TRUE),
('investor', 'Regular investor user', TRUE),
('guest', 'Guest user with limited access', TRUE)
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- 2. Create Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_permission_name (name),
  INDEX idx_permission_resource (resource)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('view_dashboard', 'View dashboard page', 'dashboard', 'view'),
('view_properties', 'View properties page', 'properties', 'view'),
('manage_properties', 'Manage properties', 'properties', 'manage'),
('view_portfolio', 'View investment portfolio', 'portfolio', 'view'),
('manage_portfolio', 'Manage investment portfolio', 'portfolio', 'manage'),
('view_transactions', 'View transaction history', 'transactions', 'view'),
('manage_transactions', 'Manage transactions', 'transactions', 'manage'),
('view_users', 'View system users', 'users', 'view'),
('manage_users', 'Manage system users', 'users', 'manage'),
('view_roles', 'View roles and permissions', 'roles', 'view'),
('manage_roles', 'Manage roles and permissions', 'roles', 'manage'),
('view_reports', 'View system reports', 'reports', 'view'),
('manage_reports', 'Manage system reports', 'reports', 'manage'),
('view_settings', 'View system settings', 'settings', 'view'),
('manage_settings', 'Manage system settings', 'settings', 'manage'),
('manage_menu', 'Manage menu visibility', 'menu', 'manage')
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- 3. Create Role_Permissions Junction Table
CREATE TABLE IF NOT EXISTS role_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  granted_by INT NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_role_permission (role_id, permission_id),
  INDEX idx_role_id (role_id),
  INDEX idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Assign permissions to Super Admin (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'super_admin'),
  id
FROM permissions
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Assign permissions to Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'admin'),
  id
FROM permissions
WHERE name IN (
  'view_dashboard',
  'view_properties',
  'manage_properties',
  'view_users',
  'view_transactions',
  'view_reports'
)
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Assign permissions to Investor
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'investor'),
  id
FROM permissions
WHERE name IN (
  'view_dashboard',
  'view_properties',
  'view_portfolio',
  'manage_portfolio',
  'view_transactions'
)
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Guest has no special permissions (only public pages)

-- 4. Create Menu_Items Table
CREATE TABLE IF NOT EXISTS menu_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  label_en VARCHAR(100) NOT NULL,
  label_ar VARCHAR(100) NOT NULL,
  path VARCHAR(255),
  icon VARCHAR(50),
  parent_id INT NULL,
  order_index INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  permission_required VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_required) REFERENCES permissions(name) ON DELETE SET NULL,
  INDEX idx_menu_name (name),
  INDEX idx_menu_parent (parent_id),
  INDEX idx_menu_order (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default menu items
INSERT INTO menu_items (name, label_en, label_ar, path, icon, order_index, permission_required) VALUES
('home', 'Home', 'الرئيسية', '/', 'Home', 1, NULL),
('properties', 'Properties', 'العقارات', '/properties', 'Building2', 2, 'view_properties'),
('how_it_works', 'How It Works', 'كيف يعمل', '/how-it-works', 'HelpCircle', 3, NULL),
('about', 'About', 'من نحن', '/about', 'Info', 4, NULL),
('faq', 'FAQ', 'الأسئلة الشائعة', '/faq', 'MessageCircle', 5, NULL),
('contact', 'Contact', 'اتصل بنا', '/contact', 'Mail', 6, NULL),
('dashboard', 'Dashboard', 'لوحة التحكم', '/dashboard', 'LayoutDashboard', 7, 'view_dashboard'),
('portfolio', 'Portfolio', 'محفظتي', '/portfolio', 'Wallet', 8, 'view_portfolio'),
('transactions', 'Transactions', 'المعاملات', '/transactions', 'Receipt', 9, 'view_transactions'),
('admin', 'Admin Panel', 'لوحة الإدارة', '/admin', 'Shield', 10, 'manage_users')
ON DUPLICATE KEY UPDATE label_en=VALUES(label_en), label_ar=VALUES(label_ar);

-- 5. Create Role_Menu_Visibility Table
CREATE TABLE IF NOT EXISTS role_menu_visibility (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL,
  menu_item_id INT NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_role_menu (role_id, menu_item_id),
  INDEX idx_role_menu_role (role_id),
  INDEX idx_role_menu_item (menu_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Set default visibility for all roles and menu items
INSERT INTO role_menu_visibility (role_id, menu_item_id, is_visible)
SELECT r.id, m.id, TRUE
FROM roles r
CROSS JOIN menu_items m
ON DUPLICATE KEY UPDATE is_visible=is_visible;

-- Hide admin panel from guests
UPDATE role_menu_visibility 
SET is_visible = FALSE
WHERE role_id = (SELECT id FROM roles WHERE name = 'guest')
AND menu_item_id = (SELECT id FROM menu_items WHERE name = 'admin');

-- Hide portfolio and transactions from guests
UPDATE role_menu_visibility 
SET is_visible = FALSE
WHERE role_id = (SELECT id FROM roles WHERE name = 'guest')
AND menu_item_id IN (
  SELECT id FROM menu_items WHERE name IN ('portfolio', 'transactions', 'dashboard')
);

-- 6. Add role_id to users table (if not exists)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role_id INT DEFAULT 3,
ADD CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(id);

-- Update existing users to have investor role by default
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'investor') WHERE role_id IS NULL;

-- 7. Create User_Roles Junction Table (for multiple roles per user - optional)
CREATE TABLE IF NOT EXISTS user_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_role (user_id, role_id),
  INDEX idx_user_id (user_id),
  INDEX idx_role_id_ur (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Create Audit Log for Menu Visibility Changes
CREATE TABLE IF NOT EXISTS menu_visibility_audit (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL,
  menu_item_id INT NOT NULL,
  is_visible BOOLEAN NOT NULL,
  changed_by INT NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_audit_role (role_id),
  INDEX idx_audit_menu (menu_item_id),
  INDEX idx_audit_changed_by (changed_by),
  INDEX idx_audit_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check roles
SELECT * FROM roles;

-- Check permissions
SELECT * FROM permissions;

-- Check role permissions
SELECT r.name as role, p.name as permission
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
ORDER BY r.name, p.name;

-- Check menu items
SELECT * FROM menu_items ORDER BY order_index;

-- Check menu visibility by role
SELECT r.name as role, m.name as menu_item, rmv.is_visible
FROM role_menu_visibility rmv
JOIN roles r ON rmv.role_id = r.id
JOIN menu_items m ON rmv.menu_item_id = m.id
ORDER BY r.name, m.order_index;
