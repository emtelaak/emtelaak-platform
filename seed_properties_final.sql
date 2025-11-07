-- Sample properties for Emtelaak platform
-- Values in cents (USD): $1M = 100,000,000 cents
-- Max int value: 2,147,483,647 cents = ~$21.5M

INSERT INTO properties (
  name, nameAr, description, descriptionAr, propertyType, investmentType, status,
  addressLine1, city, country, gpsLatitude, gpsLongitude,
  totalValue, availableValue, minimumInvestment, sharePrice, totalShares, availableShares,
  rentalYield, projectedNetYield, fundTermMonths,
  distributionFrequency, amenities,
  createdAt, updatedAt, publishedAt
) VALUES

-- Property 1: Residential Apartment in New Cairo ($10M)
(
  'Modern Residential Tower - New Cairo',
  'برج سكني حديث - القاهرة الجديدة',
  'Luxury residential tower in the heart of New Cairo featuring 120 modern apartments with premium finishes. Located in a prime area with easy access to major roads, shopping centers, and international schools. Expected rental yield of 8-10% annually with strong capital appreciation potential.',
  'برج سكني فاخر في قلب القاهرة الجديدة يضم 120 شقة حديثة بتشطيبات راقية. يقع في منطقة متميزة مع سهولة الوصول إلى الطرق الرئيسية ومراكز التسوق والمدارس الدولية. العائد الإيجاري المتوقع 8-10٪ سنوياً مع إمكانية نمو رأسمالي قوي.',
  'residential',
  'buy_to_let',
  'available',
  'Plot 45, Fifth Settlement',
  'New Cairo',
  'Egypt',
  '30.0444',
  '31.2357',
  1000000000, -- $10M
  750000000, -- $7.5M available
  50000, -- $500 min
  50000, -- $500 per share
  20000, -- 20,000 shares
  15000, -- 15,000 available
  900, -- 9%
  850, -- 8.5%
  60,
  'quarterly',
  '["Swimming Pool","Gym","Security","Parking","Garden"]',
  NOW(),
  NOW(),
  NOW()
),

-- Property 2: Residential Complex ($7M)
(
  'Premium Residential Complex - 6th October',
  'مجمع سكني راقي - السادس من أكتوبر',
  'Exclusive gated community featuring 80 luxury apartments and townhouses. Prime location near Mall of Arabia and major business districts. High-quality construction with modern amenities including clubhouse, swimming pools, and 24/7 security. Target ROI: 8.5% annually.',
  'مجتمع سكني مغلق حصري يضم 80 شقة وتاون هاوس فاخرة. موقع متميز بالقرب من مول العرب والمناطق التجارية الرئيسية. بناء عالي الجودة مع مرافق حديثة تشمل نادي وحمامات سباحة وأمن على مدار 24/7. العائد المستهدف: 8.5٪ سنوياً.',
  'residential',
  'buy_to_let',
  'available',
  'Beverly Hills District',
  '6th October City',
  'Egypt',
  '29.9668',
  '30.9297',
  700000000, -- $7M
  500000000, -- $5M available
  25000, -- $250 min
  50000,
  14000,
  10000,
  850, -- 8.5%
  800, -- 8%
  48,
  'quarterly',
  '["Clubhouse","Swimming Pools","Kids Area","Gym","Landscaped Gardens","24/7 Security"]',
  NOW(),
  NOW(),
  NOW()
),

-- Property 3: Commercial Office Building ($15M)
(
  'Class A Office Tower - Smart Village',
  'برج مكاتب من الفئة A - القرية الذكية',
  'Premium Grade A office building in Cairo Smart Village tech hub. 15 floors of modern office space with state-of-the-art facilities. Long-term lease agreements with multinational tech companies. Stable rental income with 10-12% annual returns. Ideal for institutional and high-net-worth investors.',
  'مبنى مكاتب من الدرجة A الممتازة في مركز القرية الذكية التقني. 15 طابقاً من المساحات المكتبية الحديثة مع مرافق حديثة. عقود إيجار طويلة الأجل مع شركات تقنية متعددة الجنسيات. دخل إيجاري مستقر بعوائد سنوية 10-12٪. مثالي للمستثمرين المؤسسيين وذوي الثروات العالية.',
  'commercial',
  'buy_to_let',
  'available',
  'Smart Village, Km 28 Cairo-Alexandria Desert Road',
  'Giza',
  'Egypt',
  '30.0715',
  '30.9699',
  1500000000, -- $15M
  1200000000, -- $12M available
  100000, -- $1000 min
  50000,
  30000,
  24000,
  1100, -- 11%
  1050, -- 10.5%
  84,
  'quarterly',
  '["High-Speed Internet","Conference Rooms","Parking","Cafeteria","Backup Power","Smart Building Systems"]',
  NOW(),
  NOW(),
  NOW()
),

-- Property 4: Commercial Retail Center ($12M)
(
  'Upscale Retail & Office Complex',
  'مجمع تجاري ومكاتب راقي',
  'Mixed-use development combining premium retail spaces on ground floors with modern office units above. Strategic location in high-traffic commercial district. Anchor tenants include international brands and financial institutions. Expected yield: 9.5% with strong appreciation potential.',
  'مشروع متعدد الاستخدامات يجمع بين مساحات تجارية راقية في الطوابق الأرضية ووحدات مكتبية حديثة في الأعلى. موقع استراتيجي في منطقة تجارية عالية الحركة. المستأجرون الرئيسيون يشملون علامات تجارية عالمية ومؤسسات مالية. العائد المتوقع: 9.5٪ مع إمكانية نمو قوية.',
  'commercial',
  'buy_to_let',
  'available',
  'Downtown Business District',
  'New Administrative Capital',
  'Egypt',
  '30.0131',
  '31.4247',
  1200000000, -- $12M
  900000000, -- $9M available
  75000, -- $750 min
  50000,
  24000,
  18000,
  950, -- 9.5%
  900, -- 9%
  72,
  'quarterly',
  '["Retail Spaces","Office Units","Ample Parking","Food Court","ATMs","Security"]',
  NOW(),
  NOW(),
  NOW()
),

-- Property 5: Administrative Office Complex ($20M)
(
  'Premium Administrative Headquarters',
  'مقر إداري راقي',
  'State-of-the-art administrative building designed for corporate headquarters and government offices. LEED-certified green building with energy-efficient systems. Prime location in the New Administrative Capital with excellent connectivity. Long-term government lease guarantees stable 10% annual returns.',
  'مبنى إداري حديث مصمم للمقرات الرئيسية للشركات والمكاتب الحكومية. مبنى أخضر معتمد من LEED مع أنظمة موفرة للطاقة. موقع متميز في العاصمة الإدارية الجديدة مع اتصال ممتاز. عقد إيجار حكومي طويل الأجل يضمن عوائد سنوية مستقرة 10٪.',
  'administrative',
  'buy_to_let',
  'available',
  'Government District, Phase 1',
  'New Administrative Capital',
  'Egypt',
  '30.0290',
  '31.4257',
  2000000000, -- $20M
  1500000000, -- $15M available
  150000, -- $1500 min
  50000,
  40000,
  30000,
  1000, -- 10%
  950, -- 9.5%
  120,
  'quarterly',
  '["LEED Certified","Solar Panels","Smart Systems","Conference Centers","Parking","Backup Power","High Security"]',
  NOW(),
  NOW(),
  NOW()
);
