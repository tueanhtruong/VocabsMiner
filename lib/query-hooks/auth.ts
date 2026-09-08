"use client";

import { onIdTokenChanged, type User } from "firebase/auth";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  GoogleSignInPayload,
  saveIdTokenToLocalStore,
  saveUidToLocalStore,
  signInWithGooglePopup,
} from "@/lib/auth/google-auth";
import { getFirebaseClientAuth } from "@/lib/firebase/client";
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

function getCurrentFirebaseUser(): Promise<User | null> {
  const auth = getFirebaseClientAuth();

  return new Promise((resolve) => {
    let unsubscribe: () => void = () => undefined;
    unsubscribe = onIdTokenChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

async function restoreSessionFromApi(): Promise<RestoreSessionResult> {
  try {
    const firebaseUser = await getCurrentFirebaseUser();

    if (!firebaseUser) {
      return { restored: false };
    }

    const response = await requestJson<SessionResponse>("/api/auth/session", {
      method: "GET",
    });

    if (!response?.user?.uid) {
      return { restored: false };
    }

    return { restored: true, user: response.user };
  } catch {
    return { restored: false };
  }
}

export function useRestoreSessionQuery() {
  return useQuery({
    queryKey: ["auth", "session", "restore"],
    queryFn: restoreSessionFromApi,
    retry: false,
  });
}

export function useGoogleSignInMutation() {
  return useMutation({
    mutationFn: async () => {
      const payload = await signInWithGooglePopup();
      const user = await createSession(payload);
      saveUidToLocalStore(user.uid);
      saveIdTokenToLocalStore(payload.idToken);
      return user;
    },
  });
}
