import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Briefcase, Building, UserCheck, Ticket, TrendingUp, DollarSign, Target } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { MobileNav } from "@/components/MobileNav";
import { FloatingActionButton, adminQuickActions } from "@/components/FloatingActionButton";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function CRMDashboard() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  
  const { data: leadAnalytics } = trpc.crm.leads.analytics.useQuery();
  const { data: oppAnalytics } = trpc.crm.opportunities.analytics.useQuery();
  const { data: caseAnalytics } = trpc.crm.cases.analytics.useQuery();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Breadcrumb />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading CRM...</p>
        </div>
      </div>
    );
  }
  
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access the CRM system.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button>Go to Home</Button>
            </Link>
          </CardContent>
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
            <div className="flex items-center gap-3">
              <MobileNav />
              <div>
                <h1 className="text-3xl font-bold">CRM Dashboard</h1>
                <p className="text-muted-foreground mt-1">Sales Cloud & Service Cloud</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline">Back to Platform</Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="container mx-auto py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="cases">Cases</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Leads Stats */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{leadAnalytics?.total || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {leadAnalytics?.new || 0} new, {leadAnalytics?.qualified || 0} qualified
                  </p>
                </CardContent>
              </Card>
              
              {/* Opportunities Stats */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${oppAnalytics?.totalValue ? parseFloat(oppAnalytics.totalValue).toLocaleString() : '0'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {oppAnalytics?.total || 0} opportunities
                  </p>
                </CardContent>
              </Card>
              
              {/* Closed Won */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Closed Won</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{oppAnalytics?.closedWon || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {oppAnalytics?.closedLost || 0} lost
                  </p>
                </CardContent>
              </Card>
              
              {/* Cases Stats */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Open Cases</CardTitle>
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(caseAnalytics?.new || 0) + (caseAnalytics?.inProgress || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {caseAnalytics?.resolved || 0} resolved
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Sales Cloud
                  </CardTitle>
                  <CardDescription>Manage leads, opportunities, and accounts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/crm/leads">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="mr-2 h-4 w-4" />
                      View Leads
                    </Button>
                  </Link>
                  <Link href="/crm/opportunities">
                    <Button variant="outline" className="w-full justify-start">
                      <Briefcase className="mr-2 h-4 w-4" />
                      View Opportunities
                    </Button>
                  </Link>
                  <Link href="/crm/accounts">
                    <Button variant="outline" className="w-full justify-start">
                      <Building className="mr-2 h-4 w-4" />
                      View Accounts
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Service Cloud
                  </CardTitle>
                  <CardDescription>Handle customer support and cases</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/crm/cases">
                    <Button variant="outline" className="w-full justify-start">
                      <Ticket className="mr-2 h-4 w-4" />
                      View Cases
                    </Button>
                  </Link>
                  <Link href="/crm/cases/new">
                    <Button variant="default" className="w-full justify-start">
                      Create New Case
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Analytics
                  </CardTitle>
                  <CardDescription>Track performance and metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Lead Conversion Rate</span>
                      <span className="font-medium">
                        {leadAnalytics?.total ? 
                          ((leadAnalytics.converted / leadAnalytics.total) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Win Rate</span>
                      <span className="font-medium">
                        {oppAnalytics?.total ? 
                          ((oppAnalytics.closedWon / oppAnalytics.total) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Avg. Satisfaction</span>
                      <span className="font-medium">
                        {caseAnalytics?.avgSatisfaction ? 
                          caseAnalytics.avgSatisfaction.toFixed(1) : 'N/A'} / 5
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Sales Pipeline */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Pipeline</CardTitle>
                <CardDescription>Opportunities by stage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Prospecting</span>
                    <span className="text-sm text-muted-foreground">{oppAnalytics?.prospecting || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Qualification</span>
                    <span className="text-sm text-muted-foreground">{oppAnalytics?.qualification || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Proposal</span>
                    <span className="text-sm text-muted-foreground">{oppAnalytics?.proposal || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Negotiation</span>
                    <span className="text-sm text-muted-foreground">{oppAnalytics?.negotiation || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Other tabs will be implemented as separate pages */}
          <TabsContent value="leads">
            <Card>
              <CardHeader>
                <CardTitle>Leads Management</CardTitle>
                <CardDescription>View and manage all leads</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/crm/leads">
                  <Button>Go to Leads</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="opportunities">
            <Card>
              <CardHeader>
                <CardTitle>Opportunities Management</CardTitle>
                <CardDescription>View and manage sales pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/crm/opportunities">
                  <Button>Go to Opportunities</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="accounts">
            <Card>
              <CardHeader>
                <CardTitle>Accounts Management</CardTitle>
                <CardDescription>View and manage company accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/crm/accounts">
                  <Button>Go to Accounts</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <CardTitle>Contacts Management</CardTitle>
                <CardDescription>View and manage contacts</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/crm/contacts">
                  <Button>Go to Contacts</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="cases">
            <Card>
              <CardHeader>
                <CardTitle>Cases Management</CardTitle>
                <CardDescription>View and manage support cases</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/crm/cases">
                  <Button>Go to Cases</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activities">
            <Card>
              <CardHeader>
                <CardTitle>Activities</CardTitle>
                <CardDescription>View notes, tasks, and activities</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Activities are integrated within each CRM module.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        actions={adminQuickActions({
          onCreateUser: () => {
            toast.info("Create User feature coming soon");
          },
          onAddProperty: () => {
            toast.info("Add Property feature coming soon");
          },
          onNewLead: () => {
            window.location.href = "/crm/leads";
          },
          onNewCase: () => {
            window.location.href = "/crm/cases";
          },
        })}
      />
    </div>
  );
}
