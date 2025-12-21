-- Seed permissions data for Emtelaak Platform
-- This creates all the default permissions for the platform

-- Users permissions
INSERT INTO permissions (name, description, category) VALUES
('users.view', 'View user list and details', 'Users'),
('users.create', 'Create new users', 'Users'),
('users.edit', 'Edit user information', 'Users'),
('users.delete', 'Delete users', 'Users'),
('users.manage_roles', 'Assign roles to users', 'Users');

-- KYC permissions
INSERT INTO permissions (name, description, category) VALUES
('kyc.view', 'View KYC submissions', 'Kyc'),
('kyc.review', 'Review and approve/reject KYC', 'Kyc'),
('kyc.export', 'Export KYC data', 'Kyc');

-- Properties permissions
INSERT INTO permissions (name, description, category) VALUES
('properties.view', 'View all properties', 'Properties'),
('properties.create', 'Create new properties', 'Properties'),
('properties.edit', 'Edit property information', 'Properties'),
('properties.delete', 'Delete properties', 'Properties'),
('properties.approve', 'Approve property listings', 'Properties');

-- Offerings permissions
INSERT INTO permissions (name, description, category) VALUES
('offerings.view', 'View all offerings', 'Offerings'),
('offerings.create', 'Create new offerings', 'Offerings'),
('offerings.edit', 'Edit offering information', 'Offerings'),
('offerings.delete', 'Delete offerings', 'Offerings'),
('offerings.approve', 'Approve offerings', 'Offerings');

-- Investments permissions
INSERT INTO permissions (name, description, category) VALUES
('investments.view', 'View all investments', 'Investments'),
('investments.manage', 'Manage investments', 'Investments'),
('investments.export', 'Export investment data', 'Investments');

-- Wallet permissions
INSERT INTO permissions (name, description, category) VALUES
('wallet.view', 'View wallet transactions', 'Wallet'),
('wallet.manage', 'Manage wallet operations', 'Wallet'),
('wallet.approve_withdrawals', 'Approve withdrawal requests', 'Wallet');

-- Reports permissions
INSERT INTO permissions (name, description, category) VALUES
('reports.view', 'View reports and analytics', 'Reports'),
('reports.export', 'Export reports', 'Reports');

-- Settings permissions
INSERT INTO permissions (name, description, category) VALUES
('settings.view', 'View platform settings', 'Settings'),
('settings.edit', 'Edit platform settings', 'Settings');

-- Content permissions
INSERT INTO permissions (name, description, category) VALUES
('content.view', 'View content management', 'Content'),
('content.edit', 'Edit platform content', 'Content');

-- Invoices permissions
INSERT INTO permissions (name, description, category) VALUES
('invoices.view', 'View invoices', 'Invoices'),
('invoices.create', 'Create invoices', 'Invoices'),
('invoices.manage', 'Manage invoices', 'Invoices');

-- Access Requests permissions
INSERT INTO permissions (name, description, category) VALUES
('access_requests.view', 'View access requests', 'Access Requests'),
('access_requests.manage', 'Manage access requests', 'Access Requests');

-- Audit permissions
INSERT INTO permissions (name, description, category) VALUES
('audit.view', 'View audit logs', 'Audit'),
('audit.export', 'Export audit logs', 'Audit');
