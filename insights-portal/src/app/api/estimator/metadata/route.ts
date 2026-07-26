import { metadataResponse } from "@/server/proxy";

export function GET() {
  return metadataResponse("estimator");
}
