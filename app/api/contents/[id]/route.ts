import { NextResponse } from "next/server";

import { getAuthSessionFromRequest } from "../../../../lib/auth";
import {
  handleRouteError,
  jsonError,
  logRouteHit,
  logRouteSuccess,
} from "../../../../lib/api";
import { getContentById, updateContent } from "../../../../lib/db";
import { sendRevisionRequestedNotification } from "../../../../lib/telegram";
import { type ContentStatus, type ContentTypeKey } from "../../../../lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  logRouteHit(request);
  try {
    if (!getAuthSessionFromRequest(request)) {
      return jsonError("Unauthorized.", 401);
    }

    const { id } = await params;
    const before = getContentById(id);
    const body = (await request.json()) as Partial<{
      title: string;
      type: ContentTypeKey | "";
      mediums: string[];
      status: ContentStatus;
      link_post: string;
      link_doc: string;
      link_file: string;
      publish_date: string;
    }>;

    const content = updateContent(id, body);

    if (!content) {
      return jsonError("Content not found.", 404);
    }

    if (before?.status !== "revision" && content.status === "revision") {
      await sendRevisionRequestedNotification(content);
    }

    const response = NextResponse.json({ content });
    logRouteSuccess(request, 200);
    return response;
  } catch (error) {
    return handleRouteError(error, "Failed to update content.", request);
  }
}
