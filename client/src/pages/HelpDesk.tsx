import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MessageSquare,
  Ticket,
  BookOpen,
  Send,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {  } from "@/const";
import LiveChat from "@/components/LiveChat";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function HelpDesk() {
  const { user, loading: authLoading } = useAuth();
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");
  const [showKBSuggestions, setShowKBSuggestions] = useState(true);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);

  // Ticket form state
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    description: "",
    categoryId: "",
    priority: "medium" as const,
    departmentType: "customer_support" as const,
  });

    // Get user's tickets
  const { data: myTickets, isLoading: ticketsLoading, refetch: refetchTickets } = trpc.helpDesk.tickets.getMyTickets.useQuery(
    { status: "" },
    { enabled: !!user }
  );

  // Get popular KB articles
  const { data: popularArticles } = trpc.helpDesk.knowledgeBase.getPopular.useQuery(
    { limit: 3 },
    { enabled: showKBSuggestions }
  );

  // Get ticket categories
  const { data: categories } = trpc.helpDesk.tickets.getCategories.useQuery({});

  // Create ticket mutation
  const createTicket = trpc.helpDesk.tickets.create.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Ticket created successfully" : "تم إنشاء التذكرة بنجاح");
      setShowNewTicketForm(false);
      setTicketForm({
        subject: "",
        description: "",
        categoryId: "",
        priority: "medium",
        departmentType: "customer_support",
      });
      refetchTickets();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreateTicket = () => {
    if (!ticketForm.subject || !ticketForm.description) {
      toast.error(language === "en" ? "Please fill in all required fields" : "يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    createTicket.mutate({
      subject: ticketForm.subject,
      description: ticketForm.description,
      categoryId: ticketForm.categoryId ? parseInt(ticketForm.categoryId) : undefined,
      priority: ticketForm.priority,
      departmentType: ticketForm.departmentType,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Breadcrumb />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>
              {language === "en" ? "Login Required" : "تسجيل الدخول مطلوب"}
            </CardTitle>
            <CardDescription>
              {language === "en"
                ? "Please log in to access the help desk"
                : "يرجى تسجيل الدخول للوصول إلى مكتب المساعدة"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={"/login"}>
                {language === "en" ? "Log In" : "تسجيل الدخول"}
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      open: { color: "bg-blue-500", label: language === "en" ? "Open" : "مفتوح" },
      in_progress: { color: "bg-yellow-500", label: language === "en" ? "In Progress" : "قيد المعالجة" },
      waiting_customer: { color: "bg-orange-500", label: language === "en" ? "Waiting" : "في الانتظار" },
      resolved: { color: "bg-green-500", label: language === "en" ? "Resolved" : "تم الحل" },
      closed: { color: "bg-gray-500", label: language === "en" ? "Closed" : "مغلق" },
    };
    const status_info = statusMap[status as keyof typeof statusMap] || statusMap.open;
    return <Badge className={status_info.color}>{status_info.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      low: { color: "bg-gray-500", label: language === "en" ? "Low" : "منخفض" },
      medium: { color: "bg-blue-500", label: language === "en" ? "Medium" : "متوسط" },
      high: { color: "bg-orange-500", label: language === "en" ? "High" : "عالي" },
      urgent: { color: "bg-red-500", label: language === "en" ? "Urgent" : "عاجل" },
    };
    const priority_info = priorityMap[priority as keyof typeof priorityMap] || priorityMap.medium;
    return <Badge className={priority_info.color}>{priority_info.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {language === "en" ? "Help & Support Center" : "مركز المساعدة والدعم"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {language === "en"
              ? "Get help with your questions and issues"
              : "احصل على المساعدة في أسئلتك ومشاكلك"}
          </p>
        </div>

        {/* Knowledge Base Suggestions */}
        {showKBSuggestions && popularArticles && popularArticles.length > 0 && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    {language === "en" ? "Before you ask, check these helpful articles" : "قبل أن تسأل، تحقق من هذه المقالات المفيدة"}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {language === "en"
                      ? "You might find the answer you're looking for in our knowledge base"
                      : "قد تجد الإجابة التي تبحث عنها في قاعدة المعرفة لدينا"}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKBSuggestions(false)}
                >
                  {language === "en" ? "Dismiss" : "إخفاء"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {popularArticles.map((item: any) => (
                  <a
                    key={item.article.id}
                    href={`/knowledge-base?article=${item.article.slug}`}
                    className="block"
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {language === "ar" && item.category?.nameAr
                                  ? item.category.nameAr
                                  : item.category?.name}
                              </Badge>
                            </div>
                            <CardTitle className="text-base">
                              {language === "ar" && item.article.titleAr
                                ? item.article.titleAr
                                : item.article.title}
                            </CardTitle>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardHeader>
                    </Card>
                  </a>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full" asChild>
                  <a href="/knowledge-base">
                    <BookOpen className="h-4 w-4 mr-2" />
                    {language === "en" ? "Browse All Articles" : "تصفح جميع المقالات"}
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {language === "en" ? "Overview" : "نظرة عامة"}
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              {language === "en" ? "My Tickets" : "تذاكري"}
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {language === "en" ? "Live Chat" : "الدردشة المباشرة"}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("chat")}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>{language === "en" ? "Live Chat" : "الدردشة المباشرة"}</CardTitle>
                  <CardDescription>
                    {language === "en"
                      ? "Chat with our support team in real-time"
                      : "تحدث مع فريق الدعم في الوقت الفعلي"}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                setActiveTab("tickets");
                setShowNewTicketForm(true);
              }}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center mb-4">
                    <Ticket className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>{language === "en" ? "Submit Ticket" : "إرسال تذكرة"}</CardTitle>
                  <CardDescription>
                    {language === "en"
                      ? "Create a support ticket for detailed assistance"
                      : "إنشاء تذكرة دعم للحصول على مساعدة مفصلة"}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle>{language === "en" ? "Knowledge Base" : "قاعدة المعرفة"}</CardTitle>
                  <CardDescription>
                    {language === "en"
                      ? "Browse articles and find answers yourself"
                      : "تصفح المقالات واحصل على الإجابات بنفسك"}
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Common Questions */}
            <Card>
              <CardHeader>
                <CardTitle>{language === "en" ? "Common Questions" : "الأسئلة الشائعة"}</CardTitle>
                <CardDescription>
                  {language === "en"
                    ? "Quick answers to frequently asked questions"
                    : "إجابات سريعة على الأسئلة المتكررة"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <h3 className="font-semibold mb-2">
                    {language === "en" ? "How do I complete KYC verification?" : "كيف أكمل التحقق من الهوية؟"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "en"
                      ? "Go to your profile and click 'Complete KYC' to start the verification process..."
                      : "انتقل إلى ملفك الشخصي وانقر على 'إكمال التحقق من الهوية' لبدء عملية التحقق..."}
                  </p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <h3 className="font-semibold mb-2">
                    {language === "en" ? "How do I invest in a property?" : "كيف أستثمر في عقار؟"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "en"
                      ? "Browse available properties, select one, and click 'Invest Now'..."
                      : "تصفح العقارات المتاحة، اختر واحدًا، وانقر على 'استثمر الآن'..."}
                  </p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <h3 className="font-semibold mb-2">
                    {language === "en" ? "When will I receive my returns?" : "متى سأحصل على عوائدي؟"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "en"
                      ? "Returns are distributed monthly, quarterly, or annually based on your investment..."
                      : "يتم توزيع العوائد شهريًا أو ربع سنويًا أو سنويًا بناءً على استثمارك..."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            {!showNewTicketForm ? (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">
                    {language === "en" ? "My Support Tickets" : "تذاكر الدعم الخاصة بي"}
                  </h2>
                  <Button onClick={() => setShowNewTicketForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {language === "en" ? "New Ticket" : "تذكرة جديدة"}
                  </Button>
                </div>

                {ticketsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : myTickets && myTickets.length > 0 ? (
                  <div className="space-y-4">
                    {myTickets.map((item: any) => (
                      <Card key={item.ticket.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{item.ticket.subject}</CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-2">
                                <span>{item.ticket.ticketNumber}</span>
                                <span>•</span>
                                <span>{new Date(item.ticket.createdAt).toLocaleDateString()}</span>
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              {getStatusBadge(item.ticket.status)}
                              {getPriorityBadge(item.ticket.priority)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.ticket.description}
                          </p>
                          {item.assignedAgent && (
                            <p className="text-sm mt-2">
                              <strong>{language === "en" ? "Assigned to:" : "مخصص لـ:"}</strong> {item.assignedAgent.name}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {language === "en" ? "No tickets yet" : "لا توجد تذاكر بعد"}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {language === "en"
                          ? "Create your first support ticket to get help"
                          : "أنشئ تذكرة الدعم الأولى للحصول على المساعدة"}
                      </p>
                      <Button onClick={() => setShowNewTicketForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        {language === "en" ? "Create Ticket" : "إنشاء تذكرة"}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>{language === "en" ? "Create New Ticket" : "إنشاء تذكرة جديدة"}</CardTitle>
                  <CardDescription>
                    {language === "en"
                      ? "Provide details about your issue and we'll get back to you"
                      : "قدم تفاصيل حول مشكلتك وسنعود إليك"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">{language === "en" ? "Subject" : "الموضوع"} *</Label>
                    <Input
                      id="subject"
                      placeholder={language === "en" ? "Brief description of your issue" : "وصف موجز لمشكلتك"}
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">{language === "en" ? "Category" : "الفئة"}</Label>
                    <Select value={ticketForm.categoryId} onValueChange={(value) => setTicketForm({ ...ticketForm, categoryId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === "en" ? "Select a category" : "اختر فئة"} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {language === "ar" && cat.nameAr ? cat.nameAr : cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">{language === "en" ? "Priority" : "الأولوية"}</Label>
                    <Select value={ticketForm.priority} onValueChange={(value: any) => setTicketForm({ ...ticketForm, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">{language === "en" ? "Low" : "منخفض"}</SelectItem>
                        <SelectItem value="medium">{language === "en" ? "Medium" : "متوسط"}</SelectItem>
                        <SelectItem value="high">{language === "en" ? "High" : "عالي"}</SelectItem>
                        <SelectItem value="urgent">{language === "en" ? "Urgent" : "عاجل"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{language === "en" ? "Description" : "الوصف"} *</Label>
                    <Textarea
                      id="description"
                      placeholder={language === "en" ? "Provide detailed information about your issue..." : "قدم معلومات مفصلة حول مشكلتك..."}
                      rows={6}
                      value={ticketForm.description}
                      onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleCreateTicket} disabled={createTicket.isPending}>
                      {createTicket.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {language === "en" ? "Creating..." : "جاري الإنشاء..."}
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          {language === "en" ? "Submit Ticket" : "إرسال التذكرة"}
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setShowNewTicketForm(false)}>
                      {language === "en" ? "Cancel" : "إلغاء"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>{language === "en" ? "Live Chat" : "الدردشة المباشرة"}</CardTitle>
                <CardDescription>
                  {language === "en"
                    ? "Chat with our support team in real-time"
                    : "تحدث مع فريق الدعم في الوقت الفعلي"}
                </CardDescription>
              </CardHeader>
              <CardContent className="py-8 text-center">
                <MessageSquare className="h-16 w-16 mx-auto text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {language === "en" ? "Start a Conversation" : "ابدأ محادثة"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {language === "en"
                    ? "Click the chat button in the bottom right corner to start chatting with our support team."
                    : "انقر على زر الدردشة في الزاوية السفلية اليمنى لبدء الدردشة مع فريق الدعم."}
                </p>
                <div className="flex justify-center">
                  <div className="animate-bounce">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Live Chat Widget */}
      <LiveChat departmentType="customer_support" />
    </div>
  );
}
