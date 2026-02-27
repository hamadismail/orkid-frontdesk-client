"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/src/lib/utils";
import {
  Hotel,
  Users,
  CreditCard,
  Settings,
  ChevronRight,
  Clock,
  Calendar,
  LogOut,
  Loader2,
  LayoutDashboard,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "../components/ui/sidebar";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
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
} from "@/src/components/ui/alert-dialog";
import { ModeToggle } from "./ModeToggler";
import { logoutAction } from "@/src/app/actions/auth";

type AppSidebarProps = {
  userRole?: string | null;
};

type NavLink = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const navLinks: NavLink[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: "All Rooms",
    href: "/",
    icon: <Hotel className="h-5 w-5" />,
  },
  {
    label: "Stay View",
    href: "/calendar",
    icon: <Calendar className="h-5 w-5" />,
  },
  { label: "Guests", href: "/guests", icon: <Users className="h-5 w-5" /> },
  {
    label: "Reservations",
    href: "/reservation",
    icon: <Clock className="h-5 w-5" />,
  },
  {
    label: "Payments",
    href: "/payments",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    label: "Sales Report",
    href: "/sales-report",
    icon: <CreditCard className="h-5 w-5" />,
  },
];

const secondaryLinks = [
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

export function AppSidebar({ userRole }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [navigationState, setNavigationState] = useState<{
    [key: string]: boolean;
  }>({});

  const visibleNavLinks = useMemo(
    () => navLinks.filter((link) => link.href !== "/dashboard" || userRole === "ADMIN"),
    [userRole],
  );

  const handleNavigation = useCallback((href: string) => {
    setNavigationState((prev) => ({ ...prev, [href]: true }));

    setTimeout(() => {
      setNavigationState((prev) => ({ ...prev, [href]: false }));
    }, 300);
  }, []);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      const result = await logoutAction();

      if (result.success) {
        toast.success(result.message);
        router.push("/login");
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("An error occurred during logout.");
    } finally {
      setIsLoggingOut(false);
    }
  }, [router]);

  const renderNavLinks = useMemo(
    () =>
      visibleNavLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => handleNavigation(link.href)}
          className={cn(
            "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === link.href
              ? "bg-primary/10 text-primary"
              : "hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <span className="text-muted-foreground">{link.icon}</span>
          <span>{link.label}</span>
          {navigationState[link.href] && (
            <Loader2 className="ml-auto h-4 w-4 animate-spin text-primary" />
          )}
          {pathname === link.href && !navigationState[link.href] && (
            <ChevronRight className="ml-auto h-4 w-4 text-primary" />
          )}
        </Link>
      )),
    [pathname, navigationState, handleNavigation, visibleNavLinks],
  );

  const renderSecondaryLinks = useMemo(
    () =>
      secondaryLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => handleNavigation(link.href)}
          className={cn(
            "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === link.href
              ? "bg-primary/10 text-primary"
              : "hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <span className="text-muted-foreground">{link.icon}</span>
          <span>{link.label}</span>
          {navigationState[link.href] && (
            <Loader2 className="ml-auto h-4 w-4 animate-spin text-primary" />
          )}
        </Link>
      )),
    [pathname, navigationState, handleNavigation],
  );

  return (
    <Sidebar className="border-r bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary p-2">
              <Hotel className="h-6 w-6 text-muted" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary">Putra Hills</h1>
              <p className="text-xs text-muted-foreground">Frontdesk</p>
            </div>
          </div>
          <ModeToggle />
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <div className="space-y-1">{renderNavLinks}</div>
        </SidebarGroup>

        <SidebarGroup className="mt-8">
          <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Management
          </h3>
          <div className="space-y-1">{renderSecondaryLinks}</div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Logout
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to logout?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action will end your current session.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarFooter>
    </Sidebar>
  );
}
