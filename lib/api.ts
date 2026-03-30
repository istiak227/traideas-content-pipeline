import { NextResponse } from "next/server";

function timestamp() {
  return new Date().toISOString();
}

function formatPath(request: Request) {
  try {
    const url = new URL(request.url);
    return `${url.pathname}${url.search}`;
  } catch {
    return request.url;
  }
}

export function logRouteHit(request: Request) {
  console.log(`[${timestamp()}] API HIT ${request.method} ${formatPath(request)}`);
}

export function logRouteSuccess(request: Request, status = 200) {
  console.log(`[${timestamp()}] API OK ${status} ${request.method} ${formatPath(request)}`);
}

export function jsonError(message: string, status = 500, details?: unknown) {
  return NextResponse.json(
    {
      error: message,
      ...(process.env.NODE_ENV !== "production" && details
        ? { details: String(details) }
        : {}),
    },
    { status },
  );
}

export function handleRouteError(error: unknown, fallbackMessage: string, request?: Request) {
  if (request) {
    console.error(
      `[${timestamp()}] API ERROR ${request.method} ${formatPath(request)} :: ${fallbackMessage}`,
      error,
    );
  } else {
    console.error(`[${timestamp()}] API ERROR :: ${fallbackMessage}`, error);
  }
  return jsonError(fallbackMessage, 500, error);
}
