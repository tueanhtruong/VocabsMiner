import { apiError, apiOk } from "@/lib/api/http";
import { getAuthenticatedUserFromAuthorizationHeader } from "@/lib/auth/session";
import {
  getLearnerProfileByUid,
  upsertLearnerProfile,
} from "@/lib/firebase/firestore-service";

export async function POST(request: Request) {
  const authenticatedUser = await getAuthenticatedUserFromAuthorizationHeader();

  if (!authenticatedUser) {
    return apiError("UNAUTHORIZED", "Invalid authentication token", 401);
  }

  const body = (await request.json().catch(() => null)) as {
    uid?: string;
    displayName?: string;
    email?: string;
    photoUrl?: string;
  } | null;

  try {
    if (body?.uid?.trim() && body.uid.trim() !== authenticatedUser.uid) {
      return apiError("FORBIDDEN", "Authenticated user mismatch", 403);
    }

    const displayName = body?.displayName?.trim() || undefined;
    const email = body?.email?.trim() || undefined;
    const photoUrl = body?.photoUrl?.trim() || undefined;

    const payload = {
      uid: authenticatedUser.uid,
      displayName,
      email,
      photoUrl,
    };

    await upsertLearnerProfile(payload);

    return apiOk({
      ok: true,
      user: payload,
    });
  } catch (error) {
    console.error("Error in session POST handler:", error);
    return apiError("UNAUTHORIZED", "Invalid authentication token", 401);
  }
}

export async function GET() {
  const authenticatedUser = await getAuthenticatedUserFromAuthorizationHeader();

  if (!authenticatedUser) {
    return apiError("UNAUTHORIZED", "Invalid authentication token", 401);
  }

  const profile = await getLearnerProfileByUid(authenticatedUser.uid);

  if (!profile) {
    return apiError("NOT_FOUND", "User not found", 404);
  }

  return apiOk({ ok: true, user: profile });
}
