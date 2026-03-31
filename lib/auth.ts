import { NextResponse } from "next/server";

import { getAuthSessionByToken } from "./db";

const SESSION_COOKIE_NAME = "tcp_session";

function parseCookie(cookieHeader: string | null, key: string) {
  if (!cookieHeader) {
    return "";
  }

  const parts = cookieHeader.split(";").map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${key}=`));
  return match ? decodeURIComponent(match.slice(key.length + 1)) : "";
}

export function getSessionTokenFromRequest(request: Request) {
  return parseCookie(request.headers.get("cookie"), SESSION_COOKIE_NAME);
}

export function getAuthSessionFromRequest(request: Request) {
  const sessionToken = getSessionTokenFromRequest(request);
  if (!sessionToken) {
    return null;
  }

  return getAuthSessionByToken(sessionToken);
}

export function setSessionCookie(
  response: NextResponse,
  sessionToken: string,
  expiresAt: string,
) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export function isAdminSession(request: Request) {
  return getAuthSessionFromRequest(request)?.role === "admin";
}
