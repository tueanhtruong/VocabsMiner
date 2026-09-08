import "server-only";

import { DecodedIdToken } from "firebase-admin/auth";
import { headers } from "next/headers";

import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

export async function verifyFirebaseIdToken(idToken: string) {
  return getFirebaseAdminAuth().verifyIdToken(idToken);
}

export async function getAuthenticatedUserFromAuthorizationHeader() {
  const requestHeaders = await headers();
  const authorization = requestHeaders.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const idToken = authorization.slice("Bearer ".length).trim();

  if (!idToken) {
    return null;
  }

  try {
    const decodedToken = await verifyFirebaseIdToken(idToken);

    return {
      uid: decodedToken.uid,
      idToken,
      decodedToken,
    };
  } catch {
    return null;
  }
}

export function requireAuthenticatedUser(decodedToken: DecodedIdToken | null) {
  if (!decodedToken) {
    throw new Error("UNAUTHORIZED");
  }

  return decodedToken;
}
