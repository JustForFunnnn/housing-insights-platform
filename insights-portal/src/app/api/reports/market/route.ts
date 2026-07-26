import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { allowedMarketQuery } from "@/lib/market-query";
import {
  getMarketAnalysis,
  getMarketMetadata,
} from "@/api/server";
import { renderMarketReport } from "@/server/market-report";
import { routeError } from "@/server/route-response";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const filters = allowedMarketQuery(request.nextUrl.searchParams);
    const [analysis, metadata] = await Promise.all([
      getMarketAnalysis(filters.toString()),
      getMarketMetadata(),
    ]);
    const buffer = await renderMarketReport(
      analysis,
      metadata,
      filters.toString().replaceAll("&", ", "),
    );
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="market-analysis.pdf"',
      },
    });
  } catch (error) {
    return routeError(error);
  }
}
