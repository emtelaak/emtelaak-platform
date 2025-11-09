import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, Eye, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const TEMPLATE_TYPES = [
  { value: "password_reset", label: "Password Reset" },
  { value: "invoice", label: "Invoice Notification" },
  { value: "payment_confirmation", label: "Payment Confirmation" },
  { value: "kyc_approved", label: "KYC Approved" },
  { value: "kyc_rejected", label: "KYC Rejected" },
  { value: "custom", label: "Custom Template" },
];

const AVAILABLE_VARIABLES = {
  password_reset: ["{{userName}}", "{{resetLink}}", "{{expiryTime}}"],
  invoice: ["{{userName}}", "{{invoiceNumber}}", "{{propertyName}}", "{{amount}}", "{{shares}}", "{{dueDate}}", "{{invoiceUrl}}"],
  payment_confirmation: ["{{userName}}", "{{amount}}", "{{propertyName}}", "{{transactionId}}"],
  kyc_approved: ["{{userName}}", "{{approvalDate}}"],
  kyc_rejected: ["{{userName}}", "{{rejectionReason}}"],
  custom: ["{{userName}}", "{{customField1}}", "{{customField2}}"],
};

export default function EmailTemplateEditor() {
  const [, navigate] = useLocation();
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("password_reset");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  const { data: templates } = trpc.admin.emailTemplates.list.useQuery();
  const createMutation = trpc.admin.emailTemplates.create.useMutation();
  const updateMutation = trpc.admin.emailTemplates.update.useMutation();

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const insertVariable = (variable: string) => {
    setHtmlContent(prev => prev + ` ${variable} `);
  };

  const handlePreview = () => {
    // Replace variables with sample data
    let preview = htmlContent;
    const sampleData: Record<string, string> = {
      '{{userName}}': 'John Doe',
      '{{resetLink}}': 'https://example.com/reset-password?token=abc123',
      '{{expiryTime}}': '24 hours',
      '{{invoiceNumber}}': 'INV-00123',
      '{{propertyName}}': 'Sample Property',
      '{{amount}}': '$10,000.00',
      '{{shares}}': '100',
      '{{dueDate}}': 'January 15, 2025',
      '{{invoiceUrl}}': 'https://example.com/invoices',
      '{{transactionId}}': 'TXN-456789',
      '{{approvalDate}}': 'January 10, 2025',
      '{{rejectionReason}}': 'Incomplete documentation',
      '{{customField1}}': 'Custom Value 1',
      '{{customField2}}': 'Custom Value 2',
    };

    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(key, 'g'), value);
    });

    setPreviewHtml(preview);
    setShowPreview(true);
  };

  const handleSave = async () => {
    if (!name || !subject || !htmlContent) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (templateId) {
        await updateMutation.mutateAsync({
          id: templateId,
          name,
          subject,
          htmlContent,
          isActive,
          isDefault,
        });
        toast.success("Template updated successfully");
      } else {
        await createMutation.mutateAsync({
          name,
          type: type as any,
          subject,
          htmlContent,
          isActive,
          isDefault,
        });
        toast.success("Template created successfully");
      }
      navigate("/admin/email-templates");
    } catch (error) {
      toast.error("Failed to save template");
    }
  };

  const loadTemplate = (id: number) => {
    const template = templates?.find(t => t.id === id);
    if (template) {
      setTemplateId(template.id);
      setName(template.name);
      setType(template.type);
      setSubject(template.subject);
      setHtmlContent(template.htmlContent);
      setIsActive(template.isActive);
      setIsDefault(template.isDefault);
    }
  };

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/email-templates")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Email Template Editor</h1>
          <p className="text-muted-foreground">Create and customize email templates with variables</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
              <CardDescription>Configure the basic template information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {templates && templates.length > 0 && (
                <div className="space-y-2">
                  <Label>Load Existing Template</Label>
                  <Select onValueChange={(value) => loadTemplate(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template to edit" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name} ({template.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Password Reset Email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Template Type *</Label>
                <Select value={type} onValueChange={setType} disabled={!!templateId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Reset Your Password"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Active</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Set as Default</span>
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
              <CardDescription>Design your email using the rich text editor</CardDescription>
            </CardHeader>
            <CardContent>
              <ReactQuill
                theme="snow"
                value={htmlContent}
                onChange={setHtmlContent}
                modules={quillModules}
                className="bg-white min-h-[400px]"
              />
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {templateId ? "Update Template" : "Create Template"}
            </Button>
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>

        {/* Sidebar - Variables */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Variables</CardTitle>
              <CardDescription>Click to insert into your template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {AVAILABLE_VARIABLES[type as keyof typeof AVAILABLE_VARIABLES]?.map((variable) => (
                <Button
                  key={variable}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start font-mono text-xs"
                  onClick={() => insertVariable(variable)}
                >
                  <Plus className="h-3 w-3 mr-2" />
                  {variable}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>• Use variables to personalize emails</p>
              <p>• Keep subject lines under 50 characters</p>
              <p>• Test emails before setting as default</p>
              <p>• Include clear call-to-action buttons</p>
              <p>• Ensure mobile-friendly design</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-4">
            <div className="mb-4 pb-4 border-b">
              <p className="text-sm text-muted-foreground">Subject:</p>
              <p className="font-semibold">{subject}</p>
            </div>
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
