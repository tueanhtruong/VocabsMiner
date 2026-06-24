"use client";
import { DashboardNavbar } from "@/app/dashboard/dashboard-navbar";
import { getUidFromLocalStore } from "@/lib/auth/google-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!getUidFromLocalStore()) {
      router.replace("/login?next=/dashboard");
    }
  }, [router]);
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-white via-blue-50 to-indigo-50">
      <DashboardNavbar />
      {children}
    </div>
  );
}
