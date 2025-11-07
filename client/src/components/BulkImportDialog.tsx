import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, AlertCircle, CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { parseCSV, downloadCSVTemplate, type ParsedUser } from "@/lib/csvParser";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function BulkImportDialog({ open, onOpenChange, onSuccess }: BulkImportDialogProps) {
  const { language } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const bulkImportMutation = trpc.userManagement.bulkImport.useMutation({
    onSuccess: (result) => {
      setImportResult(result);
      setImporting(false);
      if (result.success > 0) {
        toast.success(
          language === "en"
            ? `Successfully imported ${result.success} user(s)`
            : `تم استيراد ${result.success} مستخدم بنجاح`
        );
        onSuccess();
      }
      if (result.failed > 0) {
        toast.error(
          language === "en"
            ? `Failed to import ${result.failed} user(s)`
            : `فشل استيراد ${result.failed} مستخدم`
        );
      }
    },
    onError: (error) => {
      setImporting(false);
      toast.error(error.message);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error(language === "en" ? "Please select a CSV file" : "يرجى تحديد ملف CSV");
      return;
    }

    setFile(selectedFile);
    setImportResult(null);

    // Read and parse CSV
    const text = await selectedFile.text();
    const result = parseCSV(text);
    
    setParsedUsers(result.users);
    setParseErrors(result.errors);

    if (result.errors.length > 0) {
      toast.error(
        language === "en"
          ? `Found ${result.errors.length} error(s) in CSV`
          : `تم العثور على ${result.errors.length} خطأ في CSV`
      );
    }
  };

  const handleImport = () => {
    if (parsedUsers.length === 0) {
      toast.error(language === "en" ? "No valid users to import" : "لا يوجد مستخدمون صالحون للاستيراد");
      return;
    }

    setImporting(true);
    bulkImportMutation.mutate({ users: parsedUsers });
  };

  const handleClose = () => {
    setFile(null);
    setParsedUsers([]);
    setParseErrors([]);
    setImportResult(null);
    onOpenChange(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      const fakeEvent = {
        target: { files: [droppedFile] }
      } as any;
      await handleFileChange(fakeEvent);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === "en" ? "Bulk Import Users" : "استيراد المستخدمين بالجملة"}
          </DialogTitle>
          <DialogDescription>
            {language === "en"
              ? "Upload a CSV file to import multiple users at once"
              : "قم بتحميل ملف CSV لاستيراد عدة مستخدمين دفعة واحدة"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* CSV Template Download */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {language === "en" ? "CSV Template" : "قالب CSV"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === "en"
                    ? "Download a sample CSV file to see the required format"
                    : "قم بتنزيل ملف CSV نموذجي لرؤية التنسيق المطلوب"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={downloadCSVTemplate}>
              <Download className="h-4 w-4 mr-2" />
              {language === "en" ? "Download Template" : "تنزيل القالب"}
            </Button>
          </div>

          {/* File Upload */}
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById('csv-upload')?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              {file
                ? file.name
                : (language === "en"
                  ? "Click to upload or drag and drop"
                  : "انقر للتحميل أو اسحب وأفلت")}
            </p>
            <p className="text-sm text-muted-foreground">
              {language === "en" ? "CSV files only" : "ملفات CSV فقط"}
            </p>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Parse Errors */}
          {parseErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">
                  {language === "en"
                    ? `Found ${parseErrors.length} error(s):`
                    : `تم العثور على ${parseErrors.length} خطأ:`}
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {parseErrors.slice(0, 5).map((error, i) => (
                    <li key={i} className="text-sm">{error}</li>
                  ))}
                  {parseErrors.length > 5 && (
                    <li className="text-sm">
                      {language === "en"
                        ? `... and ${parseErrors.length - 5} more`
                        : `... و ${parseErrors.length - 5} أكثر`}
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Import Result */}
          {importResult && (
            <Alert variant={importResult.failed === 0 ? "default" : "destructive"}>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">
                  {language === "en" ? "Import Complete" : "اكتمل الاستيراد"}
                </p>
                <p className="text-sm mt-1">
                  {language === "en"
                    ? `Successfully imported: ${importResult.success} | Failed: ${importResult.failed}`
                    : `تم الاستيراد بنجاح: ${importResult.success} | فشل: ${importResult.failed}`}
                </p>
                {importResult.errors.length > 0 && (
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {importResult.errors.slice(0, 3).map((error, i) => (
                      <li key={i} className="text-sm">{error}</li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Preview Table */}
          {parsedUsers.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">
                {language === "en"
                  ? `Preview (${parsedUsers.length} user(s))`
                  : `معاينة (${parsedUsers.length} مستخدم)`}
              </h3>
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "en" ? "Open ID" : "معرف مفتوح"}</TableHead>
                      <TableHead>{language === "en" ? "Name" : "الاسم"}</TableHead>
                      <TableHead>{language === "en" ? "Email" : "البريد الإلكتروني"}</TableHead>
                      <TableHead>{language === "en" ? "Role" : "الدور"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedUsers.map((user, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">{user.openId}</TableCell>
                        <TableCell>{user.name || "-"}</TableCell>
                        <TableCell>{user.email || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {user.role || "user"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {language === "en" ? "Cancel" : "إلغاء"}
          </Button>
          <Button
            onClick={handleImport}
            disabled={parsedUsers.length === 0 || importing || parseErrors.length > 0}
          >
            {importing
              ? (language === "en" ? "Importing..." : "جاري الاستيراد...")
              : (language === "en" ? `Import ${parsedUsers.length} User(s)` : `استيراد ${parsedUsers.length} مستخدم`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
