import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Search,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function KnowledgeBase() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);

  // Get categories
  const { data: categories, isLoading: categoriesLoading } = trpc.helpDesk.knowledgeBase.getCategories.useQuery();

  // Get articles by category
  const { data: articles, isLoading: articlesLoading } = trpc.helpDesk.knowledgeBase.getArticlesByCategory.useQuery(
    { categoryId: selectedCategory! },
    { enabled: !!selectedCategory }
  );

  // Search articles
  const { data: searchResults, isLoading: searchLoading } = trpc.helpDesk.knowledgeBase.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 2 }
  );

  // Get article details
  const { data: articleDetails, isLoading: articleLoading } = trpc.helpDesk.knowledgeBase.getArticle.useQuery(
    { slug: selectedArticle! },
    { enabled: !!selectedArticle }
  );

  // Get popular articles
  const { data: popularArticles } = trpc.helpDesk.knowledgeBase.getPopular.useQuery(
    { limit: 5 },
    { enabled: !selectedArticle && !selectedCategory }
  );

  // Get related articles
  const { data: relatedArticles } = trpc.helpDesk.knowledgeBase.getRelated.useQuery(
    {
      articleId: articleDetails?.article.id!,
      categoryId: articleDetails?.article.categoryId!,
      limit: 5,
    },
    { enabled: !!articleDetails }
  );

  // Vote mutation
  const vote = trpc.helpDesk.knowledgeBase.vote.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Thank you for your feedback!" : "شكرًا لملاحظاتك!");
    },
  });

  const handleVote = (articleId: number, isHelpful: boolean) => {
    vote.mutate({ articleId, isHelpful });
  };

  const handleBack = () => {
    if (selectedArticle) {
      setSelectedArticle(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
    }
  };

  // Article view
  if (selectedArticle && articleDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Breadcrumb />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button variant="ghost" onClick={handleBack} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === "en" ? "Back" : "رجوع"}
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl mb-2">
                    {language === "ar" && articleDetails.article.titleAr
                      ? articleDetails.article.titleAr
                      : articleDetails.article.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span>
                      {language === "en" ? "By" : "بواسطة"} {articleDetails.author?.name}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(articleDetails.article.createdAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>
                      {articleDetails.article.views} {language === "en" ? "views" : "مشاهدة"}
                    </span>
                  </CardDescription>
                </div>
                <Badge>{language === "ar" && articleDetails.category?.nameAr ? articleDetails.category.nameAr : articleDetails.category?.name || "Uncategorized"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <div
                dangerouslySetInnerHTML={{
                  __html: language === "ar" && articleDetails.article.contentAr
                    ? articleDetails.article.contentAr
                    : articleDetails.article.content,
                }}
              />

              {/* Feedback */}
              <div className="mt-12 pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4">
                  {language === "en" ? "Was this article helpful?" : "هل كانت هذه المقالة مفيدة؟"}
                </h3>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleVote(articleDetails.article.id, true)}
                    disabled={vote.isPending}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    {language === "en" ? "Yes" : "نعم"} ({articleDetails.article.helpfulCount})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleVote(articleDetails.article.id, false)}
                    disabled={vote.isPending}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    {language === "en" ? "No" : "لا"} ({articleDetails.article.notHelpfulCount})
                  </Button>
                </div>
              </div>

              {/* Related Articles */}
              {relatedArticles && relatedArticles.length > 0 && (
                <div className="mt-12 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">
                    {language === "en" ? "Related Articles" : "مقالات ذات صلة"}
                  </h3>
                  <div className="grid gap-3">
                    {relatedArticles.map((item: any) => (
                      <Card
                        key={item.article.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedArticle(item.article.slug)}
                      >
                        <CardHeader className="py-3">
                          <CardTitle className="text-base">
                            {language === "ar" && item.article.titleAr
                              ? item.article.titleAr
                              : item.article.title}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Category articles view
  if (selectedCategory && articles) {
    const category = categories?.find((c: any) => c.category.id === selectedCategory);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={handleBack} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === "en" ? "Back to Categories" : "العودة إلى الفئات"}
          </Button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              {language === "ar" && category?.category.nameAr
                ? category.category.nameAr
                : category?.category.name}
            </h1>
            <p className="text-muted-foreground text-lg">
              {category?.category.description}
            </p>
          </div>

          {articlesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : articles.length > 0 ? (
            <div className="grid gap-4">
              {articles.map((item: any) => (
                <Card
                  key={item.article.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedArticle(item.article.slug)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">
                          {language === "ar" && item.article.titleAr
                            ? item.article.titleAr
                            : item.article.title}
                        </CardTitle>
                        {item.article.excerpt && (
                          <CardDescription className="line-clamp-2">
                            {item.article.excerpt}
                          </CardDescription>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {language === "en" ? "No articles yet" : "لا توجد مقالات بعد"}
                </h3>
                <p className="text-muted-foreground">
                  {language === "en"
                    ? "Articles will be added soon"
                    : "ستتم إضافة المقالات قريبًا"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Main view - categories and search
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">
            {language === "en" ? "Knowledge Base" : "قاعدة المعرفة"}
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            {language === "en"
              ? "Find answers to common questions and learn more about our platform"
              : "ابحث عن إجابات للأسئلة الشائعة وتعرف على المزيد حول منصتنا"}
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={language === "en" ? "Search for articles..." : "ابحث عن المقالات..."}
                className="pl-10 h-12 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Search Results */}
        {searchQuery.length >= 2 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">
              {language === "en" ? "Search Results" : "نتائج البحث"}
            </h2>
            {searchLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="grid gap-4">
                {searchResults.map((item: any) => (
                  <Card
                    key={item.article.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedArticle(item.article.slug)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">
                              {language === "ar" && item.category?.nameAr
                                ? item.category.nameAr
                                : item.category?.name}
                            </Badge>
                          </div>
                          <CardTitle className="text-xl mb-2">
                            {language === "ar" && item.article.titleAr
                              ? item.article.titleAr
                              : item.article.title}
                          </CardTitle>
                          {item.article.excerpt && (
                            <CardDescription className="line-clamp-2">
                              {item.article.excerpt}
                            </CardDescription>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {language === "en" ? "No results found" : "لم يتم العثور على نتائج"}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === "en"
                      ? "Try different keywords or browse categories below"
                      : "جرب كلمات مفتاحية مختلفة أو تصفح الفئات أدناه"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Categories */}
        {!searchQuery && (
          <>
            <h2 className="text-2xl font-bold mb-6">
              {language === "en" ? "Browse by Category" : "تصفح حسب الفئة"}
            </h2>
            {categoriesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : categories && categories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((item: any) => (
                  <Card
                    key={item.category.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedCategory(item.category.id)}
                  >
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>
                        {language === "ar" && item.category.nameAr
                          ? item.category.nameAr
                          : item.category.name}
                      </CardTitle>
                      <CardDescription>
                        {item.category.description}
                      </CardDescription>
                      <div className="pt-4">
                        <Badge variant="secondary">
                          {item.articleCount} {language === "en" ? "articles" : "مقالة"}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {language === "en" ? "No categories yet" : "لا توجد فئات بعد"}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === "en"
                      ? "Knowledge base content will be added soon"
                      : "ستتم إضافة محتوى قاعدة المعرفة قريبًا"}
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Popular Articles Section */}
        {!searchQuery && popularArticles && popularArticles.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">
              {language === "en" ? "Popular Articles" : "المقالات الشائعة"}
            </h2>
            <div className="grid gap-4">
              {popularArticles.map((item: any) => (
                <Card
                  key={item.article.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedArticle(item.article.slug)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            {language === "ar" && item.category?.nameAr
                              ? item.category.nameAr
                              : item.category?.name}
                          </Badge>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {item.article.helpfulCount}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl mb-2">
                          {language === "ar" && item.article.titleAr
                            ? item.article.titleAr
                            : item.article.title}
                        </CardTitle>
                        {item.article.excerpt && (
                          <CardDescription className="line-clamp-2">
                            {item.article.excerpt}
                          </CardDescription>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
