"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  clearUidFromLocalStore,
  SessionUser,
  signOutSession,
} from "@/lib/auth/google-auth";
import { useRestoreSessionQuery } from "@/lib/query-hooks/auth";

function DashboardNavbar() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: restoredSession } = useRestoreSessionQuery();
  const user = useMemo<SessionUser | null>(() => {
    if (!restoredSession?.restored) {
      return null;
    }

    return restoredSession.user;
  }, [restoredSession]);

  useEffect(() => {
    if (!restoredSession) {
      return;
    }

    if (!restoredSession.restored) {
      clearUidFromLocalStore();
    }
  }, [restoredSession]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    setMenuOpen(false);
    await signOutSession();
    queryClient.removeQueries({ queryKey: ["auth", "session", "restore"] });
    router.replace("/login");
  }

  const initials =
    user?.displayName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "U";

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 transition hover:opacity-80"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-600 to-blue-600">
            <span className="text-xs font-bold text-white">V</span>
          </div>
          <span className="text-base font-bold tracking-tight text-gray-900">
            VocabMiner
          </span>
        </Link>

        {/* Avatar + Dropdown */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-transparent ring-2 ring-indigo-100 transition hover:ring-indigo-400 focus:outline-none"
            aria-label="User menu"
            aria-expanded={menuOpen}
          >
            {user?.photoUrl ? (
              <Image
                src={user.photoUrl}
                alt={user.displayName ?? "User avatar"}
                width={36}
                height={36}
                className="h-full w-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-xs font-bold text-white">
                {initials}
              </span>
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 origin-top-right overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              {/* User info */}
              {user?.displayName || user?.email ? (
                <div className="border-b border-gray-100 px-4 py-3">
                  {user.displayName && (
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {user.displayName}
                    </p>
                  )}
                  {user.email && (
                    <p className="truncate text-xs text-gray-500">
                      {user.email}
                    </p>
                  )}
                </div>
              ) : null}

              {/* Navigation */}
              <div className="py-1">
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {/* Home Icon */}
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M3 9.5l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                    <polyline
                      points="9 22 9 12 15 12 15 22"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/history"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  History
                </Link>
              </div>

              {/* Sign out */}
              <div className="border-t border-gray-100 py-1">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-white via-blue-50 to-indigo-50">
      <DashboardNavbar />
      {children}
    </div>
  );
}
