import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { Command } from "commander";

interface ValidationError {
  path: string;
  severity: "error" | "warning";
  message: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  operationCount: number;
  modelCount: number;
  checkedAt: string;
}

type OpenApiDoc = Record<string, unknown>;
type SchemaObject = Record<string, unknown>;

const REQUIRED_LOMASH_ROUTES: Array<{ method: string; path: string }> = [
  { method: "POST", path: "/v1/auth/register" },
  { method: "POST", path: "/v1/auth/login" },
  { method: "POST", path: "/v1/auth/logout" },
  { method: "GET", path: "/v1/auth/me" },
  { method: "GET", path: "/v1/products" },
  { method: "GET", path: "/v1/products/{id}" },
  { method: "POST", path: "/v1/products" },
  { method: "PATCH", path: "/v1/products/{id}" },
  { method: "DELETE", path: "/v1/products/{id}" },
  { method: "GET", path: "/v1/categories" },
  { method: "GET", path: "/v1/appointments/availability" },
  { method: "POST", path: "/v1/appointments" },
  { method: "GET", path: "/v1/appointments/{id}" },
  { method: "GET", path: "/v1/showrooms" },
  { method: "GET", path: "/v1/showrooms/{id}" },
  { method: "GET", path: "/v1/blog" },
  { method: "GET", path: "/v1/blog/{slug}" },
  { method: "POST", path: "/v1/brochures" },
  { method: "POST", path: "/v1/business" },
  { method: "POST", path: "/v1/contact" },
  { method: "POST", path: "/v1/newsletter" },
  { method: "POST", path: "/v1/payments/create-intent" },
  { method: "POST", path: "/v1/webhooks/stripe" },
  { method: "POST", path: "/v1/uploads" },
];

const REQUIRED_RESPONSE_CODES = ["200", "201", "400", "401", "422", "500"];

function loadSpec(filePath: string): OpenApiDoc {
  const ext = path.extname(filePath).toLowerCase();
  const raw = fs.readFileSync(filePath, "utf-8");

  if (ext === ".yaml" || ext === ".yml") {
    return yaml.load(raw) as OpenApiDoc;
  }

  return JSON.parse(raw) as OpenApiDoc;
}

function addError(
  results: ValidationError[],
  filePath: string,
  severity: "error" | "warning",
  message: string
): void {
  results.push({ path: filePath, severity, message });
}

function validateOpenApiVersion(doc: OpenApiDoc, errors: ValidationError[]): void {
  const version = doc["openapi"] as string | undefined;

  if (!version) {
    addError(errors, "root.openapi", "error", "Missing required field: openapi (must be 3.x.x)");
    return;
  }

  if (!version.startsWith("3.")) {
    addError(errors, "root.openapi", "error", `OpenAPI version must be 3.x.x, got: ${version}`);
  }
}

function validateInfo(doc: OpenApiDoc, errors: ValidationError[]): void {
  const info = doc["info"] as SchemaObject | undefined;

  if (!info) {
    addError(errors, "root.info", "error", "Missing required field: info");
    return;
  }

  if (!info["title"]) {
    addError(errors, "info.title", "error", "Missing required field: info.title");
  }

  if (!info["version"]) {
    addError(errors, "info.version", "error", "Missing required field: info.version");
  }

  if (!info["description"]) {
    addError(errors, "info.description", "warning", "Missing info.description — add a meaningful API description");
  }
}

function validateServers(doc: OpenApiDoc, errors: ValidationError[]): void {
  const servers = doc["servers"] as Array<{ url: string }> | undefined;

  if (!servers || servers.length === 0) {
    addError(errors, "root.servers", "warning", "No servers defined — clients cannot determine the base URL");
    return;
  }

  servers.forEach((server, i) => {
    if (!server.url) {
      addError(errors, `servers[${i}].url`, "error", `Server at index ${i} is missing url`);
    }
  });
}

function validatePaths(doc: OpenApiDoc, errors: ValidationError[]): number {
  const paths = doc["paths"] as Record<string, SchemaObject> | undefined;

  if (!paths || Object.keys(paths).length === 0) {
    addError(errors, "root.paths", "error", "No paths defined — the API spec has no endpoints");
    return 0;
  }

  const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "options", "head"];
  let operationCount = 0;

  for (const [pathStr, pathItem] of Object.entries(paths)) {
    if (!pathStr.startsWith("/")) {
      addError(errors, `paths.${pathStr}`, "error", `Path must start with /: ${pathStr}`);
    }

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method] as SchemaObject | undefined;
      if (!operation) continue;

      operationCount++;
      const opPath = `paths.${pathStr}.${method}`;

      if (!operation["operationId"]) {
        addError(errors, `${opPath}.operationId`, "warning", `Missing operationId on ${method.toUpperCase()} ${pathStr}`);
      }

      if (!operation["summary"]) {
        addError(errors, `${opPath}.summary`, "warning", `Missing summary on ${method.toUpperCase()} ${pathStr}`);
      }

      if (!operation["tags"] || (operation["tags"] as string[]).length === 0) {
        addError(errors, `${opPath}.tags`, "warning", `No tags on ${method.toUpperCase()} ${pathStr} — add tags for grouping`);
      }

      const responses = operation["responses"] as Record<string, unknown> | undefined;

      if (!responses || Object.keys(responses).length === 0) {
        addError(errors, `${opPath}.responses`, "error", `No responses defined on ${method.toUpperCase()} ${pathStr}`);
      } else {
        if (!responses["200"] && !responses["201"] && !responses["204"]) {
          addError(errors, `${opPath}.responses`, "warning", `No 2xx success response on ${method.toUpperCase()} ${pathStr}`);
        }

        if (!responses["400"] && !responses["422"]) {
          addError(errors, `${opPath}.responses`, "warning", `No 4xx error response on ${method.toUpperCase()} ${pathStr} — add validation error responses`);
        }
      }

      if (["post", "put", "patch"].includes(method)) {
        if (!operation["requestBody"]) {
          addError(errors, `${opPath}.requestBody`, "warning", `${method.toUpperCase()} ${pathStr} has no requestBody defined`);
        }
      }

      const params = operation["parameters"] as Array<SchemaObject> | undefined;
      if (params) {
        params.forEach((param, i) => {
          if (!param["name"]) {
            addError(errors, `${opPath}.parameters[${i}]`, "error", `Parameter at index ${i} is missing name`);
          }
          if (!param["in"]) {
            addError(errors, `${opPath}.parameters[${i}]`, "error", `Parameter at index ${i} is missing 'in' field`);
          }
          if (!param["schema"]) {
            addError(errors, `${opPath}.parameters[${i}]`, "warning", `Parameter ${param["name"] || i} on ${method.toUpperCase()} ${pathStr} has no schema`);
          }
        });
      }

      const pathParams = (pathStr.match(/\{([^}]+)\}/g) || []).map((p) => p.slice(1, -1));
      const definedParams = [
        ...(pathItem["parameters"] as Array<SchemaObject> || []),
        ...(params || []),
      ]
        .filter((p) => p["in"] === "path")
        .map((p) => p["name"] as string);

      for (const pp of pathParams) {
        if (!definedParams.includes(pp)) {
          addError(errors, `${opPath}`, "error", `Path template uses {${pp}} but no path parameter named "${pp}" is defined`);
        }
      }
    }
  }

  return operationCount;
}

function validateRequiredRoutes(doc: OpenApiDoc, errors: ValidationError[]): void {
  const paths = doc["paths"] as Record<string, SchemaObject> | undefined;
  if (!paths) return;

  for (const route of REQUIRED_LOMASH_ROUTES) {
    const pathItem = paths[route.path];
    if (!pathItem) {
      addError(
        errors,
        `paths.${route.path}`,
        "warning",
        `Required Lomash Wood route not found: ${route.method} ${route.path}`
      );
      continue;
    }

    const method = route.method.toLowerCase();
    const operation = pathItem[method] as SchemaObject | undefined;

    if (!operation) {
      addError(
        errors,
        `paths.${route.path}.${method}`,
        "warning",
        `Required Lomash Wood operation not found: ${route.method} ${route.path}`
      );
    }
  }
}

function validateComponents(doc: OpenApiDoc, errors: ValidationError[]): number {
  const components = doc["components"] as SchemaObject | undefined;

  if (!components) {
    addError(errors, "root.components", "warning", "No components defined — consider extracting reusable schemas");
    return 0;
  }

  const schemas = components["schemas"] as Record<string, SchemaObject> | undefined;
  if (!schemas || Object.keys(schemas).length === 0) {
    addError(errors, "components.schemas", "warning", "No schemas defined in components.schemas");
    return 0;
  }

  for (const [name, schema] of Object.entries(schemas)) {
    validateSchema(schema, `components.schemas.${name}`, errors, 0);
  }

  const securitySchemes = components["securitySchemes"] as Record<string, SchemaObject> | undefined;
  if (!securitySchemes || Object.keys(securitySchemes).length === 0) {
    addError(errors, "components.securitySchemes", "warning", "No securitySchemes defined — define Bearer JWT auth");
  }

  return Object.keys(schemas).length;
}

function validateSchema(
  schema: SchemaObject,
  schemaPath: string,
  errors: ValidationError[],
  depth: number
): void {
  if (depth > 6) return;

  if (schema["$ref"]) return;

  if (!schema["type"] && !schema["allOf"] && !schema["oneOf"] && !schema["anyOf"] && !schema["$ref"]) {
    addError(errors, schemaPath, "warning", `Schema at ${schemaPath} has no type defined`);
  }

  if (schema["type"] === "object" && schema["properties"]) {
    const props = schema["properties"] as Record<string, SchemaObject>;
    for (const [propName, propSchema] of Object.entries(props)) {
      validateSchema(propSchema, `${schemaPath}.properties.${propName}`, errors, depth + 1);
    }
  }

  if (schema["type"] === "array" && !schema["items"]) {
    addError(errors, schemaPath, "error", `Array schema at ${schemaPath} is missing items definition`);
  }
}

function validateSecurity(doc: OpenApiDoc, errors: ValidationError[]): void {
  const paths = doc["paths"] as Record<string, SchemaObject> | undefined;
  if (!paths) return;

  const PROTECTED_PREFIXES = ["/v1/orders", "/v1/appointments", "/v1/customers", "/v1/analytics"];

  for (const [pathStr, pathItem] of Object.entries(paths)) {
    const isProtected = PROTECTED_PREFIXES.some((prefix) => pathStr.startsWith(prefix));
    if (!isProtected) continue;

    const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method] as SchemaObject | undefined;
      if (!operation) continue;

      const hasSecurity =
        Array.isArray(operation["security"]) && operation["security"].length > 0;
      const hasGlobalSecurity =
        Array.isArray(doc["security"]) && (doc["security"] as unknown[]).length > 0;

      if (!hasSecurity && !hasGlobalSecurity) {
        addError(
          errors,
          `paths.${pathStr}.${method}.security`,
          "warning",
          `Protected route ${method.toUpperCase()} ${pathStr} has no security requirement defined`
        );
      }
    }
  }
}

function validateRefs(doc: OpenApiDoc, errors: ValidationError[]): void {
  const docStr = JSON.stringify(doc);
  const refs = docStr.match(/"#\/[^"]+"/g) || [];

  const uniqueRefs = [...new Set(refs)].map((r) => r.replace(/^"|"$/g, ""));

  for (const ref of uniqueRefs) {
    const parts = ref.replace("#/", "").split("/");
    let current: unknown = doc;
    let valid = true;

    for (const part of parts) {
      if (current && typeof current === "object") {
        current = (current as Record<string, unknown>)[part];
        if (current === undefined) {
          valid = false;
          break;
        }
      } else {
        valid = false;
        break;
      }
    }

    if (!valid) {
      addError(errors, ref, "error", `Broken $ref: ${ref} — target does not exist in the document`);
    }
  }
}

function validateContentTypes(doc: OpenApiDoc, errors: ValidationError[]): void {
  const paths = doc["paths"] as Record<string, SchemaObject> | undefined;
  if (!paths) return;

  const ALLOWED_CONTENT_TYPES = [
    "application/json",
    "multipart/form-data",
    "application/octet-stream",
  ];

  const HTTP_METHODS = ["post", "put", "patch"];

  for (const [pathStr, pathItem] of Object.entries(paths)) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method] as SchemaObject | undefined;
      if (!operation) continue;

      const requestBody = operation["requestBody"] as SchemaObject | undefined;
      if (!requestBody) continue;

      const content = requestBody["content"] as Record<string, unknown> | undefined;
      if (!content) continue;

      for (const ct of Object.keys(content)) {
        if (!ALLOWED_CONTENT_TYPES.includes(ct)) {
          addError(
            errors,
            `paths.${pathStr}.${method}.requestBody.content`,
            "warning",
            `Unexpected content type "${ct}" on ${method.toUpperCase()} ${pathStr}`
          );
        }
      }
    }
  }
}

export async function validateSpec(filePath: string): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  if (!fs.existsSync(filePath)) {
    return {
      valid: false,
      errors: [{ path: filePath, severity: "error", message: `File not found: ${filePath}` }],
      warnings: [],
      operationCount: 0,
      modelCount: 0,
      checkedAt: new Date().toISOString(),
    };
  }

  let doc: OpenApiDoc;

  try {
    doc = loadSpec(filePath);
  } catch (err) {
    return {
      valid: false,
      errors: [{ path: filePath, severity: "error", message: `Failed to parse spec: ${String(err)}` }],
      warnings: [],
      operationCount: 0,
      modelCount: 0,
      checkedAt: new Date().toISOString(),
    };
  }

  validateOpenApiVersion(doc, errors);
  validateInfo(doc, errors);
  validateServers(doc, errors);
  validateRefs(doc, errors);
  validateSecurity(doc, errors);
  validateContentTypes(doc, errors);

  const operationCount = validatePaths(doc, errors);
  const modelCount = validateComponents(doc, errors);

  validateRequiredRoutes(doc, errors);

  const hardErrors = errors.filter((e) => e.severity === "error");
  const warnings = errors.filter((e) => e.severity === "warning");

  return {
    valid: hardErrors.length === 0,
    errors: hardErrors,
    warnings,
    operationCount,
    modelCount,
    checkedAt: new Date().toISOString(),
  };
}

function printResult(result: ValidationResult, filePath: string): void {
  console.log(`\nValidating: ${filePath}`);
  console.log("=".repeat(60));
  console.log(`Operations: ${result.operationCount}`);
  console.log(`Models:     ${result.modelCount}`);
  console.log(`Errors:     ${result.errors.length}`);
  console.log(`Warnings:   ${result.warnings.length}`);
  console.log(`Status:     ${result.valid ? "VALID" : "INVALID"}`);

  if (result.errors.length > 0) {
    console.log("\nErrors:");
    result.errors.forEach((e) => {
      console.log(`  [ERROR] ${e.path}`);
      console.log(`          ${e.message}`);
    });
  }

  if (result.warnings.length > 0) {
    console.log("\nWarnings:");
    result.warnings.forEach((w) => {
      console.log(`  [WARN]  ${w.path}`);
      console.log(`          ${w.message}`);
    });
  }

  console.log("");
}

if (require.main === module) {
  const program = new Command();

  program
    .name("validate")
    .description("Validates a Lomash Wood OpenAPI specification file")
    .argument("<file>", "Path to the OpenAPI spec file (.yaml or .json)")
    .option("--json", "Output validation result as JSON")
    .option("--strict", "Exit with code 1 if any warnings are found")
    .action(async (file: string, opts: { json: boolean; strict: boolean }) => {
      const result = await validateSpec(file);

      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        printResult(result, file);
      }

      const hasFatalIssues = !result.valid || (opts.strict && result.warnings.length > 0);
      process.exit(hasFatalIssues ? 1 : 0);
    });

  program.parse(process.argv);
}