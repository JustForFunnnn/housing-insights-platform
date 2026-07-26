import fs from "node:fs/promises";
import path from "node:path";
import openapiTS, { astToString } from "openapi-typescript";

const outputDirectory = path.resolve("src/lib/api/generated");
const sources = [
  [
    process.env.ESTIMATOR_OPENAPI_URL ??
      "http://host.docker.internal:9001/openapi.json",
    "estimator.ts",
    "estimator",
  ],
  [
    process.env.MARKET_OPENAPI_URL ??
      "http://host.docker.internal:9002/v3/api-docs",
    "market.ts",
    "market",
  ],
];

await fs.mkdir(outputDirectory, { recursive: true });

let estimatorDocument;

for (const [source, filename, dependency] of sources) {
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(
      `${dependency} OpenAPI request failed with ${response.status}`,
    );
  }
  const document = await response.json();
  const ast = await openapiTS(document);
  const banner =
    "/* Generated from the live backend OpenAPI document. Do not edit. */\n";
  await fs.writeFile(
    path.join(outputDirectory, filename),
    banner + astToString(ast),
    "utf8",
  );
  console.log(`generated ${filename} from ${source}`);
  if (dependency === "estimator") estimatorDocument = document;
}

const propertyProperties =
  estimatorDocument?.components?.schemas?.PropertyInput?.properties;
if (!propertyProperties) {
  throw new Error("Estimator OpenAPI is missing PropertyInput properties");
}

const numericKinds = Object.fromEntries(
  Object.entries(propertyProperties).map(([field, schema]) => [
    field,
    schema.type === "integer" ? "integer" : "number",
  ]),
);

await fs.writeFile(
  path.join(outputDirectory, "property-number-kinds.ts"),
  `/* Generated from the live Estimator OpenAPI document. Do not edit. */
export const PROPERTY_NUMBER_KINDS = ${JSON.stringify(numericKinds, null, 2)} as const;
`,
  "utf8",
);
console.log("generated property-number-kinds.ts from Estimator PropertyInput");
