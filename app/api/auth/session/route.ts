import { apiError, apiOk } from "@/lib/api/http";
import {
  getLearnerProfileByUid,
  upsertLearnerProfile,
} from "@/lib/firebase/firestore-service";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    idToken?: string;
    uid?: string;
    displayName?: string;
    email?: string;
    photoUrl?: string;
  } | null;

  try {
    if (!body?.uid?.trim()) {
      return apiError("INVALID_INPUT", "uid is required", 400);
    }

    const displayName = body?.displayName?.trim() || undefined;
    const email = body?.email?.trim() || undefined;
    const photoUrl = body?.photoUrl?.trim() || undefined;

    const payload = {
      uid: body.uid.trim(),
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

export async function GET(request: Request) {
  const uid = new URL(request.url).searchParams.get("uid")?.trim();

  if (!uid) {
    return apiError("INVALID_INPUT", "uid is required", 400);
  }

  const profile = await getLearnerProfileByUid(uid);

  if (!profile) {
    return apiError("NOT_FOUND", "User not found", 404);
  }

  return apiOk({ ok: true, user: profile });
}
