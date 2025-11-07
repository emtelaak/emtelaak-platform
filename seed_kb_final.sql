-- Knowledge Base Articles for Emtelaak Platform (Final - matching actual schema)

-- First create categories (only columns that exist: id, name, description, displayOrder, createdAt)
INSERT INTO knowledge_base_categories (name, description, displayOrder, createdAt) VALUES
('Getting Started', 'Learn the basics of investing with Emtelaak', 1, NOW()),
('KYC & Verification', 'Identity verification and compliance requirements', 2, NOW()),
('Investments', 'How to invest in properties and manage your portfolio', 3, NOW()),
('Returns & Distributions', 'Understanding returns, dividends, and payouts', 4, NOW()),
('Account & Security', 'Managing your account and keeping it secure', 5, NOW()),
('Withdrawals & Transfers', 'How to withdraw funds and transfer money', 6, NOW()),
('Property Management', 'Understanding how properties are managed', 7, NOW()),
('Legal & Compliance', 'Legal information and regulatory compliance', 8, NOW());

-- Now create articles (check actual columns first, but likely: id, title, content, categoryId, tags, viewCount, helpfulCount, notHelpfulCount, status, publishedAt, createdAt)
INSERT INTO knowledge_base_articles (
  title, content, categoryId, tags, viewCount, helpfulCount, notHelpfulCount,
  status, publishedAt, createdAt
) VALUES

('What is Emtelaak and How Does it Work?',
'# What is Emtelaak?

Emtelaak is Egypt''s leading fractional real estate investment platform. Invest in premium properties with as little as $250.

## How It Works
1. Browse curated properties
2. Purchase affordable shares
3. Earn quarterly returns
4. Track performance
5. Exit when ready

## Why Choose Emtelaak?
- Low $250 minimum
- Professional management
- Portfolio diversification
- Full transparency
- Regulated & Sharia-compliant

Start investing today!',
(SELECT id FROM knowledge_base_categories WHERE name = 'Getting Started' LIMIT 1),
'getting started,how it works,introduction',
0, 0, 0, 'published', NOW(), NOW()),

('Complete Your KYC Verification',
'# KYC Verification

Required by Egyptian law for platform security.

## Required Documents
1. National ID or Passport
2. Proof of Address (within 3 months)
3. Selfie with ID

## Steps
1. Personal information
2. Financial profile
3. Document upload
4. Review (1-2 business days)

## Tips
- Use clear, well-lit photos
- Match names on all documents
- Current address proof

Contact: support@emtelaak.com',
(SELECT id FROM knowledge_base_categories WHERE name = 'KYC & Verification' LIMIT 1),
'kyc,verification,identity,documents',
0, 0, 0, 'published', NOW(), NOW()),

('How to Make Your First Investment',
'# First Investment Guide

## Prerequisites
- Complete KYC
- Fund wallet
- Read property details

## Steps
1. Browse properties
2. Review financials
3. Calculate returns
4. Click "Invest Now"
5. Monitor dashboard

## Tips
- Diversify across 3-5 properties
- Start with $250 minimum
- Hold 2-3 years minimum
- Read all documents

Happy investing!',
(SELECT id FROM knowledge_base_categories WHERE name = 'Investments' LIMIT 1),
'first investment,how to invest,buying shares',
0, 0, 0, 'published', NOW(), NOW()),

('Understanding Investment Returns',
'# Investment Returns

## Types
**Rental Income**: Quarterly distributions from rent
**Capital Gains**: Profit when property sells

## Schedule
- Q1: Mid-April
- Q2: Mid-July
- Q3: Mid-October
- Q4: Mid-January

## Fees
- Platform: 1-2%
- Management: 5-8%
- Maintenance: 2-3%
- Withdrawal: 0.5%

Track all returns in your Dashboard.',
(SELECT id FROM knowledge_base_categories WHERE name = 'Returns & Distributions' LIMIT 1),
'returns,distributions,rental income,dividends',
0, 0, 0, 'published', NOW(), NOW()),

('How to Withdraw Funds',
'# Withdrawing Funds

## Process
1. Go to Wallet
2. Enter amount (min $50)
3. Select bank account
4. Confirm
5. Receive in 1-2 days

## Fees
- Egypt: Free
- International: $15
- Conversion: +0.5%

## Limits
- Daily: $10,000
- Monthly: $50,000

Enable 2FA for security!',
(SELECT id FROM knowledge_base_categories WHERE name = 'Withdrawals & Transfers' LIMIT 1),
'withdrawal,bank transfer,payout',
0, 0, 0, 'published', NOW(), NOW()),

('Account Security Best Practices',
'# Security Guide

## Enable 2FA
1. Settings > Security
2. Scan QR code
3. Save backup codes

## Strong Passwords
- 12+ characters
- Mix of types
- Unique to Emtelaak
- Change every 6 months

## Avoid Phishing
Emtelaak NEVER asks for:
- Passwords via email
- 2FA codes
- External transfers

## Monitor Activity
- Check login history
- Review transactions
- Enable notifications
- Report suspicious activity

Stay safe!',
(SELECT id FROM knowledge_base_categories WHERE name = 'Account & Security' LIMIT 1),
'security,password,2fa,phishing',
0, 0, 0, 'published', NOW(), NOW()),

('Choosing the Right Property',
'# Property Selection Guide

## Key Factors
**Location**: Neighborhood, amenities, transport
**Type**: Residential, commercial, administrative
**Financials**: Yield, occupancy, appreciation
**Strategy**: Buy-to-let vs buy-to-sell

## Due Diligence
✓ Review prospectus
✓ Check location
✓ Analyze projections
✓ Verify documents
✓ Assess risks

## Diversification
- 40% Residential
- 30% Commercial
- 30% Administrative

Make informed decisions!',
(SELECT id FROM knowledge_base_categories WHERE name = 'Investments' LIMIT 1),
'property selection,due diligence,strategy',
0, 0, 0, 'published', NOW(), NOW()),

('Tax Information for Investors',
'# Tax Obligations

## Taxable Income
1. Rental income
2. Capital gains
3. Dividends

## Reporting
Emtelaak provides:
- Annual tax statements
- Distribution summaries
- Transaction history

## Deductions
- Platform fees
- Management costs
- Maintenance
- Transaction fees

**Disclaimer**: Consult a tax professional. This is general information only.

Questions: tax@emtelaak.com',
(SELECT id FROM knowledge_base_categories WHERE name = 'Legal & Compliance' LIMIT 1),
'tax,taxation,income tax,capital gains',
0, 0, 0, 'published', NOW(), NOW()),

('Secondary Market Guide',
'# Selling Your Shares

## What is It?
Marketplace to sell shares before property sale.

## How to List
1. Go to Portfolio
2. Select property
3. Click "Sell Shares"
4. Set price
5. List for sale

## Pricing Options
- Market price (faster)
- Premium (higher profit)
- Auction (best price)

## Fees
- Seller: 2%
- Buyer: 1%
- Transfer: $5

## Tips
- Price competitively
- Respond quickly
- Be flexible

Access from Dashboard!',
(SELECT id FROM knowledge_base_categories WHERE name = 'Investments' LIMIT 1),
'secondary market,selling shares,liquidity',
0, 0, 0, 'published', NOW(), NOW()),

('Getting Help and Support',
'# Customer Support

## Self-Service
- Knowledge Base articles
- FAQs
- Video tutorials

## Live Support
**Chat**: 9 AM - 6 PM EGT (Sun-Thu)
**Email**: support@emtelaak.com (24hr)
**Phone**: +20 2 1234 5678 (urgent)

## Support Categories
- Technical issues
- Account questions
- Investment help
- Complaints

## Response Times
- Chat: Immediate
- Email: 24 hours
- Phone: Business hours
- Tickets: 1-2 days

We''re here to help!',
(SELECT id FROM knowledge_base_categories WHERE name = 'Account & Security' LIMIT 1),
'support,help,customer service,contact',
0, 0, 0, 'published', NOW(), NOW());
