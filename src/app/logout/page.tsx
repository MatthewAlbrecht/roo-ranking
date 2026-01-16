"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function LogoutPage() {
  const { logout, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const doLogout = async () => {
      if (isAuthenticated) {
        await logout();
      }
      router.push("/");
    };
    doLogout();
  }, [logout, isAuthenticated, router]);

  return null;
}
