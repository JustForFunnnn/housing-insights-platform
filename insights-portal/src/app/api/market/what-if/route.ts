import type { NextRequest } from "next/server";

import { proxyJson } from "@/server/proxy";

export function POST(request: NextRequest) {
  return proxyJson(request, "market", "/api/what-if", {
    body: true,
  });
}
