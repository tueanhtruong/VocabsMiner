"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { LoginStatus } from "@/app/login/login-status";
import {
  useGoogleSignInMutation,
  useRestoreSessionQuery,
} from "@/lib/query-hooks/auth";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    message: string;
    tone: "idle" | "success" | "error";
  }>({
    message: "Sign in with Google to start extracting vocabulary.",
    tone: "idle",
  });
  const signInMutation = useGoogleSignInMutation();

  const { data: restoredSession } = useRestoreSessionQuery();

  useEffect(() => {
    if (!restoredSession?.restored || isSubmitting) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus({
      message: "Welcome back. Redirecting...",
      tone: "success",
    });
    router.push(nextPath);
    router.refresh();
  }, [isSubmitting, nextPath, restoredSession, router]);

  async function handleGoogleSignIn() {
    try {
      setIsSubmitting(true);
      setStatus({ message: "Signing in with Google...", tone: "idle" });
      await signInMutation.mutateAsync();
      setStatus({
        message: "Login successful. Redirecting...",
        tone: "success",
      });
      router.push(nextPath);
      router.refresh();
    } catch {
      setStatus({
        message: "Google sign-in failed or was canceled. Please try again.",
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-white via-blue-50 to-indigo-50 px-6 py-16">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600">
            <span className="text-lg font-bold text-white">V</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            VocabMiner
          </h1>
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome to VocabMiner
        </h2>
        <p className="text-gray-600">
          Google account access is required before using extraction features.
        </p>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:shadow-xl hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 active:scale-100"
        >
          {isSubmitting ? "Signing in..." : "Continue with Google"}
        </button>
        <LoginStatus message={status.message} tone={status.tone} />
      </div>
    </main>
  );
}

function LoginPageFallback() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-white via-blue-50 to-indigo-50 px-6 py-16">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          VocabMiner
        </h1>
        <p className="text-gray-600">Loading login...</p>
      </div>
    </main>
  );
}
