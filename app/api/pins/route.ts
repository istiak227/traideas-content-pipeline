import { NextResponse } from "next/server";

import {
  handleRouteError,
  jsonError,
  logRouteHit,
  logRouteSuccess,
} from "../../../lib/api";
import { getPin, setPin } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  logRouteHit(request);
  try {
    const { searchParams } = new URL(request.url);
    const browserKey = searchParams.get("browser_key");

    if (!browserKey) {
      return jsonError("browser_key is required.", 400);
    }

    const response = NextResponse.json({ pin: getPin(browserKey) });
    logRouteSuccess(request, 200);
    return response;
  } catch (error) {
    return handleRouteError(error, "Failed to load browser pin.", request);
  }
}

export async function POST(request: Request) {
  logRouteHit(request);
  try {
    const body = (await request.json()) as {
      browser_key?: string;
      member_id?: string;
    };

    if (!body.browser_key || !body.member_id) {
      return jsonError("browser_key and member_id are required.", 400);
    }

    const response = NextResponse.json({
      pin: setPin(body.browser_key, body.member_id),
    });
    logRouteSuccess(request, 200);
    return response;
  } catch (error) {
    return handleRouteError(error, "Failed to save browser pin.", request);
  }
}
