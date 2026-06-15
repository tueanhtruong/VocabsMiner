import { NextRequest, NextResponse } from "next/server";

const protectedApiPrefixes = [
  "/api/extract",
  "/api/profile",
  "/api/vocabulary",
];

function isProtectedApiPath(pathname: string) {
  return protectedApiPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isProtectedApiPath(pathname)) {
    const hasAuthorizationHeader = Boolean(
      request.headers.get("authorization"),
    );

    if (!hasAuthorizationHeader) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/extract/:path*",
    "/api/profile/:path*",
    "/api/vocabulary/:path*",
  ],
};
