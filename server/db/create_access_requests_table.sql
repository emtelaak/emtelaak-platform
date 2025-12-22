-- Create access_requests table for Private Mode Registration
-- Run this on TiDB Cloud

USE emtelaak;

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
  reviewedBy INT,
  reviewedAt TIMESTAMP NULL,
  reviewNotes TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX access_requests_email_idx (email),
  INDEX access_requests_status_idx (status),
  FOREIGN KEY (reviewedBy) REFERENCES users(id) ON DELETE SET NULL
);

-- Verify the table was created
DESCRIBE access_requests;
