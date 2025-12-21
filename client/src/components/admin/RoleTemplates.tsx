import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { FileText, DollarSign, Headphones, Building, CheckCircle, Sparkles } from "lucide-react";

interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  permissions: string[];
  color: string;
}

const roleTemplates: RoleTemplate[] = [
  {
    id: "content_manager",
    name: "Content Manager",
    description: "Manages platform content, media library, and knowledge base articles",
    icon: <FileText className="h-5 w-5" />,
    permissions: [
      "view_users",
      "view_properties",
      "view_investments",
      "manage_content",
      "manage_media",
      "manage_knowledge_base",
    ],
    color: "bg-blue-500",
  },
  {
    id: "financial_analyst",
    name: "Financial Analyst",
    description: "Analyzes investments, processes distributions, and manages financial reports",
    icon: <DollarSign className="h-5 w-5" />,
    permissions: [
      "view_users",
      "view_investments",
      "view_properties",
      "process_distributions",
      "view_financial_reports",
      "view_analytics",
    ],
    color: "bg-green-500",
  },
  {
    id: "customer_support",
    name: "Customer Support",
    description: "Handles customer inquiries, manages tickets, and provides user assistance",
    icon: <Headphones className="h-5 w-5" />,
    permissions: [
      "view_users",
      "view_investments",
      "view_properties",
      "manage_tickets",
      "manage_chat",
      "view_kyc_documents",
    ],
    color: "bg-purple-500",
  },
  {
    id: "property_manager",
    name: "Property Manager",
    description: "Manages properties, documents, and property-related operations",
    icon: <Building className="h-5 w-5" />,
    permissions: [
      "view_properties",
      "create_properties",
      "edit_properties",
      "manage_property_documents",
      "view_investments",
    ],
    color: "bg-orange-500",
  },
  {
    id: "kyc_reviewer",
    name: "KYC Reviewer",
    description: "Reviews and approves KYC documents and questionnaires",
    icon: <CheckCircle className="h-5 w-5" />,
    permissions: [
      "view_users",
      "view_kyc_documents",
      "approve_kyc_documents",
      "reject_kyc_documents",
      "approve_questionnaire",
      "reject_questionnaire",
    ],
    color: "bg-red-500",
  },
];

interface RoleTemplatesProps {
  onApplyTemplate: (template: RoleTemplate) => void;
}

export default function RoleTemplates({ onApplyTemplate }: RoleTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<RoleTemplate | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  const handlePreview = (template: RoleTemplate) => {
    setSelectedTemplate(template);
    setPreviewDialogOpen(true);
  };

  const handleApply = () => {
    if (selectedTemplate) {
      onApplyTemplate(selectedTemplate);
      setPreviewDialogOpen(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Quick Start Templates</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Apply pre-configured permission sets for common roles
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roleTemplates.map((template) => (
            <Card
              key={template.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handlePreview(template)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`${template.color} p-2 rounded-lg text-white`}>
                    {template.icon}
                  </div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                </div>
                <CardDescription className="text-sm mt-2">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {template.permissions.length} permissions
                  </Badge>
                  <Button variant="ghost" size="sm">
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {selectedTemplate && (
                <div className={`${selectedTemplate.color} p-3 rounded-lg text-white`}>
                  {selectedTemplate.icon}
                </div>
              )}
              <div>
                <DialogTitle>{selectedTemplate?.name}</DialogTitle>
                <DialogDescription>{selectedTemplate?.description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-3">Included Permissions:</h4>
              <div className="grid grid-cols-2 gap-2">
                {selectedTemplate?.permissions.map((permission) => (
                  <div
                    key={permission}
                    className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                  >
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">{permission}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> This template will create a new role with the permissions
                listed above. You can customize the permissions after creation.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
