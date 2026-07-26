import type { NextRequest } from "next/server";

import { proxyCsv } from "@/server/proxy";

export function GET(request: NextRequest) {
  return proxyCsv(request);
}
