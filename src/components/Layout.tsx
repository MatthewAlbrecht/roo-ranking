"use client";

import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b bg-background">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/artists" className="font-semibold">
              Roo Ranking
            </Link>
            <div className="flex gap-4">
              <Link
                href="/artists"
                className={cn(
                  "text-sm transition-colors hover:text-foreground",
                  pathname === "/artists" || pathname.startsWith("/artists")
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                Artists
              </Link>
              <Link
                href="/aggregate"
                className={cn(
                  "text-sm transition-colors hover:text-foreground",
                  pathname === "/aggregate"
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                Aggregate
              </Link>
              {user.isAdmin && (
                <Link
                  href="/admin"
                  className={cn(
                    "text-sm transition-colors hover:text-foreground",
                    pathname.startsWith("/admin")
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className={cn(
                "text-sm transition-colors hover:text-foreground",
                pathname === "/settings"
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {user.username}
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </nav>
      <main className={cn(
        "flex-1 container mx-auto px-4 py-6",
        pathname.startsWith("/admin") ? "max-w-4xl" : "max-w-2xl"
      )}>{children}</main>
    </div>
  );
}
