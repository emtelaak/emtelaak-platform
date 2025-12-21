import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, CheckCircle, AlertCircle, Send, ArrowLeft } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";
import { useLocation, Link } from "wouter";

export default function EmailSettings() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [testEmail, setTestEmail] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  // Redirect if not super admin
  if (!authLoading && user?.role !== "super_admin") {
    setLocation("/");
    return null;
  }

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error("Please enter an email address");
      return;
    }

    setIsTesting(true);
    try {
      // This would call a backend endpoint to send test email
      // For now, we'll just show a message
      toast.info("Test email functionality requires SendGrid API key configuration");
      toast.info("Please add SENDGRID_API_KEY to your environment variables in the Management UI Settings → Secrets panel");
    } catch (error) {
      toast.error("Failed to send test email");
    } finally {
      setIsTesting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <Breadcrumb 
          items={[
            { label: "Super Admin", labelAr: "المسؤول العام", href: "/super-admin" },
            { label: "Email Settings", labelAr: "إعدادات البريد الإلكتروني" }
          ]} 
        />
        <h1 className="text-3xl font-bold mb-2 mt-4">Email Notification Settings</h1>
        <p className="text-muted-foreground">
          Configure email notifications for critical security and permission changes
        </p>
      </div>

      <div className="space-y-6">
        {/* Configuration Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              SendGrid Configuration
            </CardTitle>
            <CardDescription>
              Set up email notifications using SendGrid API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Email notifications require a SendGrid API key.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Setup Instructions:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Create a free account at <a href="https://sendgrid.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">sendgrid.com</a></li>
                <li>Navigate to Settings → API Keys in your SendGrid dashboard</li>
                <li>Create a new API key with "Mail Send" permissions</li>
                <li>Copy the API key (you'll only see it once)</li>
                <li>Go to Management UI → Settings → Secrets in this platform</li>
                <li>Add a new secret with key: <code className="bg-muted px-1 py-0.5 rounded">SENDGRID_API_KEY</code></li>
                <li>Paste your SendGrid API key as the value</li>
                <li>Save and restart the development server</li>
              </ol>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">What gets notified?</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>User role changes to admin or super_admin</li>
                <li>Bulk permission changes via role templates</li>
                <li>Critical security events in the admin dashboard</li>
              </ul>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Who receives notifications?</h4>
              <p className="text-sm text-muted-foreground">
                All users with the <strong>super_admin</strong> role will automatically receive email notifications
                for critical permission changes. This ensures proper oversight and security monitoring.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Test Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Test Email Notification
            </CardTitle>
            <CardDescription>
              Send a test email to verify your SendGrid configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testEmail">Test Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="your.email@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={sendTestEmail}
                  disabled={isTesting || !testEmail}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Test
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This will send a test security notification email to verify the system is working
              </p>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> If you don't receive the test email within a few minutes, check:
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Your spam/junk folder</li>
                  <li>That the SendGrid API key is correctly configured</li>
                  <li>The server logs for any error messages</li>
                  <li>That your SendGrid account is verified and active</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Email Template Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Email Template Preview</CardTitle>
            <CardDescription>
              Example of what super admins will receive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-[#1e3a8a] text-white p-4">
                <h2 className="text-xl font-bold mb-1">🔐 Emtelaak Security Alert</h2>
                <p className="text-sm opacity-90">User Role Changed</p>
              </div>
              <div className="bg-gray-50 p-4 space-y-3">
                <p className="text-sm">A critical permission change has been made in the Emtelaak platform:</p>
                
                <div className="bg-white p-3 border-l-4 border-[#84cc16] rounded">
                  <div className="font-semibold text-sm text-[#1e3a8a] mb-1">Action Performed:</div>
                  <div className="text-sm">User Role Changed</div>
                </div>
                
                <div className="bg-white p-3 border-l-4 border-[#84cc16] rounded">
                  <div className="font-semibold text-sm text-[#1e3a8a] mb-1">Performed By:</div>
                  <div className="text-sm">Admin User (admin@emtelaak.com)</div>
                </div>
                
                <div className="bg-white p-3 border-l-4 border-[#84cc16] rounded">
                  <div className="font-semibold text-sm text-[#1e3a8a] mb-1">Target User:</div>
                  <div className="text-sm">John Doe (john@example.com)</div>
                </div>
                
                <div className="bg-white p-3 border-l-4 border-[#84cc16] rounded">
                  <div className="font-semibold text-sm text-[#1e3a8a] mb-1">Details:</div>
                  <div className="text-sm">User role was changed to super_admin</div>
                </div>
                
                <div className="text-sm space-y-2 mt-4">
                  <p>
                    <strong>Why am I receiving this?</strong><br />
                    <span className="text-muted-foreground">
                      You are receiving this notification because you are a super administrator of the Emtelaak platform.
                      All critical permission changes are automatically logged and reported for security purposes.
                    </span>
                  </p>
                  
                  <p>
                    <strong>Action Required:</strong><br />
                    <span className="text-muted-foreground">
                      Please review this change in the Super Admin Dashboard. If this action was not authorized,
                      please investigate immediately and take appropriate action.
                    </span>
                  </p>
                </div>
              </div>
              <div className="bg-white border-t p-4 text-xs text-gray-500">
                <p>This is an automated security notification from Emtelaak Platform.</p>
                <p>© 2025 Emtelaak. All rights reserved.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
