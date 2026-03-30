import { NextResponse } from "next/server";

import {
  handleRouteError,
  jsonError,
  logRouteHit,
  logRouteSuccess,
} from "../../../lib/api";
import { createMember, listMembers } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  logRouteHit(request);
  try {
    const response = NextResponse.json({ members: listMembers() });
    logRouteSuccess(request, 200);
    return response;
  } catch (error) {
    return handleRouteError(error, "Failed to load members.", request);
  }
}

export async function POST(request: Request) {
  logRouteHit(request);
  try {
    const body = (await request.json()) as {
      name?: string;
      initials?: string;
    };

    if (!body.name?.trim()) {
      return jsonError("Name is required.", 400);
    }

    const member = createMember(body.name, body.initials);
    const response = NextResponse.json({ member }, { status: 201 });
    logRouteSuccess(request, 201);
    return response;
  } catch (error) {
    return handleRouteError(error, "Failed to create member.", request);
  }
}
