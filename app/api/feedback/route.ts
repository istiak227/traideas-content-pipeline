import { NextResponse } from "next/server";

import {
  handleRouteError,
  jsonError,
  logRouteHit,
  logRouteSuccess,
} from "../../../lib/api";
import { addFeedback, getContentById } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  logRouteHit(request);
  try {
    const body = (await request.json()) as {
      content_id?: string;
      reviewer_name?: string;
      note?: string;
    };

    if (!body.content_id || !body.reviewer_name?.trim() || !body.note?.trim()) {
      return jsonError("content_id, reviewer_name and note are required.", 400);
    }

    const feedback = addFeedback({
      contentId: body.content_id,
      reviewerName: body.reviewer_name,
      note: body.note,
    });

    const response = NextResponse.json(
      { feedback, content: getContentById(body.content_id) },
      { status: 201 },
    );
    logRouteSuccess(request, 201);
    return response;
  } catch (error) {
    return handleRouteError(error, "Failed to add feedback.", request);
  }
}
