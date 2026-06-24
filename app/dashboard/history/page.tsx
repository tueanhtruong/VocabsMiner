"use client";

import { HistoryPanel } from "@/app/dashboard/history/history-panel";

export default function HistoryPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-10">
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
