import "server-only";

export function dispatchPassageExtraction(params: {
  requestUrl: string;
  recordId: string;
  idToken: string;
}) {
  const processUrl = new URL("/api/extract/process", params.requestUrl);

  void fetch(processUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.idToken}`,
    },
    body: JSON.stringify({ recordId: params.recordId }),
    cache: "no-store",
  }).catch((error) => {
    console.error("Failed to dispatch vocabulary extraction:", error);
  });
}
