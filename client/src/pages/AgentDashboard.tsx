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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MessageSquare,
  Ticket,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  User,
  Calendar,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {  } from "@/const";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function AgentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [ticketFilter, setTicketFilter] = useState({
    status: "",
    priority: "",
    departmentType: "",
  });

  // Reply form state
  const [replyMessage, setReplyMessage] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);

  // Get help desk stats
  const { data: stats, isLoading: statsLoading } = trpc.helpDesk.stats.getStats.useQuery(
    {},
    { enabled: !!user && (user.role === "admin" || user.role === "super_admin") }
  );

  // Get all tickets
  const { data: allTickets, isLoading: ticketsLoading, refetch: refetchTickets } = trpc.helpDesk.tickets.getAll.useQuery(
    ticketFilter,
    { enabled: !!user && (user.role === "admin" || user.role === "super_admin") }
  );

  // Get waiting chat conversations
  const { data: waitingChats, refetch: refetchChats } = trpc.helpDesk.chat.getWaitingConversations.useQuery(
    undefined,
    { enabled: !!user && (user.role === "admin" || user.role === "super_admin") }
  );

  // Get ticket details
  const { data: ticketDetails, refetch: refetchTicketDetails } = trpc.helpDesk.tickets.getById.useQuery(
    { ticketId: selectedTicket! },
    { enabled: !!selectedTicket }
  );

  // Get ticket messages
  const { data: ticketMessages } = trpc.helpDesk.tickets.getMessages.useQuery(
    { ticketId: selectedTicket!, includeInternal: true },
    { enabled: !!selectedTicket }
  );

  // Mutations
  const assignTicket = trpc.helpDesk.tickets.assign.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Ticket assigned successfully" : "تم تعيين التذكرة بنجاح");
      refetchTickets();
      refetchTicketDetails();
    },
  });

  const updateTicketStatus = trpc.helpDesk.tickets.updateStatus.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Status updated successfully" : "تم تحديث الحالة بنجاح");
      refetchTickets();
      refetchTicketDetails();
    },
  });

  const addMessage = trpc.helpDesk.tickets.addMessage.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Message sent" : "تم إرسال الرسالة");
      setReplyMessage("");
      setIsInternalNote(false);
      refetchTicketDetails();
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Breadcrumb />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>
              {language === "en" ? "Access Denied" : "الوصول مرفوض"}
            </CardTitle>
            <CardDescription>
              {language === "en"
                ? "You need agent permissions to access this page"
                : "تحتاج إلى أذونات الوكيل للوصول إلى هذه الصفحة"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/">
                {language === "en" ? "Go Home" : "العودة للرئيسية"}
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
      waiting_internal: { color: "bg-purple-500", label: language === "en" ? "Internal" : "داخلي" },
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

  const handleAssignToMe = (ticketId: number) => {
    assignTicket.mutate({ ticketId, agentId: user.id });
  };

  const handleUpdateStatus = (ticketId: number, status: any) => {
    updateTicketStatus.mutate({ ticketId, status });
  };

  const handleSendReply = () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    
    addMessage.mutate({
      ticketId: selectedTicket,
      message: replyMessage,
      isInternal: isInternalNote,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {language === "en" ? "Agent Dashboard" : "لوحة تحكم الوكيل"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {language === "en"
              ? "Manage support tickets and customer conversations"
              : "إدارة تذاكر الدعم ومحادثات العملاء"}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {language === "en" ? "Overview" : "نظرة عامة"}
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              {language === "en" ? "Tickets" : "التذاكر"}
            </TabsTrigger>
            <TabsTrigger value="chats" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {language === "en" ? "Chats" : "الدردشات"}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {statsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Ticket Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {language === "en" ? "Total Tickets" : "إجمالي التذاكر"}
                      </CardTitle>
                      <Ticket className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.tickets?.totalTickets || 0}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {language === "en" ? "Open" : "مفتوح"}
                      </CardTitle>
                      <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.tickets?.openTickets || 0}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {language === "en" ? "In Progress" : "قيد المعالجة"}
                      </CardTitle>
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.tickets?.inProgressTickets || 0}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {language === "en" ? "Resolved" : "تم الحل"}
                      </CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.tickets?.resolvedTickets || 0}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Chat Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {language === "en" ? "Total Conversations" : "إجمالي المحادثات"}
                      </CardTitle>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.chats?.totalConversations || 0}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {language === "en" ? "Active Chats" : "الدردشات النشطة"}
                      </CardTitle>
                      <MessageSquare className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.chats?.activeConversations || 0}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {language === "en" ? "Waiting" : "في الانتظار"}
                      </CardTitle>
                      <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.chats?.waitingConversations || 0}</div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  {language === "en" ? "Filters" : "الفلاتر"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Select value={ticketFilter.status} onValueChange={(value) => setTicketFilter({ ...ticketFilter, status: value })}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={language === "en" ? "All Statuses" : "جميع الحالات"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "en" ? "All Statuses" : "جميع الحالات"}</SelectItem>
                    <SelectItem value="open">{language === "en" ? "Open" : "مفتوح"}</SelectItem>
                    <SelectItem value="in_progress">{language === "en" ? "In Progress" : "قيد المعالجة"}</SelectItem>
                    <SelectItem value="resolved">{language === "en" ? "Resolved" : "تم الحل"}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={ticketFilter.priority} onValueChange={(value) => setTicketFilter({ ...ticketFilter, priority: value })}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={language === "en" ? "All Priorities" : "جميع الأولويات"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "en" ? "All Priorities" : "جميع الأولويات"}</SelectItem>
                    <SelectItem value="urgent">{language === "en" ? "Urgent" : "عاجل"}</SelectItem>
                    <SelectItem value="high">{language === "en" ? "High" : "عالي"}</SelectItem>
                    <SelectItem value="medium">{language === "en" ? "Medium" : "متوسط"}</SelectItem>
                    <SelectItem value="low">{language === "en" ? "Low" : "منخفض"}</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Tickets Table */}
            <Card>
              <CardHeader>
                <CardTitle>{language === "en" ? "All Tickets" : "جميع التذاكر"}</CardTitle>
              </CardHeader>
              <CardContent>
                {ticketsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : allTickets && allTickets.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "en" ? "Ticket #" : "رقم التذكرة"}</TableHead>
                        <TableHead>{language === "en" ? "Subject" : "الموضوع"}</TableHead>
                        <TableHead>{language === "en" ? "Customer" : "العميل"}</TableHead>
                        <TableHead>{language === "en" ? "Status" : "الحالة"}</TableHead>
                        <TableHead>{language === "en" ? "Priority" : "الأولوية"}</TableHead>
                        <TableHead>{language === "en" ? "Assigned To" : "مخصص لـ"}</TableHead>
                        <TableHead>{language === "en" ? "Actions" : "الإجراءات"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allTickets.map((item: any) => (
                        <TableRow key={item.ticket.id}>
                          <TableCell className="font-medium">{item.ticket.ticketNumber}</TableCell>
                          <TableCell className="max-w-xs truncate">{item.ticket.subject}</TableCell>
                          <TableCell>{item.user?.name || item.user?.email}</TableCell>
                          <TableCell>{getStatusBadge(item.ticket.status)}</TableCell>
                          <TableCell>{getPriorityBadge(item.ticket.priority)}</TableCell>
                          <TableCell>{item.assignedAgent?.name || "-"}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => setSelectedTicket(item.ticket.id)}>
                                {language === "en" ? "View" : "عرض"}
                              </Button>
                              {!item.ticket.assignedToId && (
                                <Button size="sm" onClick={() => handleAssignToMe(item.ticket.id)}>
                                  {language === "en" ? "Assign to Me" : "تعيين لي"}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    {language === "en" ? "No tickets found" : "لم يتم العثور على تذاكر"}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chats Tab */}
          <TabsContent value="chats">
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {language === "en" ? "Live Chat Coming Soon" : "الدردشة المباشرة قريبًا"}
                </h3>
                <p className="text-muted-foreground">
                  {language === "en"
                    ? "Manage customer chat conversations in real-time"
                    : "إدارة محادثات الدردشة مع العملاء في الوقت الفعلي"}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ticket Detail Dialog */}
        <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {ticketDetails?.ticket.ticketNumber} - {ticketDetails?.ticket.subject}
              </DialogTitle>
              <DialogDescription>
                {language === "en" ? "Ticket Details and Conversation" : "تفاصيل التذكرة والمحادثة"}
              </DialogDescription>
            </DialogHeader>

            {ticketDetails && (
              <div className="space-y-6">
                {/* Ticket Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === "en" ? "Customer" : "العميل"}</Label>
                    <p className="text-sm">{ticketDetails.user?.name || ticketDetails.user?.email}</p>
                  </div>
                  <div>
                    <Label>{language === "en" ? "Status" : "الحالة"}</Label>
                    <div className="mt-1">
                      <Select
                        value={ticketDetails.ticket.status}
                        onValueChange={(value) => handleUpdateStatus(ticketDetails.ticket.id, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">{language === "en" ? "Open" : "مفتوح"}</SelectItem>
                          <SelectItem value="in_progress">{language === "en" ? "In Progress" : "قيد المعالجة"}</SelectItem>
                          <SelectItem value="waiting_customer">{language === "en" ? "Waiting Customer" : "في انتظار العميل"}</SelectItem>
                          <SelectItem value="resolved">{language === "en" ? "Resolved" : "تم الحل"}</SelectItem>
                          <SelectItem value="closed">{language === "en" ? "Closed" : "مغلق"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="space-y-4">
                  <Label>{language === "en" ? "Conversation" : "المحادثة"}</Label>
                  <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-4">
                    {/* Original ticket description */}
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-muted-foreground mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{ticketDetails.user?.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(ticketDetails.ticket.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{ticketDetails.ticket.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    {ticketMessages?.map((msg: any) => (
                      <div
                        key={msg.message.id}
                        className={`p-4 rounded-lg ${
                          msg.message.isInternal ? "bg-yellow-50 border border-yellow-200" : "bg-muted"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <User className="h-5 w-5 text-muted-foreground mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">{msg.user?.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {msg.user?.role}
                              </Badge>
                              {msg.message.isInternal && (
                                <Badge className="bg-yellow-500 text-xs">
                                  {language === "en" ? "Internal Note" : "ملاحظة داخلية"}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {new Date(msg.message.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{msg.message.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reply Form */}
                <div className="space-y-4">
                  <Label>{language === "en" ? "Reply" : "الرد"}</Label>
                  <Textarea
                    placeholder={language === "en" ? "Type your response..." : "اكتب ردك..."}
                    rows={4}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                  />
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {language === "en" ? "Internal note (not visible to customer)" : "ملاحظة داخلية (غير مرئية للعميل)"}
                      </span>
                    </label>
                    <Button onClick={handleSendReply} disabled={!replyMessage.trim() || addMessage.isPending}>
                      {addMessage.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {language === "en" ? "Sending..." : "جاري الإرسال..."}
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          {language === "en" ? "Send Reply" : "إرسال الرد"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
