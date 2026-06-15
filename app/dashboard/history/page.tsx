"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { HistoryPanel } from "@/app/dashboard/history/history-panel";
import { getUidFromLocalStore } from "@/lib/auth/google-auth";

export default function HistoryPage() {
  const router = useRouter();

  useEffect(() => {
    if (!getUidFromLocalStore()) {
      router.replace("/login?next=/dashboard/history");
    }
  }, [router]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Profile History
        </h1>
        <p className="text-gray-600">
          Review your passage submissions and vocabulary timeline.
        </p>
      </header>
      <HistoryPanel />
    </main>
  );
}
