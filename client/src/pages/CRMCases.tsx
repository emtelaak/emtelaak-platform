import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Ticket, Plus, ArrowLeft, MessageSquare } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Link } from "wouter";
import { toast } from "sonner";

export default function CRMCases() {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [selectedCase, setSelectedCase] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  
  const { data: cases, refetch } = trpc.crm.cases.list.useQuery({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    limit: 100,
  });
  
  const { data: comments, refetch: refetchComments } = trpc.crm.cases.getComments.useQuery(
    { caseId: selectedCase! },
    { enabled: !!selectedCase }
  );
  
  const createMutation = trpc.crm.cases.create.useMutation({
    onSuccess: () => {
      toast.success("Case created successfully");
      setIsCreateOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const updateMutation = trpc.crm.cases.update.useMutation({
    onSuccess: () => {
      toast.success("Case updated successfully");
      refetch();
    },
  });
  
  const addCommentMutation = trpc.crm.cases.addComment.useMutation({
    onSuccess: () => {
      toast.success("Comment added");
      setCommentText("");
      refetchComments();
    },
  });
  
  const handleCreateCase = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createMutation.mutate({
      subject: formData.get("subject") as string,
      description: formData.get("description") as string || undefined,
      priority: formData.get("priority") as any,
      type: formData.get("type") as any,
      origin: formData.get("origin") as any,
    });
  };
  
  const handleStatusChange = (caseId: number, newStatus: string) => {
    updateMutation.mutate({
      id: caseId,
      status: newStatus as any,
    });
  };
  
  const handleAddComment = () => {
    if (!selectedCase || !commentText.trim()) return;
    
    addCommentMutation.mutate({
      caseId: selectedCase,
      comment: commentText,
      isInternal: false,
      isFromCustomer: false,
    });
  };
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      new: "default",
      in_progress: "secondary",
      pending_customer: "outline",
      resolved: "default",
      closed: "destructive",
    };
    
    return <Badge variant={variants[status] || "default"}>{status.replace("_", " ")}</Badge>;
  };
  
  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      low: "outline",
      medium: "secondary",
      high: "default",
      critical: "destructive",
    };
    
    return <Badge variant={variants[priority] || "default"}>{priority}</Badge>;
  };
  
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access the CRM system.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Breadcrumb 
                items={[
                  { label: "CRM", labelAr: "إدارة علاقات العملاء", href: "/crm" },
                  { label: "Cases", labelAr: "الحالات" }
                ]} 
              />
              <h1 className="text-3xl font-bold flex items-center gap-2 mt-2">
                <Ticket className="h-8 w-8" />
                Cases Management
              </h1>
              <p className="text-muted-foreground mt-1">Customer support and service tickets</p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Case
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Case</DialogTitle>
                  <DialogDescription>Create a new support ticket or case</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateCase} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input id="subject" name="subject" required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" rows={4} />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority *</Label>
                      <Select name="priority" required defaultValue="medium">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="type">Type *</Label>
                      <Select name="type" required defaultValue="question">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="question">Question</SelectItem>
                          <SelectItem value="problem">Problem</SelectItem>
                          <SelectItem value="feature_request">Feature Request</SelectItem>
                          <SelectItem value="complaint">Complaint</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="origin">Origin *</Label>
                      <Select name="origin" required defaultValue="web">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="web">Web</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="chat">Chat</SelectItem>
                          <SelectItem value="social_media">Social Media</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Creating..." : "Create Case"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="w-64">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="pending_customer">Pending Customer</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-64">
                <Label>Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Cases Table */}
      <div className="container mx-auto pb-12">
        <Card>
          <CardHeader>
            <CardTitle>Cases ({cases?.length || 0})</CardTitle>
            <CardDescription>All support cases and tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case #</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No cases found. Create your first case to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  cases?.map((caseItem) => (
                    <TableRow key={caseItem.id}>
                      <TableCell className="font-mono text-sm">{caseItem.caseNumber}</TableCell>
                      <TableCell className="font-medium">{caseItem.subject}</TableCell>
                      <TableCell>{caseItem.type.replace("_", " ")}</TableCell>
                      <TableCell>{getPriorityBadge(caseItem.priority)}</TableCell>
                      <TableCell>
                        <Select
                          value={caseItem.status}
                          onValueChange={(value) => handleStatusChange(caseItem.id, value)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="pending_customer">Pending Customer</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{caseItem.origin}</TableCell>
                      <TableCell>{new Date(caseItem.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCase(caseItem.id)}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Comments
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Case Comments - {caseItem.caseNumber}</DialogTitle>
                              <DialogDescription>{caseItem.subject}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              {comments?.map((comment) => (
                                <Card key={comment.id}>
                                  <CardContent className="pt-4">
                                    <p className="text-sm">{comment.comment}</p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                      {new Date(comment.createdAt).toLocaleString()}
                                      {comment.isInternal && " (Internal)"}
                                    </p>
                                  </CardContent>
                                </Card>
                              ))}
                              {comments?.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No comments yet
                                </p>
                              )}
                              <div className="space-y-2">
                                <Label>Add Comment</Label>
                                <Textarea
                                  value={commentText}
                                  onChange={(e) => setCommentText(e.target.value)}
                                  rows={3}
                                  placeholder="Type your comment..."
                                />
                                <Button
                                  onClick={handleAddComment}
                                  disabled={!commentText.trim() || addCommentMutation.isPending}
                                >
                                  {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
