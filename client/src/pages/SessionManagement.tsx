import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Monitor, Smartphone, Tablet, MapPin, Clock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * Session Management Dashboard
 * 
 * Allows users to:
 * - View all active sessions
 * - See device, location, and activity details
 * - Identify current session
 * - Revoke specific sessions
 * - Revoke all other sessions at once
 */
export default function SessionManagement() {
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  // Fetch sessions
  const { data: sessions, isLoading, refetch } = trpc.sessionManagement.listSessions.useQuery();
  const { data: stats } = trpc.sessionManagement.getSessionStats.useQuery();

  // Mutations
  const revokeSessionMutation = trpc.sessionManagement.revokeSession.useMutation({
    onSuccess: () => {
      toast.success("Session revoked successfully");
      refetch();
      setRevokingSessionId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to revoke session");
      setRevokingSessionId(null);
    },
  });

  const revokeAllMutation = trpc.sessionManagement.revokeAllOtherSessions.useMutation({
    onSuccess: () => {
      toast.success("All other sessions revoked successfully");
      refetch();
      setRevokingAll(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to revoke sessions");
      setRevokingAll(false);
    },
  });

  const handleRevokeSession = (sessionId: string) => {
    setRevokingSessionId(sessionId);
    revokeSessionMutation.mutate({ sessionId });
  };

  const handleRevokeAll = () => {
    setRevokingAll(true);
    revokeAllMutation.mutate();
  };

  const getDeviceIcon = (deviceInfo: string) => {
    const lower = deviceInfo.toLowerCase();
    if (lower.includes("mobile") || lower.includes("iphone") || lower.includes("android")) {
      return <Smartphone className="h-5 w-5" />;
    }
    if (lower.includes("tablet") || lower.includes("ipad")) {
      return <Tablet className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentSession = sessions?.find(s => s.isCurrent);
  const otherSessions = sessions?.filter(s => !s.isCurrent) || [];

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Session Management</h1>
        <p className="text-muted-foreground">
          Manage your active sessions and secure your account
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Device Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(stats.deviceTypes).map(([device, count]) => (
                  <div key={device} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{device}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Browsers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(stats.browsers).map(([browser, count]) => (
                  <div key={browser} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{browser}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Current Session */}
      {currentSession && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Session</h2>
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getDeviceIcon(currentSession.deviceInfo)}
                  <div>
                    <CardTitle className="text-lg">{currentSession.deviceInfo}</CardTitle>
                    <CardDescription>{currentSession.browser}</CardDescription>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Current
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Location</div>
                    <div className="text-muted-foreground">{currentSession.location}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Last Activity</div>
                    <div className="text-muted-foreground">
                      {format(new Date(currentSession.lastActivity), "PPp")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">IP Address</div>
                    <div className="text-muted-foreground font-mono text-xs">
                      {currentSession.ipAddress}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Other Sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Other Sessions</h2>
          {otherSessions.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={revokingAll}>
                  {revokingAll && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Revoke All Other Sessions
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Revoke All Other Sessions?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will sign you out from all devices except this one. You'll need to sign in again on those devices.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRevokeAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Revoke All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {otherSessions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-lg font-medium mb-2">No Other Active Sessions</p>
              <p className="text-sm text-muted-foreground text-center">
                You're only signed in on this device. Great security practice!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {otherSessions.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(session.deviceInfo)}
                      <div>
                        <CardTitle className="text-lg">{session.deviceInfo}</CardTitle>
                        <CardDescription>{session.browser}</CardDescription>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={revokingSessionId === session.sessionId}
                        >
                          {revokingSessionId === session.sessionId ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Revoking...
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Revoke
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke This Session?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will sign you out from {session.deviceInfo}. You'll need to sign in again on that device.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRevokeSession(session.sessionId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Revoke Session
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Location</div>
                        <div className="text-muted-foreground">{session.location}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Last Activity</div>
                        <div className="text-muted-foreground">
                          {format(new Date(session.lastActivity), "PPp")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">IP Address</div>
                        <div className="text-muted-foreground font-mono text-xs">
                          {session.ipAddress}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Security Tips */}
      <Card className="mt-8 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-blue-600" />
            Security Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Regularly review your active sessions and revoke any you don't recognize</li>
            <li>• If you see suspicious activity, revoke all sessions and change your password immediately</li>
            <li>• Avoid using public computers or networks for sensitive transactions</li>
            <li>• Enable two-factor authentication for additional security</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
