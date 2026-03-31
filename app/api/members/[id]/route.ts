import { NextResponse } from "next/server";

import { getAuthSessionFromRequest } from "../../../../lib/auth";
import {
  handleRouteError,
  jsonError,
  logRouteHit,
  logRouteSuccess,
} from "../../../../lib/api";
import { deleteMember, updateMember } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  logRouteHit(request);
  try {
    const session = getAuthSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return jsonError("Admin access required.", 403);
    }

    const { id } = await params;
    const body = (await request.json()) as Partial<{
      name: string;
      initials: string;
      email: string;
      is_content_writer: number;
      is_operator_eligible: number;
    }>;

    const member = updateMember(id, body);

    if (!member) {
      return jsonError("Member not found.", 404);
    }

    const response = NextResponse.json({ member });
    logRouteSuccess(request, 200);
    return response;
  } catch (error) {
    return handleRouteError(error, "Failed to update member.", request);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  logRouteHit(_request);
  try {
    const session = getAuthSessionFromRequest(_request);
    if (!session || session.role !== "admin") {
      return jsonError("Admin access required.", 403);
    }

    const { id } = await params;
    deleteMember(id);
    const response = NextResponse.json({ success: true });
    logRouteSuccess(_request, 200);
    return response;
  } catch (error) {
    return handleRouteError(error, "Failed to delete member.", _request);
  }
}
