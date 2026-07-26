import type { NextRequest } from "next/server";

import { proxyJson } from "@/server/proxy";

export function GET(request: NextRequest) {
  return proxyJson(request, "estimator", "/api/health");
}
