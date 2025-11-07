import { drizzle } from "drizzle-orm/mysql2";
import { knowledgeBaseCategories, knowledgeBaseArticles } from "../drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

async function seedKnowledgeBase() {
  console.log("🌱 Seeding knowledge base...");

  try {
    // First, create categories
    const categories = [
      { name: "Getting Started", nameAr: "البدء", description: "Learn the basics of investing with Emtelaak", icon: "rocket", displayOrder: 1 },
      { name: "KYC & Verification", nameAr: "التحقق من الهوية", description: "Understanding our verification process", icon: "shield", displayOrder: 2 },
      { name: "Investments", nameAr: "الاستثمارات", description: "How to invest and manage your portfolio", icon: "trending-up", displayOrder: 3 },
      { name: "Payments & Withdrawals", nameAr: "المدفوعات والسحوبات", description: "Managing your funds", icon: "credit-card", displayOrder: 4 },
      { name: "Platform Features", nameAr: "ميزات المنصة", description: "Explore platform capabilities", icon: "settings", displayOrder: 5 },
    ];

    console.log("Creating categories...");
    const insertedCategories = [];
    for (const cat of categories) {
      const result = await db.insert(knowledgeBaseCategories).values(cat);
      insertedCategories.push({ ...cat, id: Number(result[0].insertId) });
      console.log(`✓ Created category: ${cat.name}`);
    }

    // Get admin user ID (assuming first user is admin)
    const adminId = 1;

    // Create articles
    const articles = [
      {
        categoryId: insertedCategories[0].id,
        title: "What is Emtelaak?",
        titleAr: "ما هو إمتلاك؟",
        slug: "what-is-emtelaak",
        content: "Emtelaak is a revolutionary fractional real estate investment platform that allows you to invest in premium properties starting from just $100. We make real estate investment accessible to everyone by breaking down property ownership into affordable shares.",
        contentAr: "إمتلاك هي منصة استثمار عقاري كسري ثورية تتيح لك الاستثمار في العقارات المتميزة بدءًا من 100 دولار فقط. نجعل الاستثمار العقاري متاحًا للجميع من خلال تقسيم ملكية العقارات إلى أسهم ميسورة التكلفة.",
        excerpt: "Learn about Emtelaak's fractional real estate investment platform",
        authorId: adminId,
        isPublished: true,
        publishedAt: new Date(),
      },
      {
        categoryId: insertedCategories[0].id,
        title: "How to Get Started",
        titleAr: "كيفية البدء",
        slug: "how-to-get-started",
        content: "Getting started with Emtelaak is easy: 1) Sign up for a free account, 2) Complete KYC verification, 3) Browse available properties, 4) Invest in your chosen property, 5) Start earning returns. The entire process takes less than 15 minutes.",
        contentAr: "البدء مع إمتلاك سهل: 1) سجل حسابًا مجانيًا، 2) أكمل التحقق من الهوية، 3) تصفح العقارات المتاحة، 4) استثمر في العقار الذي اخترته، 5) ابدأ في كسب العوائد. تستغرق العملية بأكملها أقل من 15 دقيقة.",
        excerpt: "Step-by-step guide to start investing",
        authorId: adminId,
        isPublished: true,
        publishedAt: new Date(),
      },
      {
        categoryId: insertedCategories[1].id,
        title: "KYC Verification Process",
        titleAr: "عملية التحقق من الهوية",
        slug: "kyc-verification-process",
        content: "KYC (Know Your Customer) verification is required by law to ensure platform security. You'll need to provide: 1) Government-issued ID, 2) Proof of address, 3) Financial information questionnaire. Verification typically takes 24-48 hours.",
        contentAr: "التحقق من الهوية (KYC) مطلوب بموجب القانون لضمان أمان المنصة. ستحتاج إلى تقديم: 1) بطاقة هوية صادرة عن الحكومة، 2) إثبات العنوان، 3) استبيان المعلومات المالية. يستغرق التحقق عادةً 24-48 ساعة.",
        excerpt: "Understanding our KYC requirements",
        authorId: adminId,
        isPublished: true,
        publishedAt: new Date(),
      },
      {
        categoryId: insertedCategories[1].id,
        title: "Required Documents for Verification",
        titleAr: "المستندات المطلوبة للتحقق",
        slug: "required-documents",
        content: "For successful KYC verification, please prepare: Passport or National ID (clear, colored scan), Utility bill or bank statement (not older than 3 months), Proof of income (employment letter or bank statements). All documents must be in English or Arabic.",
        contentAr: "للتحقق الناجح من الهوية، يرجى تحضير: جواز السفر أو الهوية الوطنية (مسح واضح وملون)، فاتورة مرافق أو كشف حساب بنكي (لا يزيد عمره عن 3 أشهر)، إثبات الدخل (خطاب عمل أو كشوف حساب بنكية). يجب أن تكون جميع المستندات باللغة الإنجليزية أو العربية.",
        excerpt: "List of documents needed for KYC",
        authorId: adminId,
        isPublished: true,
        publishedAt: new Date(),
      },
      {
        categoryId: insertedCategories[2].id,
        title: "How to Make Your First Investment",
        titleAr: "كيفية القيام بأول استثمار",
        slug: "first-investment",
        content: "Making your first investment: 1) Browse properties and select one, 2) Review property details and expected returns, 3) Choose investment amount (minimum $100), 4) Select distribution frequency (monthly/quarterly/annually), 5) Complete payment, 6) Receive investment confirmation. You'll start earning returns from the next distribution cycle.",
        contentAr: "القيام بأول استثمار: 1) تصفح العقارات واختر واحدًا، 2) راجع تفاصيل العقار والعوائد المتوقعة، 3) اختر مبلغ الاستثمار (الحد الأدنى 100 دولار)، 4) حدد تكرار التوزيع (شهري/ربع سنوي/سنوي)، 5) أكمل الدفع، 6) احصل على تأكيد الاستثمار. ستبدأ في كسب العوائد من دورة التوزيع التالية.",
        excerpt: "Step-by-step investment guide",
        authorId: adminId,
        isPublished: true,
        publishedAt: new Date(),
      },
      {
        categoryId: insertedCategories[2].id,
        title: "Understanding Investment Returns",
        titleAr: "فهم عوائد الاستثمار",
        slug: "understanding-returns",
        content: "Emtelaak offers two types of returns: 1) Rental Income: Regular distributions from property rental (6-8% annual yield), 2) Capital Appreciation: Property value increase over time. Returns vary by property type - Commercial properties typically offer higher yields (10-12%) while residential properties provide stability (7-9%).",
        contentAr: "يقدم إمتلاك نوعين من العوائد: 1) دخل الإيجار: توزيعات منتظمة من إيجار العقار (عائد سنوي 6-8٪)، 2) زيادة رأس المال: زيادة قيمة العقار بمرور الوقت. تختلف العوائد حسب نوع العقار - عادةً ما توفر العقارات التجارية عوائد أعلى (10-12٪) بينما توفر العقارات السكنية الاستقرار (7-9٪).",
        excerpt: "Learn about different types of returns",
        authorId: adminId,
        isPublished: true,
        publishedAt: new Date(),
      },
      {
        categoryId: insertedCategories[3].id,
        title: "Payment Methods",
        titleAr: "طرق الدفع",
        slug: "payment-methods",
        content: "We accept multiple payment methods: Credit/Debit Cards (Visa, Mastercard), Bank Transfer (local and international), Digital Wallets (Apple Pay, Google Pay). All transactions are secured with bank-level encryption. Payment processing takes 1-3 business days depending on the method.",
        contentAr: "نقبل طرق دفع متعددة: بطاقات الائتمان/الخصم (Visa، Mastercard)، التحويل البنكي (محلي ودولي)، المحافظ الرقمية (Apple Pay، Google Pay). جميع المعاملات مؤمنة بتشفير على مستوى البنوك. تستغرق معالجة الدفع 1-3 أيام عمل حسب الطريقة.",
        excerpt: "Available payment options",
        authorId: adminId,
        isPublished: true,
        publishedAt: new Date(),
      },
      {
        categoryId: insertedCategories[3].id,
        title: "How to Withdraw Funds",
        titleAr: "كيفية سحب الأموال",
        slug: "withdraw-funds",
        content: "Withdrawing your returns: 1) Go to Portfolio > Withdrawals, 2) Enter withdrawal amount (minimum $50), 3) Select bank account, 4) Confirm withdrawal request. Funds are transferred within 3-5 business days. Note: You can withdraw rental income anytime, but selling property shares requires finding a buyer on our secondary market.",
        contentAr: "سحب عوائدك: 1) انتقل إلى المحفظة > السحوبات، 2) أدخل مبلغ السحب (الحد الأدنى 50 دولارًا)، 3) حدد الحساب البنكي، 4) أكد طلب السحب. يتم تحويل الأموال خلال 3-5 أيام عمل. ملاحظة: يمكنك سحب دخل الإيجار في أي وقت، ولكن بيع أسهم العقار يتطلب العثور على مشترٍ في سوقنا الثانوي.",
        excerpt: "Guide to withdrawing your earnings",
        authorId: adminId,
        isPublished: true,
        publishedAt: new Date(),
      },
    ];

    console.log("\nCreating articles...");
    for (const article of articles) {
      await db.insert(knowledgeBaseArticles).values(article);
      console.log(`✓ Created article: ${article.title}`);
    }

    console.log("\n✅ Knowledge base seeding completed successfully!");
    console.log(`Created ${categories.length} categories and ${articles.length} articles`);

  } catch (error) {
    console.error("❌ Error seeding knowledge base:", error);
    throw error;
  }
}

seedKnowledgeBase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
