# Database Schema Design: Investor Classification and Investment Limits

This document outlines the proposed database schema changes to implement the Investor Classification Engine (Module 2) and Investment Limit Enforcement (Module 3) in compliance with FRA regulations.

## 1. New Tables

Two new tables will be created to manage investor classifications and investment limits.

### `investor_classifications`

This table will store the assigned classification for each investor based on their profile, KYC data, and knowledge test results.

| Column Name         | Data Type                               | Description                                                                 |
| ------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| `id`                | `INT` (Primary Key, Auto-increment)     | Unique identifier for the classification record.                            |
| `userId`            | `INT` (Foreign Key to `users.id`)       | The user (investor) this classification belongs to.                         |
| `classification`    | `ENUM('retail', 'qualified', 'institutional')` | The investor's classification level.                                        |
| `determinationDate` | `TIMESTAMP`                             | The date when the classification was determined.                            |
| `reviewDate`        | `TIMESTAMP`                             | The date for the next scheduled review of the classification.               |
| `determinedBy`      | `INT` (Foreign Key to `users.id`)       | The admin user who determined or last reviewed the classification.          |
| `notes`             | `TEXT`                                  | Any notes or justification for the classification.                          |

### `investment_limits`

This table will store the specific investment limits applicable to each investor based on their classification.

| Column Name       | Data Type                               | Description                                                                 |
| ----------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| `id`              | `INT` (Primary Key, Auto-increment)     | Unique identifier for the investment limit record.                          |
| `userId`          | `INT` (Foreign Key to `users.id`)       | The user (investor) this limit applies to.                                  |
| `limitType`       | `ENUM('per_offering', 'annual_total')`  | The type of investment limit (e.g., per single offering, total per year).   |
| `limitAmount`     | `DECIMAL(15, 2)`                        | The maximum amount for this limit.                                          |
| `currency`        | `VARCHAR(10)`                           | The currency of the limit amount (e.g., 'EGP', 'USD').                      |
| `effectiveDate`   | `TIMESTAMP`                             | The date when this limit becomes effective.                                 |
| `expiryDate`      | `TIMESTAMP`                             | The date when this limit expires.                                           |

## 2. Modifications to Existing Tables

To integrate the new system, the following tables will be modified.

### `investor_qualification_status`

A new column will be added to link the qualification status to the new classification system.

| Column Name        | Data Type                               | Description                                                                 |
| ------------------ | --------------------------------------- | --------------------------------------------------------------------------- |
| `classificationId` | `INT` (Foreign Key to `investor_classifications.id`) | Links the qualification status to the specific classification record.       |

### `investment_limit_tracking`

A new column will be added to associate each tracked investment with a specific limit.

| Column Name | Data Type                               | Description                                                                 |
| ----------- | --------------------------------------- | --------------------------------------------------------------------------- |
| `limitId`   | `INT` (Foreign Key to `investment_limits.id`) | Links the investment record to the specific investment limit being enforced. |

## 3. Business Logic Overview

- **Automatic Classification**: A nightly cron job or a trigger-based system will run to automatically classify investors based on a set of rules. These rules will consider:
    - KYC data (e.g., `annualIncome`, `netWorth`, `investmentExperience`).
    - Knowledge test scores and pass/fail status from `knowledge_test_attempts`.
    - Document verification status from `kyc_documents` (e.g., `accreditation`).
- **Manual Override**: Admins will have the ability to manually override the automatic classification and set a different classification with justification.
- **Limit Enforcement**: When an investor attempts to make an investment, the system will:
    1.  Check their current classification in `investor_classifications`.
    2.  Retrieve their active investment limits from `investment_limits`.
    3.  Verify that the new investment amount does not exceed the `per_offering` limit.
    4.  Calculate the investor's total investment for the year and ensure it does not exceed the `annual_total` limit.
    5.  If all checks pass, the investment is allowed to proceed, and a record is added to `investment_limit_tracking`.

This schema provides a robust foundation for implementing the required FRA compliance features.
