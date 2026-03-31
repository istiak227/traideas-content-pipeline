import { NextResponse } from "next/server";

import {
  logRouteHit,
  logRouteSuccess,
} from "../../../lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  logRouteHit(request);
  const response = NextResponse.json(
    {
      pin: null,
      deprecated: true,
      message: "Browser pinning has been replaced by session-based login.",
    },
    { status: 410 },
  );
  logRouteSuccess(request, 410);
  return response;
}

export async function POST(request: Request) {
  logRouteHit(request);
  const response = NextResponse.json(
    {
      pin: null,
      deprecated: true,
      message: "Browser pinning has been replaced by session-based login.",
    },
    { status: 410 },
  );
  logRouteSuccess(request, 410);
  return response;
}
