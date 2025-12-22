import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  User,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Breadcrumb } from "@/components/Breadcrumb";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
}

const fundraiserNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/fundraiser" },
  { icon: Building2, label: "My Properties", path: "/fundraiser/properties" },
  { icon: Plus, label: "New Submission", path: "/fundraiser/properties/new" },
  { icon: Layers, label: "My Offerings", path: "/fundraiser/offerings" },
];

const bottomNavItems: NavItem[] = [
  { icon: Settings, label: "Settings", path: "/profile" },
];

interface FundraiserLayoutProps {
  children: React.ReactNode;
}

export default function FundraiserLayout({ children }: FundraiserLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const NavContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b",
        collapsed && !mobile ? "justify-center" : "justify-between"
      )}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          {(!collapsed || mobile) && (
            <span className="font-bold text-lg">Fundraiser Portal</span>
          )}
        </Link>
        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {fundraiserNavItems.map((item) => {
            const isActive = location === item.path || 
              (item.path !== "/fundraiser" && location.startsWith(item.path));
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    collapsed && !mobile ? "px-2" : "px-3"
                  )}
                  onClick={() => mobile && setMobileOpen(false)}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {(!collapsed || mobile) && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="my-4 mx-4 border-t" />

        {/* Quick Actions */}
        {(!collapsed || mobile) && (
          <div className="px-4 mb-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              Quick Actions
            </p>
            <div className="space-y-1">
              <Link href="/fundraiser/properties/new">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => mobile && setMobileOpen(false)}
                >
                  <Plus className="h-4 w-4" />
                  Submit Property
                </Button>
              </Link>
              <Link href="/fundraiser/offerings">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => mobile && setMobileOpen(false)}
                >
                  <Layers className="h-4 w-4" />
                  Create Offering
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <nav className="space-y-1 px-2 mt-auto">
          {bottomNavItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    collapsed && !mobile ? "px-2" : "px-3"
                  )}
                  onClick={() => mobile && setMobileOpen(false)}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {(!collapsed || mobile) && <span>{item.label}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User Profile */}
      <div className={cn(
        "border-t p-4",
        collapsed && !mobile ? "flex justify-center" : ""
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full gap-3",
                collapsed && !mobile ? "px-2 justify-center" : "justify-start"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImage || undefined} />
                <AvatarFallback>
                  {user?.name?.charAt(0).toUpperCase() || "F"}
                </AvatarFallback>
              </Avatar>
              {(!collapsed || mobile) && (
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">{user?.name || "Fundraiser"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLocation("/profile")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/")}>
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </DropdownMenuItem>
            {(user?.role === "admin" || user?.role === "super_admin") && (
              <DropdownMenuItem onClick={() => setLocation("/admin/dashboard")}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Admin Panel
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <NavContent mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <div className="hidden sm:block">
              <Breadcrumb />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/fundraiser/properties/new">
              <Button size="sm" className="hidden sm:flex gap-2">
                <Plus className="h-4 w-4" />
                New Property
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto py-6 px-4 lg:px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
