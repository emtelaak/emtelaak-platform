import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  DollarSign, 
  FileCheck, 
  User, 
  ArrowDownCircle,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS, ar } from "date-fns/locale";

interface Activity {
  id: string;
  type: 'investment' | 'transaction' | 'kyc_update' | 'profile_update' | 'distribution';
  description: string;
  amount?: number;
  currency?: string;
  status?: string;
  timestamp: Date;
}

interface RecentActivityProps {
  activities: Activity[];
  isLoading?: boolean;
}

export default function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  const { t, language } = useLanguage();

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'investment':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'transaction':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'kyc_update':
        return <FileCheck className="h-5 w-5 text-purple-500" />;
      case 'profile_update':
        return <User className="h-5 w-5 text-orange-500" />;
      case 'distribution':
        return <ArrowDownCircle className="h-5 w-5 text-emerald-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "outline", label: t.status?.pending || "Pending" },
      confirmed: { variant: "default", label: t.status?.approved || "Confirmed" },
      active: { variant: "default", label: t.status?.approved || "Active" },
      completed: { variant: "default", label: t.status?.approved || "Completed" },
      processed: { variant: "default", label: t.status?.approved || "Processed" },
      failed: { variant: "destructive", label: t.status?.rejected || "Failed" },
      cancelled: { variant: "secondary", label: t.status?.rejected || "Cancelled" },
      approved: { variant: "default", label: t.status?.approved || "Approved" },
      rejected: { variant: "destructive", label: t.status?.rejected || "Rejected" },
    };

    const config = statusConfig[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  const formatAmount = (amount?: number, currency?: string) => {
    if (!amount) return null;
    const formatted = (amount / 100).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${currency || 'USD'} ${formatted}`;
  };

  const formatTimestamp = (timestamp: Date) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: language === 'ar' ? ar : enUS,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.profile?.recentActivity?.title || "Recent Activity"}</CardTitle>
          <CardDescription>{t.profile?.recentActivity?.subtitle || "Your latest actions and transactions"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.profile?.recentActivity?.title || "Recent Activity"}</CardTitle>
          <CardDescription>{t.profile?.recentActivity?.subtitle || "Your latest actions and transactions"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t.profile?.recentActivity?.noActivity || "No recent activity"}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.profile?.recentActivity?.title || "Recent Activity"}</CardTitle>
        <CardDescription>{t.profile?.recentActivity?.subtitle || "Your latest actions and transactions"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
            >
              <div className="mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.description}
                  </p>
                  {activity.status && getStatusBadge(activity.status)}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{formatTimestamp(activity.timestamp)}</span>
                  {activity.amount && (
                    <>
                      <span>•</span>
                      <span className="font-medium text-foreground">
                        {formatAmount(activity.amount, activity.currency)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
