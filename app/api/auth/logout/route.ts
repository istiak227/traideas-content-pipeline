import { NextResponse } from "next/server";

import {
  clearSessionCookie,
  getSessionTokenFromRequest,
} from "../../../../lib/auth";
import {
  handleRouteError,
  logRouteHit,
  logRouteSuccess,
} from "../../../../lib/api";
import { deleteAppSession } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  logRouteHit(request);
  try {
    const token = getSessionTokenFromRequest(request);
    if (token) {
      deleteAppSession(token);
    }

    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);
    logRouteSuccess(request, 200);
    return response;
  } catch (error) {
    return handleRouteError(error, "Failed to log out.", request);
  }
}
