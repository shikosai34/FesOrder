"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { circleId, role, roleName, userName, circleName, isLoading, isAuthenticated, isEventAdmin } =
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
  }> = [
    { to: "/", label: "Home", permission: null },
    { to: "/menu", label: "メニュー", permission: null },
    {
      to: "/register",
      label: "レジ",
      permission: "order:write",
    },
    { to: "/backyard", label: "厨房", permission: "order:read" },
    {
      to: "/dashboard",
      label: "ダッシュボード",
      permission: "circle:read",
    },
    { to: "/admin", label: "管理者", permission: "event:write" },
  ];

  const links = allLinks.filter(
    (link) => link.permission === null || hasPermission(role, link.permission, isEventAdmin)
  );

  // Remove manual circleName read, using from useAuth instead

  const getRoleBadgeVariant = (
    role: RoleType | null
  ): "default" | "error" | "active" | "warning" | "filter" => {
    // event_admin フラグがある場合は常にerror（赤）バッジ
    if (isEventAdmin) return "error";
    if (!role) return "default";
    switch (role) {
      case "event_admin":
        return "error";
      case "circle_manager":
        return "active";
      default:
        return "warning";
    }
  };

  const isActive = (to: string) => {
    if (to === "/") return pathname === "/";
    return pathname.startsWith(to);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b-[3px] border-black text-black">
      <div className="flex flex-row items-center justify-between px-sp-4 py-sp-2 max-w-7xl mx-auto">
        {/* ロゴ / サイト名 */}
        <Link
          href="/"
          className="font-headline text-[18px] md:text-[22px] uppercase tracking-[3px] leading-none select-none hover:bg-black hover:text-white px-sp-2 py-sp-1 border-[3px] border-black"
        >
          FesOrder
        </Link>

        {/* ナビゲーション */}
        <nav className="hidden md:flex gap-0 font-headline text-[12px] uppercase tracking-[2px] items-center">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              href={to}
              className={`px-sp-3 py-sp-2 border-l-[1px] border-black last:border-r-[1px] ${
                isActive(to)
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-black hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* 右サイド：認証情報＋アクション */}
        <div className="flex items-center gap-sp-2">
          {/* 認証情報表示 */}
          {isAuthenticated && !isLoading && (
            <div className="hidden sm:flex items-center gap-sp-2">
              {circleName && (
                <span className="text-[11px] font-mono uppercase bg-[#F0F0F0] border-[3px] border-black px-sp-2 py-sp-1 tracking-[1px]">
                  {circleName}
                </span>
              )}
              {role && (
                <Badge variant={getRoleBadgeVariant(role)} className="text-[10px]">
                  {roleName}
                </Badge>
              )}
              {userName && (
                <span className="text-[12px] font-headline uppercase tracking-[1px]">
                  {userName}
                </span>
              )}
            </div>
          )}

          {/* モバイル用ナビゲーション: 小さいスクリーンではドロップダウンなしでシンプルに */}
          <nav className="flex md:hidden gap-0 font-headline text-[10px] uppercase tracking-[1px] items-center">
            {links.slice(0, 3).map(({ to, label }) => (
              <Link
                key={to}
                href={to}
                className={`px-sp-2 py-sp-1 border-[1px] border-black ${
                  isActive(to)
                    ? "bg-black text-white"
                    : "bg-white text-black"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* ログイン/ログアウトボタン */}
          {isAuthenticated ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              ログアウト
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/circle-login")}
            >
              ログイン
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
