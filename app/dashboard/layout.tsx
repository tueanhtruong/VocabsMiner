"use client";

import { onIdTokenChanged } from "firebase/auth";
import { DashboardNavbar } from "@/app/dashboard/dashboard-navbar";
import { getFirebaseClientAuth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const auth = getFirebaseClientAuth();

    return onIdTokenChanged(auth, (user) => {
      if (!user) {
        router.replace("/login?next=/dashboard");
        return;
      }

      setIsAuthReady(true);
    });
  }, [router]);

  if (!isAuthReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-white via-blue-50 to-indigo-50 px-6">
        <p className="text-sm text-gray-600">Checking your session...</p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-white via-blue-50 to-indigo-50">
      <DashboardNavbar />
      {children}
    </div>
  );
}
