import { onDocumentWritten } from "firebase-functions/v2/firestore";

import { processPendingPassage } from "./extraction-worker";

export const extractPendingPassage = onDocumentWritten(
  {
    document: "users/{uid}/passages/{recordId}",
    region: process.env.FUNCTIONS_REGION ?? "us-central1",
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async (event) => {
    await processPendingPassage({
      uid: event.params.uid,
      recordId: event.params.recordId,
      before: event.data?.before.data(),
      after: event.data?.after.data(),
    });
  },
);
