"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function LogoutPage() {
  const { logout, isLoading } = useAuth();
  const router = useRouter();
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    const doLogout = async () => {
      // Only run once and after auth has initialized
      if (hasLoggedOut.current || isLoading) return;
      hasLoggedOut.current = true;

      await logout();
      router.replace("/");
    };
    doLogout();
  }, [logout, isLoading, router]);

  return null;
}
