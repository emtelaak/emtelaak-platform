-- Seed Data: Knowledge Test Questions (FRA Compliance)
-- Date: 2025-12-28
-- Description: Sample investment knowledge test questions covering key topics

-- ============================================
-- EASY QUESTIONS
-- ============================================

-- Question 1: Risk Management
INSERT INTO `knowledge_test_questions` (`questionText`, `questionTextAr`, `category`, `difficulty`) VALUES
('What is the primary purpose of diversification in an investment portfolio?', 
 'ما هو الغرض الأساسي من التنويع في محفظة الاستثمار؟',
 'Risk Management', 'easy');

SET @q1_id = LAST_INSERT_ID();

INSERT INTO `knowledge_test_answers` (`questionId`, `answerText`, `answerTextAr`, `isCorrect`) VALUES
(@q1_id, 'To maximize returns by investing in a single asset', 'لتعظيم العوائد من خلال الاستثمار في أصل واحد', FALSE),
(@q1_id, 'To reduce risk by spreading investments across different assets', 'لتقليل المخاطر من خلال توزيع الاستثمارات عبر أصول مختلفة', TRUE),
(@q1_id, 'To avoid paying taxes on investment gains', 'لتجنب دفع الضرائب على أرباح الاستثمار', FALSE),
(@q1_id, 'To guarantee profits in all market conditions', 'لضمان الأرباح في جميع ظروف السوق', FALSE);

-- Question 2: Real Estate Investment
INSERT INTO `knowledge_test_questions` (`questionText`, `questionTextAr`, `category`, `difficulty`) VALUES
('In real estate crowdfunding, what does "fractional ownership" mean?',
 'في التمويل الجماعي العقاري، ماذا تعني "الملكية الجزئية"؟',
 'Real Estate Basics', 'easy');

SET @q2_id = LAST_INSERT_ID();

INSERT INTO `knowledge_test_answers` (`questionId`, `answerText`, `answerTextAr`, `isCorrect`) VALUES
(@q2_id, 'Owning a complete property', 'امتلاك عقار كامل', FALSE),
(@q2_id, 'Owning a portion or share of a property', 'امتلاك جزء أو حصة من عقار', TRUE),
(@q2_id, 'Renting a property for a fraction of the year', 'استئجار عقار لجزء من السنة', FALSE),
(@q2_id, 'Buying property at a discounted price', 'شراء عقار بسعر مخفض', FALSE);

-- Question 3: Investment Returns
INSERT INTO `knowledge_test_questions` (`questionText`, `questionTextAr`, `category`, `difficulty`) VALUES
('What is a "return on investment" (ROI)?',
 'ما هو "العائد على الاستثمار" (ROI)؟',
 'Investment Fundamentals', 'easy');

SET @q3_id = LAST_INSERT_ID();

INSERT INTO `knowledge_test_answers` (`questionId`, `answerText`, `answerTextAr`, `isCorrect`) VALUES
(@q3_id, 'The initial amount invested', 'المبلغ الأولي المستثمر', FALSE),
(@q3_id, 'The profit or loss generated from an investment', 'الربح أو الخسارة الناتجة عن الاستثمار', TRUE),
(@q3_id, 'The time period of an investment', 'الفترة الزمنية للاستثمار', FALSE),
(@q3_id, 'The type of asset being invested in', 'نوع الأصل المستثمر فيه', FALSE);

-- ============================================
-- MEDIUM QUESTIONS
-- ============================================

-- Question 4: Investment Risk
INSERT INTO `knowledge_test_questions` (`questionText`, `questionTextAr`, `category`, `difficulty`) VALUES
('Which of the following statements about investment risk is TRUE?',
 'أي من العبارات التالية حول مخاطر الاستثمار صحيحة؟',
 'Risk Management', 'medium');

SET @q4_id = LAST_INSERT_ID();

INSERT INTO `knowledge_test_answers` (`questionId`, `answerText`, `answerTextAr`, `isCorrect`) VALUES
(@q4_id, 'Higher risk investments always guarantee higher returns', 'الاستثمارات عالية المخاطر تضمن دائمًا عوائد أعلى', FALSE),
(@q4_id, 'All investments carry some level of risk', 'جميع الاستثمارات تحمل مستوى معين من المخاطر', TRUE),
(@q4_id, 'Government bonds have no risk at all', 'السندات الحكومية ليس لها أي مخاطر على الإطلاق', FALSE),
(@q4_id, 'Diversification eliminates all investment risk', 'التنويع يزيل جميع مخاطر الاستثمار', FALSE);

-- Question 5: Real Estate Valuation
INSERT INTO `knowledge_test_questions` (`questionText`, `questionTextAr`, `category`, `difficulty`) VALUES
('What factors typically affect the value of a real estate property?',
 'ما هي العوامل التي تؤثر عادة على قيمة العقار؟',
 'Real Estate Valuation', 'medium');

SET @q5_id = LAST_INSERT_ID();

INSERT INTO `knowledge_test_answers` (`questionId`, `answerText`, `answerTextAr`, `isCorrect`) VALUES
(@q5_id, 'Only the size of the property', 'حجم العقار فقط', FALSE),
(@q5_id, 'Location, condition, market demand, and economic factors', 'الموقع والحالة والطلب في السوق والعوامل الاقتصادية', TRUE),
(@q5_id, 'Only the age of the building', 'عمر المبنى فقط', FALSE),
(@q5_id, 'The color of the walls', 'لون الجدران', FALSE);

-- Question 6: Liquidity
INSERT INTO `knowledge_test_questions` (`questionText`, `questionTextAr`, `category`, `difficulty`) VALUES
('What does "liquidity" mean in the context of investments?',
 'ماذا تعني "السيولة" في سياق الاستثمارات؟',
 'Investment Fundamentals', 'medium');

SET @q6_id = LAST_INSERT_ID();

INSERT INTO `knowledge_test_answers` (`questionId`, `answerText`, `answerTextAr`, `isCorrect`) VALUES
(@q6_id, 'The profitability of an investment', 'ربحية الاستثمار', FALSE),
(@q6_id, 'How quickly an asset can be converted to cash without significant loss', 'مدى سرعة تحويل الأصل إلى نقد دون خسارة كبيرة', TRUE),
(@q6_id, 'The amount of water in a property', 'كمية المياه في العقار', FALSE),
(@q6_id, 'The legal status of an investment', 'الوضع القانوني للاستثمار', FALSE);

-- ============================================
-- HARD QUESTIONS
-- ============================================

-- Question 7: Portfolio Theory
INSERT INTO `knowledge_test_questions` (`questionText`, `questionTextAr`, `category`, `difficulty`) VALUES
('According to modern portfolio theory, what is the relationship between risk and return?',
 'وفقًا لنظرية المحفظة الحديثة، ما هي العلاقة بين المخاطر والعائد؟',
 'Portfolio Management', 'hard');

SET @q7_id = LAST_INSERT_ID();

INSERT INTO `knowledge_test_answers` (`questionId`, `answerText`, `answerTextAr`, `isCorrect`) VALUES
(@q7_id, 'There is no relationship between risk and return', 'لا توجد علاقة بين المخاطر والعائد', FALSE),
(@q7_id, 'Higher expected returns typically require accepting higher risk', 'العوائد المتوقعة الأعلى تتطلب عادة قبول مخاطر أعلى', TRUE),
(@q7_id, 'Lower risk always means higher returns', 'المخاطر الأقل تعني دائمًا عوائد أعلى', FALSE),
(@q7_id, 'Risk and return are completely independent', 'المخاطر والعائد مستقلان تمامًا', FALSE);

-- Question 8: Real Estate Financing
INSERT INTO `knowledge_test_questions` (`questionText`, `questionTextAr`, `category`, `difficulty`) VALUES
('What is the primary advantage of using leverage (borrowed capital) in real estate investment?',
 'ما هي الميزة الأساسية لاستخدام الرافعة المالية (رأس المال المقترض) في الاستثمار العقاري؟',
 'Real Estate Financing', 'hard');

SET @q8_id = LAST_INSERT_ID();

INSERT INTO `knowledge_test_answers` (`questionId`, `answerText`, `answerTextAr`, `isCorrect`) VALUES
(@q8_id, 'It eliminates all investment risk', 'يزيل جميع مخاطر الاستثمار', FALSE),
(@q8_id, 'It can amplify returns on equity investment', 'يمكن أن يضخم العوائد على الاستثمار في حقوق الملكية', TRUE),
(@q8_id, 'It guarantees positive cash flow', 'يضمن تدفقًا نقديًا إيجابيًا', FALSE),
(@q8_id, 'It reduces the property value', 'يقلل من قيمة العقار', FALSE);

-- Question 9: Market Analysis
INSERT INTO `knowledge_test_questions` (`questionText`, `questionTextAr`, `category`, `difficulty`) VALUES
('When analyzing a real estate market, which indicator is most important for assessing supply and demand?',
 'عند تحليل سوق العقارات، أي مؤشر هو الأكثر أهمية لتقييم العرض والطلب؟',
 'Market Analysis', 'hard');

SET @q9_id = LAST_INSERT_ID();

INSERT INTO `knowledge_test_answers` (`questionId`, `answerText`, `answerTextAr`, `isCorrect`) VALUES
(@q9_id, 'The color preferences of buyers', 'تفضيلات الألوان للمشترين', FALSE),
(@q9_id, 'Vacancy rates and absorption rates', 'معدلات الشواغر ومعدلات الاستيعاب', TRUE),
(@q9_id, 'The number of real estate agents', 'عدد وكلاء العقارات', FALSE),
(@q9_id, 'The weather patterns in the area', 'أنماط الطقس في المنطقة', FALSE);

-- Question 10: Regulatory Compliance
INSERT INTO `knowledge_test_questions` (`questionText`, `questionTextAr`, `category`, `difficulty`) VALUES
('Why is regulatory compliance important in real estate crowdfunding platforms?',
 'لماذا يعتبر الامتثال التنظيمي مهمًا في منصات التمويل الجماعي العقاري؟',
 'Regulatory Framework', 'hard');

SET @q10_id = LAST_INSERT_ID();

INSERT INTO `knowledge_test_answers` (`questionId`, `answerText`, `answerTextAr`, `isCorrect`) VALUES
(@q10_id, 'It is not important at all', 'ليس مهمًا على الإطلاق', FALSE),
(@q10_id, 'It protects investors and ensures fair market practices', 'يحمي المستثمرين ويضمن ممارسات سوق عادلة', TRUE),
(@q10_id, 'It only benefits the platform operators', 'يفيد فقط مشغلي المنصة', FALSE),
(@q10_id, 'It increases investment costs unnecessarily', 'يزيد من تكاليف الاستثمار بشكل غير ضروري', FALSE);
