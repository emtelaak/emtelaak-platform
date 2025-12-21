-- Knowledge Base Articles for Emtelaak Platform

-- First create categories
INSERT INTO knowledge_base_categories (name, nameAr, description, descriptionAr, displayOrder, createdAt, updatedAt) VALUES
('Getting Started', 'البدء', 'Learn the basics of investing with Emtelaak', 'تعلم أساسيات الاستثمار مع امتلاك', 1, NOW(), NOW()),
('KYC & Verification', 'التحقق من الهوية', 'Identity verification and compliance requirements', 'متطلبات التحقق من الهوية والامتثال', 2, NOW(), NOW()),
('Investments', 'الاستثمارات', 'How to invest in properties and manage your portfolio', 'كيفية الاستثمار في العقارات وإدارة محفظتك', 3, NOW(), NOW()),
('Returns & Distributions', 'العوائد والتوزيعات', 'Understanding returns, dividends, and payouts', 'فهم العوائد والأرباح والمدفوعات', 4, NOW(), NOW()),
('Account & Security', 'الحساب والأمان', 'Managing your account and keeping it secure', 'إدارة حسابك والحفاظ على أمانه', 5, NOW(), NOW());

-- Now create articles
INSERT INTO knowledge_base_articles (
  title, titleAr, content, contentAr, categoryId, tags, viewCount, helpfulCount, notHelpfulCount,
  status, publishedAt, createdAt, updatedAt
) VALUES

-- Article 1: What is Emtelaak
(
  'What is Emtelaak and How Does it Work?',
  'ما هو امتلاك وكيف يعمل؟',
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

## Investment Types

### Buy-to-Let
Invest in rental properties and earn regular income from tenant rent payments. Ideal for investors seeking steady cash flow.

### Buy-to-Sell
Invest in properties targeted for appreciation and sale. Profit from capital gains when the property is sold.

Start your real estate investment journey today with Emtelaak!',
  
  '# ما هو امتلاك؟

امتلاك هي منصة الاستثمار العقاري الكسري الرائدة في مصر التي تتيح لك الاستثمار في العقارات المتميزة بمبلغ يبدأ من 250 دولاراً فقط. نحن نجعل الاستثمار العقاري متاحاً للجميع من خلال تقسيم العقارات عالية القيمة إلى حصص ميسورة التكلفة.

## كيف يعمل

1. **تصفح العقارات**: استكشف مجموعتنا المختارة من العقارات السكنية والتجارية والإدارية
2. **استثمر**: اشترِ حصصاً في العقارات التي تتوافق مع أهدافك الاستثمارية
3. **احصل على العوائد**: استلم توزيعات الدخل الإيجاري ربع السنوية
4. **تتبع الأداء**: راقب محفظتك من خلال لوحة التحكم
5. **الخروج**: بع حصصك في السوق الثانوية عندما تكون مستعداً

## لماذا تختار امتلاك؟

- **حد أدنى منخفض للاستثمار**: ابدأ بـ 250 دولاراً فقط
- **إدارة احترافية**: نحن نتولى إدارة العقارات والمستأجرين والصيانة
- **التنويع**: وزع استثمارك عبر عقارات متعددة
- **الشفافية**: تتبع المحفظة في الوقت الفعلي وتقارير مفصلة
- **الامتثال**: خيارات استثمارية منظمة بالكامل ومتوافقة مع الشريعة

## أنواع الاستثمار

### الشراء للتأجير
استثمر في العقارات المؤجرة واحصل على دخل منتظم من مدفوعات الإيجار. مثالي للمستثمرين الباحثين عن تدفق نقدي ثابت.

### الشراء للبيع
استثمر في العقارات المستهدفة للنمو والبيع. استفد من مكاسب رأس المال عند بيع العقار.

ابدأ رحلة الاستثمار العقاري اليوم مع امتلاك!',
  
  (SELECT id FROM knowledge_base_categories WHERE name = 'Getting Started' LIMIT 1),
  'getting started,how it works,introduction,basics',
  0, 0, 0,
  'published',
  NOW(), NOW(), NOW()
),

-- Article 2: KYC Process
(
  'Complete Your KYC Verification',
  'أكمل التحقق من هويتك (KYC)',
  '# KYC Verification Process

Know Your Customer (KYC) verification is required by Egyptian financial regulations to prevent fraud and ensure platform security.

## Required Documents

1. **National ID or Passport**: Valid government-issued identification
2. **Proof of Address**: Utility bill or bank statement (within 3 months)
3. **Selfie Verification**: Photo holding your ID document

## Verification Steps

### Step 1: Personal Information
- Full name (English and Arabic)
- Date of birth
- Nationality
- Contact information
- Residential address

### Step 2: Financial Profile
- Employment status and occupation
- Annual income range
- Investment experience
- Source of funds

### Step 3: Document Upload
- Upload clear photos of required documents
- Ensure all information is visible and legible
- File formats: JPG, PNG, PDF (max 5MB each)

### Step 4: Review
Our compliance team reviews submissions within 1-2 business days. You''ll receive email notification once approved.

## Tips for Fast Approval

- ✓ Use high-quality, well-lit photos
- ✓ Ensure all document corners are visible
- ✓ Match the name on all documents
- ✓ Provide current address proof
- ✗ Don''t use edited or filtered images
- ✗ Don''t submit expired documents

## Common Rejection Reasons

1. **Blurry or unclear images**: Retake photos in good lighting
2. **Expired documents**: Renew your ID before submission
3. **Name mismatch**: Ensure consistency across all documents
4. **Incomplete information**: Fill all required fields

Need help? Contact our support team at support@emtelaak.com',
  
  '# عملية التحقق من الهوية (KYC)

التحقق من هوية العميل (KYC) مطلوب بموجب اللوائح المالية المصرية لمنع الاحتيال وضمان أمان المنصة.

## المستندات المطلوبة

1. **بطاقة الرقم القومي أو جواز السفر**: هوية حكومية سارية
2. **إثبات العنوان**: فاتورة مرافق أو كشف حساب بنكي (خلال 3 أشهر)
3. **التحقق بالصورة الشخصية**: صورة تحمل فيها مستند الهوية

## خطوات التحقق

### الخطوة 1: المعلومات الشخصية
- الاسم الكامل (بالإنجليزية والعربية)
- تاريخ الميلاد
- الجنسية
- معلومات الاتصال
- عنوان السكن

### الخطوة 2: الملف المالي
- حالة التوظيف والمهنة
- نطاق الدخل السنوي
- الخبرة الاستثمارية
- مصدر الأموال

### الخطوة 3: تحميل المستندات
- قم بتحميل صور واضحة للمستندات المطلوبة
- تأكد من أن جميع المعلومات مرئية ومقروءة
- صيغ الملفات: JPG، PNG، PDF (بحد أقصى 5 ميجابايت لكل منها)

### الخطوة 4: المراجعة
يقوم فريق الامتثال لدينا بمراجعة الطلبات خلال 1-2 يوم عمل. ستتلقى إشعاراً بالبريد الإلكتروني بمجرد الموافقة.

## نصائح للموافقة السريعة

- ✓ استخدم صوراً عالية الجودة ومضاءة جيداً
- ✓ تأكد من ظهور جميع زوايا المستند
- ✓ طابق الاسم في جميع المستندات
- ✓ قدم إثبات عنوان حالي
- ✗ لا تستخدم صوراً معدلة أو مفلترة
- ✗ لا تقدم مستندات منتهية الصلاحية

## أسباب الرفض الشائعة

1. **صور ضبابية أو غير واضحة**: أعد التقاط الصور في إضاءة جيدة
2. **مستندات منتهية الصلاحية**: جدد هويتك قبل التقديم
3. **عدم تطابق الأسماء**: تأكد من الاتساق في جميع المستندات
4. **معلومات غير مكتملة**: املأ جميع الحقول المطلوبة

تحتاج مساعدة؟ اتصل بفريق الدعم على support@emtelaak.com',
  
  (SELECT id FROM knowledge_base_categories WHERE name = 'KYC & Verification' LIMIT 1),
  'kyc,verification,identity,documents,compliance',
  0, 0, 0,
  'published',
  NOW(), NOW(), NOW()
),

-- Article 3: How to Make Your First Investment
(
  'How to Make Your First Investment',
  'كيفية إجراء أول استثمار لك',
  '# Making Your First Investment

Ready to start investing in real estate? Follow this step-by-step guide to make your first investment on Emtelaak.

## Prerequisites

Before investing, ensure you have:
- ✓ Completed KYC verification
- ✓ Added funds to your wallet
- ✓ Read the property details and documents

## Step-by-Step Guide

### 1. Browse Available Properties
Navigate to the Properties page and explore available investment opportunities. Use filters to find properties matching your criteria:
- Property type (residential, commercial, administrative)
- Investment type (buy-to-let, buy-to-sell)
- Minimum investment amount
- Expected returns
- Location

### 2. Review Property Details
Click on a property to view:
- Detailed description and photos
- Financial projections
- Location and amenities
- Investment terms
- Risk factors
- Legal documents

### 3. Calculate Your Investment
Use our investment calculator to:
- Determine number of shares to purchase
- Estimate monthly/quarterly returns
- Project total returns over investment period
- Understand fees and costs

### 4. Make Your Investment
1. Click "Invest Now"
2. Enter the number of shares or investment amount
3. Review the investment summary
4. Confirm your investment
5. Funds are deducted from your wallet

### 5. Track Your Investment
After investing:
- View your portfolio in the Dashboard
- Monitor property performance
- Receive distribution notifications
- Access investment documents

## Investment Tips

**Diversify**: Don''t put all your money in one property. Spread investments across 3-5 properties.

**Start Small**: Begin with the minimum investment to understand the platform before committing larger amounts.

**Long-term Perspective**: Real estate is typically a long-term investment. Plan to hold for at least 2-3 years.

**Read Documents**: Always review the property prospectus and legal documents before investing.

**Ask Questions**: Use our live chat or help desk if you have any questions about a property.

## Investment Limits

- Minimum per property: $250
- Maximum per property: No limit (subject to availability)
- Total portfolio: No limit

## Next Steps

1. Fund your wallet
2. Browse properties
3. Make your first investment
4. Monitor your returns

Happy investing!',
  
  '# إجراء أول استثمار لك

مستعد لبدء الاستثمار في العقارات؟ اتبع هذا الدليل خطوة بخطوة لإجراء أول استثمار لك على امتلاك.

## المتطلبات الأساسية

قبل الاستثمار، تأكد من:
- ✓ إكمال التحقق من الهوية (KYC)
- ✓ إضافة أموال إلى محفظتك
- ✓ قراءة تفاصيل العقار والمستندات

## دليل خطوة بخطوة

### 1. تصفح العقارات المتاحة
انتقل إلى صفحة العقارات واستكشف فرص الاستثمار المتاحة. استخدم المرشحات للعثور على العقارات التي تطابق معاييرك:
- نوع العقار (سكني، تجاري، إداري)
- نوع الاستثمار (شراء للتأجير، شراء للبيع)
- الحد الأدنى لمبلغ الاستثمار
- العوائد المتوقعة
- الموقع

### 2. مراجعة تفاصيل العقار
انقر على عقار لعرض:
- وصف مفصل وصور
- التوقعات المالية
- الموقع والمرافق
- شروط الاستثمار
- عوامل المخاطرة
- المستندات القانونية

### 3. احسب استثمارك
استخدم حاسبة الاستثمار لدينا من أجل:
- تحديد عدد الحصص المراد شراؤها
- تقدير العوائد الشهرية/ربع السنوية
- توقع إجمالي العوائد خلال فترة الاستثمار
- فهم الرسوم والتكاليف

### 4. قم بالاستثمار
1. انقر على "استثمر الآن"
2. أدخل عدد الحصص أو مبلغ الاستثمار
3. راجع ملخص الاستثمار
4. أكد استثمارك
5. يتم خصم الأموال من محفظتك

### 5. تتبع استثمارك
بعد الاستثمار:
- اعرض محفظتك في لوحة التحكم
- راقب أداء العقار
- استلم إشعارات التوزيع
- الوصول إلى مستندات الاستثمار

## نصائح الاستثمار

**التنويع**: لا تضع كل أموالك في عقار واحد. وزع الاستثمارات عبر 3-5 عقارات.

**ابدأ صغيراً**: ابدأ بالحد الأدنى للاستثمار لفهم المنصة قبل الالتزام بمبالغ أكبر.

**منظور طويل الأجل**: العقارات عادة استثمار طويل الأجل. خطط للاحتفاظ لمدة 2-3 سنوات على الأقل.

**اقرأ المستندات**: راجع دائماً نشرة العقار والمستندات القانونية قبل الاستثمار.

**اطرح الأسئلة**: استخدم الدردشة المباشرة أو مكتب المساعدة إذا كان لديك أي أسئلة حول عقار.

## حدود الاستثمار

- الحد الأدنى لكل عقار: 250 دولاراً
- الحد الأقصى لكل عقار: لا يوجد حد (حسب التوفر)
- إجمالي المحفظة: لا يوجد حد

## الخطوات التالية

1. قم بتمويل محفظتك
2. تصفح العقارات
3. قم بأول استثمار لك
4. راقب عوائدك

استثمار سعيد!',
  
  (SELECT id FROM knowledge_base_categories WHERE name = 'Investments' LIMIT 1),
  'first investment,how to invest,getting started,buying shares',
  0, 0, 0,
  'published',
  NOW(), NOW(), NOW()
);

-- Continue with more articles...
INSERT INTO knowledge_base_articles (
  title, titleAr, content, contentAr, categoryId, tags, viewCount, helpfulCount, notHelpfulCount,
  status, publishedAt, createdAt, updatedAt
) VALUES

-- Article 4: Understanding Returns
(
  'Understanding Investment Returns and Distributions',
  'فهم عوائد الاستثمار والتوزيعات',
  '# Investment Returns Explained

Learn how you earn money from your Emtelaak investments and when to expect distributions.

## Types of Returns

### 1. Rental Income (Buy-to-Let)
Regular income from tenant rent payments, distributed quarterly.

**Example**: If you invest $1,000 in a property with 9% annual yield:
- Annual return: $90
- Quarterly distribution: $22.50

### 2. Capital Appreciation (Buy-to-Sell)
Profit from property value increase, paid when the property is sold.

**Example**: Property purchased at $10M, sold at $12M after 3 years:
- Total appreciation: 20%
- Your share of profit distributed proportionally

## Distribution Schedule

**Quarterly Distributions**: Paid within 15 days after quarter end
- Q1: January-March (paid mid-April)
- Q2: April-June (paid mid-July)
- Q3: July-September (paid mid-October)
- Q4: October-December (paid mid-January)

## How Distributions Work

1. **Rental Collection**: Property manager collects rent from tenants
2. **Expense Deduction**: Operating costs, maintenance, and fees deducted
3. **Net Income Calculation**: Remaining amount is net distributable income
4. **Pro-rata Distribution**: Divided among investors based on ownership percentage
5. **Wallet Credit**: Your share credited to your Emtelaak wallet
6. **Withdrawal**: Transfer to your bank account or reinvest

## Fees and Costs

- **Platform Fee**: 1-2% of distributions (covers platform operations)
- **Property Management**: 5-8% of rental income (varies by property)
- **Maintenance Reserve**: 2-3% set aside for repairs
- **Transaction Fee**: 0.5% on withdrawals

## Projected vs. Actual Returns

**Projected Returns** are estimates based on:
- Market rental rates
- Occupancy assumptions
- Historical performance
- Property condition

**Actual Returns** may vary due to:
- Vacancy periods
- Maintenance costs
- Market conditions
- Tenant defaults

## Tax Considerations

- Rental income may be subject to income tax
- Capital gains may be taxable upon property sale
- Consult a tax advisor for personalized guidance
- Emtelaak provides annual tax statements

## Reinvesting Returns

Maximize compound growth by reinvesting distributions:
1. Enable auto-reinvest in settings
2. Choose target properties
3. Distributions automatically purchase new shares
4. Build wealth faster through compounding

## Tracking Your Returns

Monitor performance in your Dashboard:
- Total returns to date
- Distribution history
- Annualized return rate
- Property-by-property breakdown
- Comparison to projections

Start earning passive income from real estate today!',
  
  '# شرح عوائد الاستثمار

تعلم كيف تكسب المال من استثماراتك في امتلاك ومتى تتوقع التوزيعات.

## أنواع العوائد

### 1. الدخل الإيجاري (الشراء للتأجير)
دخل منتظم من مدفوعات إيجار المستأجرين، يتم توزيعه ربع سنوياً.

**مثال**: إذا استثمرت 1000 دولار في عقار بعائد سنوي 9٪:
- العائد السنوي: 90 دولاراً
- التوزيع ربع السنوي: 22.50 دولاراً

### 2. النمو الرأسمالي (الشراء للبيع)
الربح من زيادة قيمة العقار، يُدفع عند بيع العقار.

**مثال**: عقار تم شراؤه بـ 10 ملايين دولار، وبيع بـ 12 مليون دولار بعد 3 سنوات:
- إجمالي النمو: 20٪
- يتم توزيع حصتك من الربح بشكل متناسب

## جدول التوزيع

**التوزيعات ربع السنوية**: تُدفع خلال 15 يوماً بعد نهاية الربع
- الربع الأول: يناير-مارس (يُدفع منتصف أبريل)
- الربع الثاني: أبريل-يونيو (يُدفع منتصف يوليو)
- الربع الثالث: يوليو-سبتمبر (يُدفع منتصف أكتوبر)
- الربع الرابع: أكتوبر-ديسمبر (يُدفع منتصف يناير)

## كيف تعمل التوزيعات

1. **تحصيل الإيجار**: يقوم مدير العقار بتحصيل الإيجار من المستأجرين
2. **خصم المصروفات**: يتم خصم تكاليف التشغيل والصيانة والرسوم
3. **حساب صافي الدخل**: المبلغ المتبقي هو صافي الدخل القابل للتوزيع
4. **التوزيع النسبي**: يقسم بين المستثمرين بناءً على نسبة الملكية
5. **رصيد المحفظة**: يُضاف نصيبك إلى محفظة امتلاك الخاصة بك
6. **السحب**: التحويل إلى حسابك البنكي أو إعادة الاستثمار

## الرسوم والتكاليف

- **رسوم المنصة**: 1-2٪ من التوزيعات (تغطي عمليات المنصة)
- **إدارة العقار**: 5-8٪ من الدخل الإيجاري (يختلف حسب العقار)
- **احتياطي الصيانة**: 2-3٪ يُخصص للإصلاحات
- **رسوم المعاملات**: 0.5٪ على السحوبات

## العوائد المتوقعة مقابل الفعلية

**العوائد المتوقعة** هي تقديرات بناءً على:
- أسعار الإيجار في السوق
- افتراضات الإشغال
- الأداء التاريخي
- حالة العقار

**العوائد الفعلية** قد تختلف بسبب:
- فترات الشغور
- تكاليف الصيانة
- ظروف السوق
- تخلف المستأجرين عن السداد

## الاعتبارات الضريبية

- قد يخضع الدخل الإيجاري لضريبة الدخل
- قد تخضع مكاسب رأس المال للضريبة عند بيع العقار
- استشر مستشاراً ضريبياً للحصول على إرشادات شخصية
- توفر امتلاك بيانات ضريبية سنوية

## إعادة استثمار العوائد

عظّم النمو المركب بإعادة استثمار التوزيعات:
1. فعّل إعادة الاستثمار التلقائي في الإعدادات
2. اختر العقارات المستهدفة
3. تشتري التوزيعات حصصاً جديدة تلقائياً
4. ابنِ الثروة بشكل أسرع من خلال المضاعفة

## تتبع عوائدك

راقب الأداء في لوحة التحكم:
- إجمالي العوائد حتى الآن
- سجل التوزيعات
- معدل العائد السنوي
- التفصيل حسب العقار
- المقارنة بالتوقعات

ابدأ في كسب دخل سلبي من العقارات اليوم!',
  
  (SELECT id FROM knowledge_base_categories WHERE name = 'Returns & Distributions' LIMIT 1),
  'returns,distributions,rental income,dividends,payouts',
  0, 0, 0,
  'published',
  NOW(), NOW(), NOW()
),

-- Article 5: Withdrawing Funds
(
  'How to Withdraw Funds from Your Wallet',
  'كيفية سحب الأموال من محفظتك',
  '# Withdrawing Funds

Learn how to transfer money from your Emtelaak wallet to your bank account.

## Withdrawal Process

### Step 1: Navigate to Wallet
Go to your Dashboard and click on "Wallet" or "Withdraw Funds"

### Step 2: Enter Amount
- Minimum withdrawal: $50
- Maximum per transaction: $10,000
- Available balance displayed

### Step 3: Select Bank Account
Choose from your saved bank accounts or add a new one:
- Bank name
- Account number
- Account holder name (must match your KYC name)
- IBAN (for international transfers)

### Step 4: Confirm Withdrawal
Review details and confirm. You''ll receive a confirmation email.

### Step 5: Processing
- Local transfers: 1-2 business days
- International transfers: 3-5 business days
- You''ll be notified when funds are sent

## Withdrawal Fees

- **Local Bank Transfer (Egypt)**: Free
- **International Wire Transfer**: $15 per transaction
- **Currency Conversion**: Market rate + 0.5% spread

## Withdrawal Limits

- **Daily Limit**: $10,000
- **Monthly Limit**: $50,000
- **Higher limits**: Contact support for institutional accounts

## Important Notes

✓ Withdrawals can only be made to accounts in your name
✓ Bank account must be verified before first withdrawal
✓ Funds must be in your wallet (not invested) to withdraw
✓ Minimum balance of $10 must remain in wallet

## Troubleshooting

**Withdrawal Pending**: Normal processing time is 1-2 days

**Withdrawal Failed**: 
- Check bank account details
- Ensure sufficient balance
- Verify account is not frozen
- Contact support if issue persists

**Withdrawal Delayed**:
- International transfers take longer
- Weekends and holidays extend processing
- Additional verification may be required

## Tax Withholding

Emtelaak may withhold taxes on certain withdrawals as required by law. Consult your tax advisor for guidance.

## Security Tips

- Enable two-factor authentication
- Use strong, unique passwords
- Verify bank details carefully
- Never share your account credentials
- Report suspicious activity immediately

Need help? Contact support@emtelaak.com',
  
  '# سحب الأموال

تعلم كيفية تحويل الأموال من محفظة امتلاك إلى حسابك البنكي.

## عملية السحب

### الخطوة 1: انتقل إلى المحفظة
اذهب إلى لوحة التحكم وانقر على "المحفظة" أو "سحب الأموال"

### الخطوة 2: أدخل المبلغ
- الحد الأدنى للسحب: 50 دولاراً
- الحد الأقصى لكل معاملة: 10,000 دولار
- يتم عرض الرصيد المتاح

### الخطوة 3: اختر الحساب البنكي
اختر من حساباتك البنكية المحفوظة أو أضف حساباً جديداً:
- اسم البنك
- رقم الحساب
- اسم صاحب الحساب (يجب أن يتطابق مع اسم KYC الخاص بك)
- IBAN (للتحويلات الدولية)

### الخطوة 4: أكد السحب
راجع التفاصيل وأكد. ستتلقى بريداً إلكترونياً للتأكيد.

### الخطوة 5: المعالجة
- التحويلات المحلية: 1-2 يوم عمل
- التحويلات الدولية: 3-5 أيام عمل
- سيتم إخطارك عند إرسال الأموال

## رسوم السحب

- **التحويل البنكي المحلي (مصر)**: مجاني
- **التحويل البنكي الدولي**: 15 دولاراً لكل معاملة
- **تحويل العملة**: سعر السوق + 0.5٪ فرق

## حدود السحب

- **الحد اليومي**: 10,000 دولار
- **الحد الشهري**: 50,000 دولار
- **حدود أعلى**: اتصل بالدعم للحسابات المؤسسية

## ملاحظات مهمة

✓ يمكن إجراء السحوبات فقط إلى حسابات باسمك
✓ يجب التحقق من الحساب البنكي قبل أول سحب
✓ يجب أن تكون الأموال في محفظتك (غير مستثمرة) للسحب
✓ يجب أن يبقى رصيد أدنى قدره 10 دولارات في المحفظة

## استكشاف الأخطاء وإصلاحها

**السحب قيد الانتظار**: وقت المعالجة الطبيعي هو 1-2 يوم

**فشل السحب**:
- تحقق من تفاصيل الحساب البنكي
- تأكد من وجود رصيد كافٍ
- تحقق من أن الحساب غير مجمد
- اتصل بالدعم إذا استمرت المشكلة

**تأخر السحب**:
- التحويلات الدولية تستغرق وقتاً أطول
- عطلات نهاية الأسبوع والعطلات تطيل المعالجة
- قد يكون هناك حاجة لتحقق إضافي

## الاستقطاع الضريبي

قد تستقطع امتلاك ضرائب على بعض السحوبات كما يتطلب القانون. استشر مستشارك الضريبي للحصول على إرشادات.

## نصائح الأمان

- فعّل المصادقة الثنائية
- استخدم كلمات مرور قوية وفريدة
- تحقق من تفاصيل البنك بعناية
- لا تشارك بيانات اعتماد حسابك أبداً
- أبلغ عن أي نشاط مشبوه فوراً

تحتاج مساعدة؟ اتصل بـ support@emtelaak.com',
  
  (SELECT id FROM knowledge_base_categories WHERE name = 'Account & Security' LIMIT 1),
  'withdrawal,bank transfer,payout,cash out,money',
  0, 0, 0,
  'published',
  NOW(), NOW(), NOW()
);
