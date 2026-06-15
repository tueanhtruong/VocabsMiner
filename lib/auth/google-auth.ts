"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

import { getFirebaseClientAuth } from "@/lib/firebase/client";

const googleProvider = new GoogleAuthProvider();
const localUidStorageKey = "vocabsminer.auth.uid";

export type SessionUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
};

export type GoogleSignInPayload = {
  idToken: string;
  uid: string;
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
};

export type RestoreSessionResult =
  | { restored: false }
  | { restored: true; user: SessionUser };

export function getRestoreSessionQueryKey(storedUid: string | null) {
  return ["auth", "session", "restore", storedUid ?? "none"] as const;
}

export function saveUidToLocalStore(uid: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(localUidStorageKey, uid);
}

export function getUidFromLocalStore() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(localUidStorageKey);
}

export function clearUidFromLocalStore() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(localUidStorageKey);
}

export async function signInWithGooglePopup(): Promise<GoogleSignInPayload> {
  const auth = getFirebaseClientAuth();
  const result = await signInWithPopup(auth, googleProvider);

  const profile = {
    uid: result.user.uid,
    displayName: result.user.displayName,
    email: result.user.email,
    photoUrl: result.user.photoURL,
  };

  const idToken = await result.user.getIdToken();

  return {
    idToken,
    ...profile,
  };
}

export async function signOutSession() {
  try {
    const auth = getFirebaseClientAuth();
    await auth.signOut();
  } finally {
    clearUidFromLocalStore();
  }
}
