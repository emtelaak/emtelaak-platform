import { useState, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
  Loader2,
  ArrowLeft,
  Upload,
  File,
  FileText,
  Download,
  Trash2,
  Eye,
  Lock,
  Unlock,
  AlertCircle,
} from "lucide-react";

/**
 * OFFERING DOCUMENTS MANAGER
 * Comprehensive document upload and management interface
 * 
 * Features:
 * - Drag-and-drop file upload
 * - Document categorization (PPM, Subscription Agreement, Financial Statements, etc.)
 * - Version control
 * - Public/Private access control
 * - Document preview and download
 * - Document metadata management
 */

type DocumentCategory =
  | "ppm"
  | "subscription_agreement"
  | "operating_agreement"
  | "financial_statements"
  | "property_appraisal"
  | "legal_opinion"
  | "tax_documents"
  | "other";

const DOCUMENT_CATEGORIES: Record<DocumentCategory, string> = {
  ppm: "Private Placement Memorandum",
  subscription_agreement: "Subscription Agreement",
  operating_agreement: "Operating Agreement",
  financial_statements: "Financial Statements",
  property_appraisal: "Property Appraisal",
  legal_opinion: "Legal Opinion",
  tax_documents: "Tax Documents",
  other: "Other",
};

export default function OfferingDocuments() {
  const [, params] = useRoute("/offerings/:id/documents");
  const [, navigate] = useLocation();
  const offeringId = params?.id ? parseInt(params.id) : 0;

  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentData, setDocumentData] = useState({
    documentCategory: "" as DocumentCategory,
    title: "",
    description: "",
    isPublic: false,
  });

  const { data: documents, isLoading, refetch } = trpc.offerings.getDocuments.useQuery(
    { offeringId },
    { enabled: offeringId > 0 }
  );

  const uploadMutation = trpc.offerings.uploadDocument.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded successfully!");
      setSelectedFile(null);
      setDocumentData({
        documentCategory: "" as DocumentCategory,
        title: "",
        description: "",
        isPublic: false,
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const deleteMutation = trpc.offerings.deleteDocument.useMutation({
    onSuccess: () => {
      toast.success("Document deleted successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentData.documentCategory as any as any || !documentData.title) {
      toast.error("Please fill in all required fields and select a file");
      return;
    }

    setUploading(true);
    try {
      // Convert file to base64 for upload
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        await uploadMutation.mutateAsync({
          offeringId,
          documentCategory: documentData.documentCategory as any as any,
          documentType: selectedFile.type || 'application/octet-stream',
          title: documentData.title,
          description: documentData.description,
          fileName: selectedFile.name,
          fileData: base64Data,
          mimeType: selectedFile.type || 'application/octet-stream',
          isPublic: documentData.isPublic,
        });
        setUploading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this document?")) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Breadcrumb />
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(`/offerings/${offeringId}`)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Offering
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Offering Documents</h1>
        </div>
        <p className="text-muted-foreground">
          Upload and manage all legal and financial documents for this offering
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload New Document</CardTitle>
            <CardDescription>
              Add legal documents, financial statements, and other required materials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drag and Drop Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-2">
                {selectedFile ? selectedFile.name : "Drag and drop your file here"}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                or click to browse
              </p>
              <Input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                Select File
              </Button>
              {selectedFile && (
                <div className="mt-4 p-3 bg-muted rounded-md text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <File className="w-4 h-4" />
                      <span className="text-sm font-medium">{selectedFile.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Document Metadata */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Document Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={documentData.documentCategory as any as any}
                  onValueChange={(value) =>
                    setDocumentData((prev) => ({ ...prev, documentCategory: value as DocumentCategory }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOCUMENT_CATEGORIES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">
                  Document Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Private Placement Memorandum - Q4 2024"
                  value={documentData.title}
                  onChange={(e) =>
                    setDocumentData((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the document..."
                  rows={3}
                  value={documentData.description}
                  onChange={(e) =>
                    setDocumentData((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={documentData.isPublic}
                  onChange={(e) =>
                    setDocumentData((prev) => ({ ...prev, isPublic: e.target.checked }))
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor="isPublic" className="cursor-pointer">
                  Make this document publicly accessible
                </Label>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Private documents are only visible to approved investors. Public documents can be
                  viewed by anyone.
                </AlertDescription>
              </Alert>
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !documentData.documentCategory as any as any || !documentData.title}
              className="w-full"
            >
              {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Upload Document
            </Button>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
            <CardDescription>
              {documents?.length || 0} document(s) uploaded
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!documents || documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No documents uploaded yet</p>
                <p className="text-sm">Upload your first document to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-primary" />
                          <h4 className="font-medium">{doc.title}</h4>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">
                            {DOCUMENT_CATEGORIES[doc.category as DocumentCategory]}
                          </Badge>
                          <Badge variant={doc.isPublic ? "default" : "secondary"}>
                            {doc.isPublic ? (
                              <>
                                <Unlock className="w-3 h-3 mr-1" />
                                Public
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 mr-1" />
                                Private
                              </>
                            )}
                          </Badge>
                          {doc.version > 1 && (
                            <Badge variant="outline">v{doc.version}</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {doc.description && (
                      <p className="text-sm text-muted-foreground mb-3">{doc.description}</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>{doc.fileName}</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>Uploaded {formatDate(doc.uploadedAt)}</span>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="w-3 h-3 mr-1" />
                          Preview
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={doc.fileUrl} download>
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(doc.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
