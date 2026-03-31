import { NextResponse } from "next/server";

import { clearSessionCookie, getAuthSessionFromRequest } from "../../../../lib/auth";
import {
  handleRouteError,
  logRouteHit,
  logRouteSuccess,
} from "../../../../lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  logRouteHit(request);
  try {
    const session = getAuthSessionFromRequest(request);
    const response = NextResponse.json({ session });

    if (!session) {
      clearSessionCookie(response);
    }

    logRouteSuccess(request, 200);
    return response;
  } catch (error) {
    return handleRouteError(error, "Failed to load auth session.", request);
  }
}
