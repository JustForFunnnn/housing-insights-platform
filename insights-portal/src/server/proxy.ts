import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { allowedMarketQuery } from "@/lib/market-query";
import {
  backendFetch,
  backendJson,
  getEstimatorMetadata,
  getMarketMetadata,
  type Dependency,
} from "@/server/backend";
import { routeError } from "@/server/route-response";

export async function metadataResponse(dependency: Dependency) {
  try {
    const body =
      dependency === "estimator"
        ? await getEstimatorMetadata()
        : await getMarketMetadata();
    return NextResponse.json(body);
  } catch (error) {
    return routeError(error);
  }
}

export async function proxyJson(
  request: NextRequest,
  dependency: Dependency,
  path: string,
  options: {
    body?: boolean;
    query?: "estimator-history" | "market-analysis" | "market-properties";
  } = {},
) {
  try {
    let query = new URLSearchParams();
    if (options.query === "estimator-history") {
      for (const key of ["limit", "offset"]) {
        const value = request.nextUrl.searchParams.get(key);
        if (value) query.set(key, value);
      }
    }
    if (options.query === "market-analysis") {
      query = allowedMarketQuery(request.nextUrl.searchParams);
    }
    if (options.query === "market-properties") {
      query = allowedMarketQuery(request.nextUrl.searchParams, {
        includePage: true,
        includeSort: true,
      });
    }

    const queryString = query.toString();
    const body = await backendJson<unknown>(
      dependency,
      `${path}${queryString ? `?${queryString}` : ""}`,
      options.body
        ? {
            method: request.method,
            headers: { "Content-Type": "application/json" },
            body: await request.text(),
          }
        : { method: request.method },
    );
    return NextResponse.json(body);
  } catch (error) {
    return routeError(error);
  }
}

export async function proxyCsv(request: NextRequest) {
  try {
    const query = allowedMarketQuery(request.nextUrl.searchParams, {
      includeSort: true,
    });
    const response = await backendFetch(
      "market",
      `/api/properties/export/csv?${query}`,
      { headers: { Accept: "text/csv" } },
    );
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "text/csv;charset=UTF-8",
        "Content-Disposition":
          response.headers.get("Content-Disposition") ??
          'attachment; filename="market-properties.csv"',
      },
    });
  } catch (error) {
    return routeError(error);
  }
}
