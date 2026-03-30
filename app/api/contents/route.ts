import { NextResponse } from "next/server";

import {
  handleRouteError,
  jsonError,
  logRouteHit,
  logRouteSuccess,
} from "../../../lib/api";
import { createContent, listAllContents, listContentsForWeek } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  logRouteHit(request);
  try {
    const { searchParams } = new URL(request.url);
    const weekKey = searchParams.get("week_key");

    if (weekKey) {
      const response = NextResponse.json({ contents: listContentsForWeek(weekKey) });
      logRouteSuccess(request, 200);
      return response;
    }

    const response = NextResponse.json({ contents: listAllContents() });
    logRouteSuccess(request, 200);
    return response;
  } catch (error) {
    return handleRouteError(error, "Failed to load contents.", request);
  }
}

export async function POST(request: Request) {
  logRouteHit(request);
  try {
    const body = (await request.json()) as {
      member_id?: string;
      week_key?: string;
      title?: string;
    };

    if (!body.member_id || !body.week_key) {
      return jsonError("member_id and week_key are required.", 400);
    }

    const content = createContent({
      memberId: body.member_id,
      weekKey: body.week_key,
      title: body.title,
    });

    const response = NextResponse.json({ content }, { status: 201 });
    logRouteSuccess(request, 201);
    return response;
  } catch (error) {
    return handleRouteError(error, "Failed to create content.", request);
  }
}
