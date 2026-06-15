"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import {
  getRestoreSessionQueryKey,
  getUidFromLocalStore,
  GoogleSignInPayload,
  saveUidToLocalStore,
  signInWithGooglePopup,
} from "@/lib/auth/google-auth";
import { requestJson } from "@/lib/query-hooks/api-client";

type SessionUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
};

type SessionResponse = {
  ok: boolean;
  user: SessionUser;
};

export type RestoreSessionResult =
  | { restored: false }
  | { restored: true; user: SessionUser };

async function createSession(
  params: GoogleSignInPayload,
): Promise<SessionUser> {
  const response = await requestJson<SessionResponse>("/api/auth/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  return response.user;
}

async function restoreSessionFromApi(
  storedUid: string,
): Promise<RestoreSessionResult> {
  try {
    const response = await requestJson<SessionResponse>(
      `/api/auth/session?uid=${encodeURIComponent(storedUid)}`,
      { method: "GET" },
    );

    if (!response?.user?.uid) {
      return { restored: false };
    }

    return { restored: true, user: response.user };
  } catch {
    return { restored: false };
  }
}

export function useRestoreSessionQuery() {
  const storedUid = getUidFromLocalStore();

  return useQuery({
    queryKey: getRestoreSessionQueryKey(storedUid),
    enabled: Boolean(storedUid),
    queryFn: async () => {
      if (!storedUid) {
        return { restored: false } as RestoreSessionResult;
      }

      return restoreSessionFromApi(storedUid);
    },
  });
}

export function useGoogleSignInMutation() {
  return useMutation({
    mutationFn: async () => {
      const payload = await signInWithGooglePopup();
      const user = await createSession(payload);
      saveUidToLocalStore(user.uid);
      return user;
    },
  });
}
