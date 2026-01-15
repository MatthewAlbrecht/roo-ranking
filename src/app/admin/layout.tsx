"use client";

import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && user && !user.isAdmin) {
      router.push("/artists");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user?.isAdmin) return null;

  // Determine active tab from pathname
  const activeTab = pathname.includes("/artists")
    ? "artists"
    : pathname.includes("/users")
      ? "users"
      : pathname.includes("/groups")
        ? "groups"
        : pathname.includes("/settings")
          ? "settings"
          : "artists";

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Admin Panel</h1>
            <p className="text-muted-foreground">
              Manage artists, users, groups, and settings
            </p>
          </div>

          <Tabs value={activeTab} className="w-full">
            <TabsList>
              <TabsTrigger value="artists" render={<Link href="/admin/artists" />} nativeButton={false}>
                Artists
              </TabsTrigger>
              <TabsTrigger value="users" render={<Link href="/admin/users" />} nativeButton={false}>
                Users
              </TabsTrigger>
              <TabsTrigger value="groups" render={<Link href="/admin/groups" />} nativeButton={false}>
                Groups
              </TabsTrigger>
              <TabsTrigger value="settings" render={<Link href="/admin/settings" />} nativeButton={false}>
                Settings
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {children}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
