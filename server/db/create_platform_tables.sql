-- Migration script for platform access control tables
-- Run this on TiDB Cloud to create the required tables

USE emtelaak;

-- Create access_requests table (if not exists)
CREATE TABLE IF NOT EXISTS access_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fullName VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  phone VARCHAR(20),
  country VARCHAR(100),
  investmentInterest VARCHAR(100),
  investmentBudget VARCHAR(100),
  message TEXT,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  invitationCode VARCHAR(20),
  rejectionReason TEXT,
  reviewedBy INT,
  reviewedAt TIMESTAMP NULL,
  reviewNotes TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX access_requests_email_idx (email),
  INDEX access_requests_status_idx (status),
  FOREIGN KEY (reviewedBy) REFERENCES users(id) ON DELETE SET NULL
);

-- Create platform_invitations table (required for invitation codes)
CREATE TABLE IF NOT EXISTS platform_invitations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(320),
  maxUses INT NOT NULL DEFAULT 1,
  usedCount INT NOT NULL DEFAULT 0,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  expiresAt TIMESTAMP NULL,
  createdBy INT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX platform_invitations_code_idx (code),
  INDEX platform_invitations_email_idx (email),
  FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL
);

-- Verify tables were created
SHOW TABLES LIKE '%access%';
SHOW TABLES LIKE '%invitation%';

-- Check table structures
DESCRIBE access_requests;
DESCRIBE platform_invitations;
