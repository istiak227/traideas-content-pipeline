import { NextResponse } from "next/server";

import { setSessionCookie } from "../../../../../lib/auth";
import {
  handleRouteError,
  jsonError,
  logRouteHit,
  logRouteSuccess,
} from "../../../../../lib/api";
import {
  createAppSession,
  getMemberByUsername,
  getMemberLoginCode,
  markMemberLoginCodeUsed,
} from "../../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  logRouteHit(request);
  try {
    const body = (await request.json()) as { username?: string; code?: string };

    if (!body.username?.trim() || !body.code?.trim()) {
      return jsonError("username and code are required.", 400);
    }

    const member = getMemberByUsername(body.username);
    if (!member) {
      return jsonError("Member not found.", 404);
    }

    const loginCode = getMemberLoginCode(member.id, body.code.trim());
    if (!loginCode) {
      return jsonError("Invalid login code.", 401);
    }

    if (loginCode.used_at) {
      return jsonError("This login code was already used.", 401);
    }

    const expiresAt = new Date(loginCode.expires_at);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
      return jsonError("This login code has expired.", 401);
    }

    markMemberLoginCodeUsed(loginCode.id);
    const session = createAppSession({ role: "member", memberId: member.id, ttlDays: 14 });

    const response = NextResponse.json({
      success: true,
      session: {
        role: "member",
        member,
      },
    });
    setSessionCookie(response, session.session_token, session.expires_at);
    logRouteSuccess(request, 200);
    return response;
  } catch (error) {
    return handleRouteError(error, "Failed to verify login code.", request);
  }
}
