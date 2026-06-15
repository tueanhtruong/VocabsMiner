"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getUidFromLocalStore } from "@/lib/auth/google-auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (!getUidFromLocalStore()) {
      router.replace("/login?next=/");
    }
  }, [router]);

  return (
    <main className="flex w-full flex-col bg-gradient-to-br from-white via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mx-auto max-w-4xl space-y-8 animate-fade-in-up">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600">
              <span className="text-lg font-bold text-white">V</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              VocabMiner
            </h1>
          </div>

          {/* Tagline */}
          <h2 className="text-5xl font-bold leading-tight text-gray-900 md:text-6xl">
            Turn dense IELTS passages into your{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              vocabulary goldmine
            </span>
          </h2>

          {/* Description */}
          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-gray-600">
            Stop pausing your IELTS practice to look up words. Paste any dense
            reading passage into{" "}
            <span className="font-semibold">VocabMiner</span> and let AI
            instantly extract, define, and contextualize the high-impact
            academic vocabulary you need to hit{" "}
            <span className="font-semibold">Band 7+</span>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:shadow-xl hover:scale-105 active:scale-100"
            >
              Start Extracting
              <svg
                className="ml-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link
              href="/dashboard/history"
              className="inline-flex items-center justify-center rounded-lg border-2 border-gray-300 px-8 py-4 text-base font-semibold text-gray-900 transition hover:border-indigo-600 hover:bg-indigo-50"
            >
              View History
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h3 className="mb-16 text-center text-3xl font-bold text-gray-900">
            How VocabMiner Works
          </h3>
          <div className="grid gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="animate-slide-in-right rounded-2xl border border-gray-200 bg-gray-50 p-8 transition hover:shadow-lg hover:border-indigo-200">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                <svg
                  className="h-6 w-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h4 className="mb-2 text-xl font-semibold text-gray-900">
                Paste Your Passage
              </h4>
              <p className="text-gray-600">
                Simply paste any IELTS reading passage into VocabMiner and let
                AI do the heavy lifting.
              </p>
            </div>

            {/* Feature 2 */}
            <div
              className="animate-slide-in-right rounded-2xl border border-gray-200 bg-gray-50 p-8 transition hover:shadow-lg hover:border-indigo-200"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h4 className="mb-2 text-xl font-semibold text-gray-900">
                Instant Extraction
              </h4>
              <p className="text-gray-600">
                Our AI instantly identifies high-impact academic vocabulary
                words that matter for Band 7+.
              </p>
            </div>

            {/* Feature 3 */}
            <div
              className="animate-slide-in-right rounded-2xl border border-gray-200 bg-gray-50 p-8 transition hover:shadow-lg hover:border-indigo-200"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <svg
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="mb-2 text-xl font-semibold text-gray-900">
                Complete Definitions
              </h4>
              <p className="text-gray-600">
                Get precise definitions and contextual usage examples for every
                word extracted from your passage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-20 text-white">
        <div className="mx-auto max-w-4xl">
          <h3 className="mb-12 text-center text-3xl font-bold">
            Transform Your IELTS Practice
          </h3>
          <div className="grid gap-8 text-center md:grid-cols-3">
            <div>
              <p className="text-4xl font-bold">Seconds</p>
              <p className="mt-2 text-indigo-100">
                to extract vocabulary from any passage
              </p>
            </div>
            <div>
              <p className="text-4xl font-bold">Definitions</p>
              <p className="mt-2 text-indigo-100">
                with contextual examples included
              </p>
            </div>
            <div>
              <p className="text-4xl font-bold">Band 7+</p>
              <p className="mt-2 text-indigo-100">vocabulary level focus</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h3 className="mb-4 text-3xl font-bold text-gray-900">
            Ready to boost your vocabulary?
          </h3>
          <p className="mb-8 text-xl text-gray-600">
            Start extracting academic vocabulary from your IELTS passages today.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:shadow-xl hover:scale-105 active:scale-100"
          >
            Go to Dashboard
            <svg
              className="ml-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 px-6 py-8 text-center text-sm text-gray-600">
        <p>VocabMiner © 2024. Empowering IELTS learners worldwide.</p>
      </footer>
    </main>
  );
}
