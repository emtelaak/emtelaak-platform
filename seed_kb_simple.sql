-- Knowledge Base Articles for Emtelaak Platform (Simplified)

-- First create categories
INSERT INTO knowledge_base_categories (name, description, displayOrder, createdAt, updatedAt) VALUES
('Getting Started', 'Learn the basics of investing with Emtelaak', 1, NOW(), NOW()),
('KYC & Verification', 'Identity verification and compliance requirements', 2, NOW(), NOW()),
('Investments', 'How to invest in properties and manage your portfolio', 3, NOW(), NOW()),
('Returns & Distributions', 'Understanding returns, dividends, and payouts', 4, NOW(), NOW()),
('Account & Security', 'Managing your account and keeping it secure', 5, NOW(), NOW()),
('Withdrawals & Transfers', 'How to withdraw funds and transfer money', 6, NOW(), NOW()),
('Property Management', 'Understanding how properties are managed', 7, NOW(), NOW()),
('Legal & Compliance', 'Legal information and regulatory compliance', 8, NOW(), NOW());

-- Now create articles (using only English content for simplicity)
INSERT INTO knowledge_base_articles (
  title, content, categoryId, tags, viewCount, helpfulCount, notHelpfulCount,
  status, publishedAt, createdAt, updatedAt
) VALUES

-- Article 1: What is Emtelaak
(
  'What is Emtelaak and How Does it Work?',
  '# What is Emtelaak?

Emtelaak is Egypt''s leading fractional real estate investment platform that allows you to invest in premium properties with as little as $250. We democratize real estate investment by breaking down high-value properties into affordable shares.

## How It Works

1. **Browse Properties**: Explore our curated selection of residential, commercial, and administrative properties
2. **Invest**: Purchase shares in properties that match your investment goals
3. **Earn Returns**: Receive quarterly rental income distributions
4. **Track Performance**: Monitor your portfolio through our dashboard
5. **Exit**: Sell your shares on our secondary market when ready

## Why Choose Emtelaak?

- **Low Minimum Investment**: Start with just $250
- **Professional Management**: We handle property management, tenants, and maintenance
- **Diversification**: Spread your investment across multiple properties
- **Transparency**: Real-time portfolio tracking and detailed reporting
- **Compliance**: Fully regulated and Sharia-compliant investment options

Start your real estate investment journey today with Emtelaak!',
  
  (SELECT id FROM knowledge_base_categories WHERE name = 'Getting Started' LIMIT 1),
  'getting started,how it works,introduction,basics',
  0, 0, 0,
  'published',
  NOW(), NOW(), NOW()
),

-- Article 2: KYC Process
(
  'Complete Your KYC Verification',
  '# KYC Verification Process

Know Your Customer (KYC) verification is required by Egyptian financial regulations to prevent fraud and ensure platform security.

## Required Documents

1. **National ID or Passport**: Valid government-issued identification
2. **Proof of Address**: Utility bill or bank statement (within 3 months)
3. **Selfie Verification**: Photo holding your ID document

## Verification Steps

1. **Personal Information**: Full name, date of birth, nationality, contact info
2. **Financial Profile**: Employment status, income range, investment experience
3. **Document Upload**: Upload clear photos of required documents
4. **Review**: Our team reviews submissions within 1-2 business days

## Tips for Fast Approval

- Use high-quality, well-lit photos
- Ensure all document corners are visible
- Match the name on all documents
- Provide current address proof

Need help? Contact our support team at support@emtelaak.com',
  
  (SELECT id FROM knowledge_base_categories WHERE name = 'KYC & Verification' LIMIT 1),
  'kyc,verification,identity,documents,compliance',
  0, 0, 0,
  'published',
  NOW(), NOW(), NOW()
),

-- Article 3: First Investment
(
  'How to Make Your First Investment',
  '# Making Your First Investment

Ready to start investing in real estate? Follow this guide to make your first investment on Emtelaak.

## Prerequisites

- Complete KYC verification
- Add funds to your wallet
- Read property details and documents

## Investment Steps

1. **Browse Properties**: Use filters to find properties matching your criteria
2. **Review Details**: Check financial projections, location, and terms
3. **Calculate Investment**: Use our calculator to estimate returns
4. **Invest**: Click "Invest Now" and confirm your investment
5. **Track**: Monitor performance in your Dashboard

## Investment Tips

- **Diversify**: Spread investments across 3-5 properties
- **Start Small**: Begin with minimum investment
- **Long-term**: Plan to hold for at least 2-3 years
- **Read Documents**: Review prospectus before investing

Minimum investment: $250 per property

Happy investing!',
  
  (SELECT id FROM knowledge_base_categories WHERE name = 'Investments' LIMIT 1),
  'first investment,how to invest,getting started,buying shares',
  0, 0, 0,
  'published',
  NOW(), NOW(), NOW()
),

-- Article 4: Returns
(
  'Understanding Investment Returns',
  '# Investment Returns Explained

Learn how you earn money from your Emtelaak investments.

## Types of Returns

### Rental Income (Buy-to-Let)
Regular income from tenant rent, distributed quarterly.

Example: $1,000 investment at 9% annual yield = $22.50 quarterly

### Capital Appreciation (Buy-to-Sell)
Profit from property value increase, paid when sold.

## Distribution Schedule

Quarterly distributions paid within 15 days after quarter end:
- Q1: Mid-April
- Q2: Mid-July
- Q3: Mid-October
- Q4: Mid-January

## Fees

- Platform Fee: 1-2% of distributions
- Property Management: 5-8% of rental income
- Maintenance Reserve: 2-3%
- Withdrawal Fee: 0.5%

## Tracking Returns

Monitor performance in your Dashboard:
- Total returns to date
- Distribution history
- Annualized return rate
- Property breakdown

Start earning passive income today!',
  
  (SELECT id FROM knowledge_base_categories WHERE name = 'Returns & Distributions' LIMIT 1),
  'returns,distributions,rental income,dividends,payouts',
  0, 0, 0,
  'published',
  NOW(), NOW(), NOW()
),

-- Article 5: Withdrawals
(
  'How to Withdraw Funds',
  '# Withdrawing Funds

Transfer money from your Emtelaak wallet to your bank account.

## Withdrawal Process

1. Navigate to Wallet
2. Enter amount (minimum $50)
3. Select bank account
4. Confirm withdrawal
5. Receive funds in 1-2 business days

## Fees

- Local transfers (Egypt): Free
- International transfers: $15
- Currency conversion: Market rate + 0.5%

## Limits

- Daily: $10,000
- Monthly: $50,000

## Important Notes

- Withdrawals only to accounts in your name
- Bank account must be verified first
- Funds must be in wallet (not invested)
- Minimum $10 balance required

## Security

- Enable two-factor authentication
- Use strong passwords
- Verify bank details carefully
- Report suspicious activity

Need help? Contact support@emtelaak.com',
  
  (SELECT id FROM knowledge_base_categories WHERE name = 'Withdrawals & Transfers' LIMIT 1),
  'withdrawal,bank transfer,payout,cash out',
  0, 0, 0,
  'published',
  NOW(), NOW(), NOW()
),

-- Article 6: Account Security
(
  'Keeping Your Account Secure',
  '# Account Security Best Practices

Protect your Emtelaak account and investments with these security measures.

## Enable Two-Factor Authentication (2FA)

Add an extra layer of security:
1. Go to Settings > Security
2. Click "Enable 2FA"
3. Scan QR code with authenticator app
4. Enter verification code
5. Save backup codes

## Strong Password Guidelines

- At least 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- Unique to Emtelaak (don''t reuse)
- Change every 6 months
- Use a password manager

## Recognize Phishing Attempts

Emtelaak will NEVER:
- Ask for your password via email
- Request 2FA codes
- Send unsolicited investment offers
- Ask you to transfer funds externally

## Secure Your Devices

- Keep software updated
- Use antivirus protection
- Avoid public WiFi for transactions
- Lock devices when not in use
- Log out after each session

## Monitor Account Activity

- Review login history regularly
- Check transaction history
- Set up email notifications
- Report unauthorized activity immediately

## If Your Account is Compromised

1. Change password immediately
2. Enable/reset 2FA
3. Contact support@emtelaak.com
4. Review recent transactions
5. Update security questions

Stay safe and invest with confidence!',
  
  (SELECT id FROM knowledge_base_categories WHERE name = 'Account & Security' LIMIT 1),
  'security,password,2fa,phishing,account safety',
  0, 0, 0,
  'published',
  NOW(), NOW(), NOW()
),

-- Article 7: Property Selection
(
  'How to Choose the Right Property',
  '# Choosing Investment Properties

Make informed decisions with our property selection guide.

## Key Factors to Consider

### 1. Location
- Neighborhood quality
- Proximity to amenities
- Transportation access
- Development plans
- Market demand

### 2. Property Type
- **Residential**: Apartments, villas - stable rental income
- **Commercial**: Offices, retail - higher returns, more risk
- **Administrative**: Office buildings - long-term leases

### 3. Financial Metrics
- **Rental Yield**: Annual rent / property value
- **Occupancy Rate**: Historical and projected
- **Appreciation Potential**: Market trends
- **Break-even Point**: Time to recover investment

### 4. Investment Strategy
- **Buy-to-Let**: Steady income, lower risk
- **Buy-to-Sell**: Capital gains, higher risk
- **Mixed Portfolio**: Balance of both

## Due Diligence Checklist

✓ Review property prospectus
✓ Check location on map
✓ Analyze financial projections
✓ Read tenant agreements
✓ Verify legal documentation
✓ Assess risk factors
✓ Compare with similar properties

## Red Flags to Avoid

- Unrealistic return projections
- Poor location or condition
- High vacancy rates
- Unclear ownership structure
- Missing documentation
- Excessive fees

## Diversification Strategy

Don''t put all eggs in one basket:
- 40% Residential (stable income)
- 30% Commercial (higher returns)
- 30% Administrative (long-term growth)

Or spread across:
- Different locations
- Various property types
- Multiple investment strategies

## Questions to Ask

1. What is the occupancy history?
2. Who manages the property?
3. What are the maintenance costs?
4. Are there any legal issues?
5. What is the exit strategy?
6. How liquid is the investment?

Make smart choices and build wealth through real estate!',
  
  (SELECT id FROM knowledge_base_categories WHERE name = 'Investments' LIMIT 1),
  'property selection,due diligence,investment strategy,diversification',
  0, 0, 0,
  'published',
  NOW(), NOW(), NOW()
),

-- Article 8: Tax Information
(
  'Tax Implications of Real Estate Investment',
  '# Understanding Tax Obligations

Important tax information for Emtelaak investors.

## Types of Taxable Income

### 1. Rental Income
- Subject to personal income tax
- Taxed at your marginal rate
- Reported annually

### 2. Capital Gains
- Profit from property sale
- May be taxed upon realization
- Rates vary by holding period

### 3. Dividends
- Distributions from property income
- Withholding tax may apply

## Tax Reporting

Emtelaak provides:
- Annual tax statements
- Distribution summaries
- Capital gains reports
- Transaction history

## Deductions

Potential deductions may include:
- Platform fees
- Management costs
- Maintenance expenses
- Transaction fees

## Tax-Advantaged Strategies

- Hold investments long-term
- Reinvest distributions
- Offset gains with losses
- Consider tax-efficient accounts

## International Investors

- Different tax treaties apply
- Withholding tax on distributions
- Foreign tax credit eligibility
- Report in home country

## Important Notes

- Tax laws change frequently
- Individual situations vary
- Consult a tax professional
- Keep detailed records

**Disclaimer**: This is general information only. Emtelaak does not provide tax advice. Consult a qualified tax advisor for personalized guidance.

For tax-related questions: tax@emtelaak.com',
  
  (SELECT id FROM knowledge_base_categories WHERE name = 'Legal & Compliance' LIMIT 1),
  'tax,taxation,income tax,capital gains,tax reporting',
  0, 0, 0,
  'published',
  NOW(), NOW(), NOW()
),

-- Article 9: Secondary Market
(
  'Selling Your Shares on the Secondary Market',
  '# Secondary Market Guide

Learn how to sell your property shares before the property is sold.

## What is the Secondary Market?

A marketplace where investors can buy and sell shares from each other, providing liquidity before property sale.

## How to List Your Shares

1. Go to Portfolio
2. Select property
3. Click "Sell Shares"
4. Set your price
5. List for sale

## Pricing Your Shares

Consider:
- Current property valuation
- Distributions received
- Market demand
- Time to expected sale
- Your urgency to sell

## Listing Options

### Market Price
- Sell at current market value
- Faster sale
- Lower profit margin

### Premium Pricing
- Set price above market
- Slower sale
- Higher profit if sold

### Auction
- Let buyers bid
- Best price discovery
- Takes more time

## Transaction Process

1. Buyer places order
2. Funds held in escrow
3. Shares transferred
4. Payment released
5. Both parties notified

## Fees

- Seller fee: 2% of transaction
- Buyer fee: 1% of transaction
- Transfer processing: $5

## Tips for Successful Sales

- Price competitively
- Provide property updates
- Respond to inquiries quickly
- Be flexible on price
- Consider partial sales

## Liquidity Considerations

- Not all properties have active markets
- Sales may take time
- Price may be below initial investment
- Consider holding to maturity

## Tax Implications

- Capital gains may apply
- Report on annual tax return
- Losses may be deductible
- Consult tax advisor

Access the secondary market from your Dashboard today!',
  
  (SELECT id FROM knowledge_base_categories WHERE name = 'Investments' LIMIT 1),
  'secondary market,selling shares,liquidity,exit strategy',
  0, 0, 0,
  'published',
  NOW(), NOW(), NOW()
),

-- Article 10: Customer Support
(
  'Getting Help and Support',
  '# Customer Support Resources

Multiple ways to get help when you need it.

## Self-Service Resources

### Knowledge Base
Browse articles on common topics:
- Getting started
- KYC verification
- Making investments
- Understanding returns
- Account management

### FAQs
Quick answers to frequently asked questions

### Video Tutorials
Step-by-step guides for key features

## Live Support

### Live Chat
- Available 9 AM - 6 PM EGT (Sunday-Thursday)
- Instant responses
- Multi-language support (English/Arabic)
- Click chat icon in bottom right

### Help Desk
- Submit support tickets
- Track ticket status
- Attach screenshots
- Receive email updates

### Email Support
- support@emtelaak.com
- Response within 24 hours
- For non-urgent inquiries

### Phone Support
- +20 2 1234 5678
- Business hours only
- For urgent matters

## Support Categories

**Technical Issues**
- Login problems
- Payment failures
- Website errors
- App issues

**Account Questions**
- KYC verification
- Account settings
- Password reset
- Profile updates

**Investment Help**
- Property questions
- Portfolio management
- Distribution inquiries
- Tax documentation

**Complaints**
- Service issues
- Dispute resolution
- Feedback and suggestions

## Response Times

- Live Chat: Immediate
- Email: Within 24 hours
- Phone: Immediate during business hours
- Tickets: 1-2 business days

## Before Contacting Support

Have ready:
- Account email
- User ID
- Description of issue
- Screenshots if applicable
- Steps to reproduce problem

## Escalation Process

If not satisfied:
1. Request supervisor review
2. Submit formal complaint
3. Contact compliance team
4. Regulatory authority (last resort)

## Community

Join our investor community:
- Facebook group
- LinkedIn page
- Monthly webinars
- Investor events

We''re here to help you succeed!

**Emergency Contact**: For urgent security issues, call +20 2 1234 5678 immediately.',
  
  (SELECT id FROM knowledge_base_categories WHERE name = 'Account & Security' LIMIT 1),
  'support,help,customer service,contact,assistance',
  0, 0, 0,
  'published',
  NOW(), NOW(), NOW()
);
