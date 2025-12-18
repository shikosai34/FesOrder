"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import {
  useAuth,
  clearAuthInfo,
  ROLE_NAMES,
  hasPermission,
  type RoleType,
} from "@/hooks/useCircleAuth";
import {
  Shield,
  LogOut,
  LogIn,
  Home,
  UtensilsCrossed,
  ShoppingCart,
  ChefHat,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from "lucide-react";

export default function Header() {
  const router = useRouter();
  const { circleId, role, roleName, userName, isLoading, isAuthenticated } =
    useAuth();

  const handleLogout = () => {
    clearAuthInfo();
    localStorage.removeItem("circleName");
    localStorage.removeItem("eventName");
    toast.success("ログアウトしました");
    router.push("/circle-login");
  };

  // ロールに基づいてリンクをフィルタリング
  const allLinks: Array<{
    to: "/" | "/menu" | "/register" | "/backyard" | "/dashboard" | "/admin";
    label: string;
    permission: string | null;
    icon: LucideIcon;
  }> = [
    { to: "/", label: "Home", permission: null, icon: Home },
    { to: "/menu", label: "メニュー", permission: null, icon: UtensilsCrossed },
    {
      to: "/register",
      label: "レジ",
      permission: "order:write",
      icon: ShoppingCart,
    },
    { to: "/backyard", label: "厨房", permission: "order:read", icon: ChefHat },
    {
      to: "/dashboard",
      label: "ダッシュボード",
      permission: "circle:read",
      icon: LayoutDashboard,
    },
    { to: "/admin", label: "管理者", permission: null, icon: Settings },
  ];

  const links = allLinks.filter(
    (link) => link.permission === null || hasPermission(role, link.permission)
  );

  const circleName =
    typeof window !== "undefined" ? localStorage.getItem("circleName") : null;

  const getRoleBadgeVariant = (
    role: RoleType | null
  ): "default" | "secondary" | "destructive" | "outline" => {
    if (!role) return "outline";
    switch (role) {
      case "event_admin":
        return "destructive";
      case "circle_manager":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-4 py-2">
        <nav className="flex gap-4 text-lg items-center">
          {links.map(({ to, label, icon: Icon }) => {
            return (
              <Link
                key={to}
                href={to}
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {/* 認証情報表示 */}
          {isAuthenticated && !isLoading && (
            <div className="flex items-center gap-2">
              {circleName && (
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {circleName}
                </span>
              )}
              {role && (
                <Badge variant={getRoleBadgeVariant(role)} className="gap-1">
                  <Shield className="h-3 w-3" />
                  {roleName}
                </Badge>
              )}
              {userName && (
                <span className="text-sm font-medium hidden md:inline">
                  {userName}
                </span>
              )}
            </div>
          )}

          {/* ログイン/ログアウトボタン */}
          {isAuthenticated ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-1"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">ログアウト</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/circle-login")}
              className="gap-1"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">ログイン</span>
            </Button>
          )}

          <ModeToggle />
          <UserMenu />
        </div>
      </div>
      <hr />
    </div>
  );
}
