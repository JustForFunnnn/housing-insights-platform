import { NextResponse } from "next/server";

import { BackendError } from "@/api/server";

export function routeError(error: unknown) {
  if (error instanceof BackendError) {
    return NextResponse.json(error.body, { status: error.status });
  }
  console.error(
    JSON.stringify({
      event: "portal_route_failed",
      status: 500,
      error_code: "internal_error",
    }),
  );
  return NextResponse.json(
    {
      error_code: "internal_error",
      message: "The request could not be completed.",
    },
    { status: 500 },
  );
}
