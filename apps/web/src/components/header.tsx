"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { toast } from "sonner";
import {
  useAuth,
  clearAuthInfo,
  hasPermission,
} from "@/hooks/useCircleAuth";
import { useTheme } from "@/components/theme-provider";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { role, userName, circleName, isLoading, isAuthenticated, isEventAdmin } =
    useAuth();
  const { theme } = useTheme();

  const handleLogout = () => {
    clearAuthInfo();
    localStorage.removeItem("circleName");
    localStorage.removeItem("eventName");
    toast.success("ログアウトしました");
    router.push("/circle-login");
  };

  // ロールに基づいてリンクをフィルタリング
  const allLinks: Array<{
    to: "/" | "/menu" | "/my-order" | "/register" | "/backyard" | "/dashboard" | "/admin";
    label: string;
    permission: string | null;
  }> = [
      { to: "/menu", label: "メニュー", permission: null },
      { to: "/my-order", label: "マイQR", permission: null },
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
      { to: "/admin", label: "管理", permission: "event:write" },
    ];

  const links = allLinks.filter(
    (link) => link.permission === null || hasPermission(role, link.permission, isEventAdmin)
  );

  const isActive = (to: string) => {
    if (to === "/") return pathname === "/";
    return pathname.startsWith(to);
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b-[3px] border-border text-foreground">
      <div className="flex flex-row items-center justify-between px-4 py-2 max-w-7xl mx-auto gap-4">
        {/* ロゴ / サイト名 */}
        <Link
          href="/"
          className="font-headline text-lg md:text-xl uppercase tracking-[2px] leading-none select-none hover:opacity-80 flex items-center gap-2 shrink-0"
        >
          {theme.logoUrl ? (
            <img src={theme.logoUrl} alt="Logo" className="h-6 object-contain" />
          ) : (
            <span className="font-black border-[2px] border-border px-2 py-1 bg-primary text-primary-foreground">FES_ORDER</span>
          )}
        </Link>

        {/* ナビゲーションリンク */}
        <nav className="flex items-center gap-1 font-headline text-[13px] uppercase tracking-[1px] overflow-x-auto py-1">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              href={to}
              className={`px-3 py-1.5 border-[2px] border-border transition-all whitespace-nowrap ${isActive(to)
                ? "bg-primary text-primary-foreground font-bold"
                : "bg-background text-foreground hover:bg-muted"
                }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* 右サイド：認証情報＋アクション */}
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated && !isLoading && (
            <div className="hidden md:flex items-center gap-1.5 font-mono text-[11px]">
              <span className="bg-muted border-[1.5px] border-border px-2 py-1 font-bold">
                {circleName || userName || "スタッフ"}
              </span>
            </div>
          )}

          {/* ログイン/ログアウトボタン */}
          {isAuthenticated ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="h-8 text-xs font-mono px-3"
            >
              ログアウト
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/circle-login")}
              className="h-8 text-xs font-mono px-3"
            >
              ログイン
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
