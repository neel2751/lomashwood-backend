import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

export interface ParsedParameter {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required: boolean;
  schema: ParsedSchema;
  description: string;
}

export interface ParsedSchema {
  type: string;
  format?: string;
  nullable?: boolean;
  items?: ParsedSchema;
  properties?: Record<string, ParsedSchema>;
  required?: string[];
  enum?: (string | number)[];
  ref?: string;
  description?: string;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
}

export interface ParsedRequestBody {
  required: boolean;
  contentType: string;
  schema: ParsedSchema;
}

export interface ParsedResponse {
  statusCode: string;
  description: string;
  contentType: string | null;
  schema: ParsedSchema | null;
}

export interface ParsedOperation {
  operationId: string;
  method: "get" | "post" | "put" | "patch" | "delete";
  path: string;
  summary: string;
  description: string;
  tags: string[];
  parameters: ParsedParameter[];
  requestBody: ParsedRequestBody | null;
  responses: ParsedResponse[];
  requiresAuth: boolean;
  deprecated: boolean;
}

export interface ParsedModel {
  name: string;
  description: string;
  schema: ParsedSchema;
  properties: Record<string, ParsedSchema>;
  required: string[];
}

export interface ParsedSpec {
  title: string;
  version: string;
  description: string;
  baseUrl: string;
  operations: ParsedOperation[];
  models: ParsedModel[];
  tags: string[];
  securitySchemes: Record<string, unknown>;
}

type OpenApiDoc = Record<string, unknown>;
type SchemaObject = Record<string, unknown>;
type OperationObject = Record<string, unknown>;

function resolveRef(doc: OpenApiDoc, ref: string): SchemaObject {
  const parts = ref.replace("#/", "").split("/");
  let current: unknown = doc;

  for (const part of parts) {
    if (current && typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else {
      return {};
    }
  }

  return (current as SchemaObject) || {};
}

function parseSchema(
  schema: SchemaObject,
  doc: OpenApiDoc,
  depth: number = 0
): ParsedSchema {
  if (!schema) return { type: "unknown" };
  if (depth > 8) return { type: "any" };

  if (schema["$ref"]) {
    const ref = schema["$ref"] as string;
    const refName = ref.split("/").pop() || "Unknown";
    const resolved = resolveRef(doc, ref);
    return {
      ...parseSchema(resolved, doc, depth + 1),
      ref: refName,
    };
  }

  const type = (schema["type"] as string) || "object";
  const result: ParsedSchema = {
    type,
    format: schema["format"] as string | undefined,
    nullable: schema["nullable"] as boolean | undefined,
    description: schema["description"] as string | undefined,
    default: schema["default"],
    minimum: schema["minimum"] as number | undefined,
    maximum: schema["maximum"] as number | undefined,
    minLength: schema["minLength"] as number | undefined,
    maxLength: schema["maxLength"] as number | undefined,
  };

  if (schema["enum"]) {
    result.enum = schema["enum"] as (string | number)[];
  }

  if (type === "array" && schema["items"]) {
    result.items = parseSchema(schema["items"] as SchemaObject, doc, depth + 1);
  }

  if (type === "object" && schema["properties"]) {
    const props = schema["properties"] as Record<string, SchemaObject>;
    result.properties = {};
    for (const [key, val] of Object.entries(props)) {
      result.properties[key] = parseSchema(val, doc, depth + 1);
    }
    result.required = (schema["required"] as string[]) || [];
  }

  if (schema["allOf"]) {
    const merged: ParsedSchema = { type: "object", properties: {}, required: [] };
    for (const sub of schema["allOf"] as SchemaObject[]) {
      const parsed = parseSchema(sub, doc, depth + 1);
      merged.properties = { ...merged.properties, ...(parsed.properties || {}) };
      merged.required = [...(merged.required || []), ...(parsed.required || [])];
    }
    return merged;
  }

  if (schema["oneOf"] || schema["anyOf"]) {
    const variants = (schema["oneOf"] || schema["anyOf"]) as SchemaObject[];
    return {
      type: "union",
      properties: Object.fromEntries(
        variants.map((v, i) => [`variant${i}`, parseSchema(v, doc, depth + 1)])
      ),
    };
  }

  return result;
}

function parseParameters(
  parameters: SchemaObject[],
  doc: OpenApiDoc
): ParsedParameter[] {
  return (parameters || []).map((p) => {
    const resolved = p["$ref"] ? resolveRef(doc, p["$ref"] as string) : p;
    return {
      name: resolved["name"] as string,
      in: resolved["in"] as ParsedParameter["in"],
      required: Boolean(resolved["required"]),
      description: (resolved["description"] as string) || "",
      schema: parseSchema((resolved["schema"] as SchemaObject) || {}, doc),
    };
  });
}

function parseRequestBody(
  requestBody: SchemaObject | undefined,
  doc: OpenApiDoc
): ParsedRequestBody | null {
  if (!requestBody) return null;

  const resolved = requestBody["$ref"]
    ? resolveRef(doc, requestBody["$ref"] as string)
    : requestBody;

  const content = resolved["content"] as Record<string, SchemaObject> | undefined;
  if (!content) return null;

  const contentType = Object.keys(content)[0] || "application/json";
  const mediaType = content[contentType] as SchemaObject;

  return {
    required: Boolean(resolved["required"]),
    contentType,
    schema: parseSchema((mediaType?.["schema"] as SchemaObject) || {}, doc),
  };
}

function parseResponses(
  responses: Record<string, SchemaObject>,
  doc: OpenApiDoc
): ParsedResponse[] {
  return Object.entries(responses || {}).map(([statusCode, response]) => {
    const resolved = response["$ref"]
      ? resolveRef(doc, response["$ref"] as string)
      : response;

    const content = resolved["content"] as Record<string, SchemaObject> | undefined;
    let contentType: string | null = null;
    let schema: ParsedSchema | null = null;

    if (content) {
      contentType = Object.keys(content)[0] || null;
      if (contentType) {
        const mediaType = content[contentType] as SchemaObject;
        if (mediaType?.["schema"]) {
          schema = parseSchema(mediaType["schema"] as SchemaObject, doc);
        }
      }
    }

    return {
      statusCode,
      description: (resolved["description"] as string) || "",
      contentType,
      schema,
    };
  });
}

function hasSecurityRequirement(operation: OperationObject, doc: OpenApiDoc): boolean {
  if (Array.isArray(operation["security"])) {
    return operation["security"].length > 0;
  }

  const globalSecurity = doc["security"];
  if (Array.isArray(globalSecurity)) {
    return globalSecurity.length > 0;
  }

  return false;
}

function buildOperationId(method: string, pathStr: string): string {
  const sanitized = pathStr
    .replace(/^\/v\d+\//, "")
    .replace(/\{([^}]+)\}/g, "By$1")
    .split("/")
    .filter(Boolean)
    .map((segment, i) =>
      i === 0
        ? segment
        : segment.charAt(0).toUpperCase() + segment.slice(1)
    )
    .join("");

  const methodPrefix = method.toLowerCase();
  return `${methodPrefix}${sanitized.charAt(0).toUpperCase()}${sanitized.slice(1)}`;
}

export function parseOpenApiSpec(filePath: string): ParsedSpec {
  const ext = path.extname(filePath).toLowerCase();
  const raw = fs.readFileSync(filePath, "utf-8");

  let doc: OpenApiDoc;

  if (ext === ".yaml" || ext === ".yml") {
    doc = yaml.load(raw) as OpenApiDoc;
  } else {
    doc = JSON.parse(raw) as OpenApiDoc;
  }

  const info = (doc["info"] as Record<string, string>) || {};
  const servers = (doc["servers"] as Array<{ url: string }>) || [];
  const paths = (doc["paths"] as Record<string, Record<string, OperationObject>>) || {};
  const components = (doc["components"] as Record<string, unknown>) || {};
  const schemas = (components["schemas"] as Record<string, SchemaObject>) || {};
  const securitySchemes = (components["securitySchemes"] as Record<string, unknown>) || {};

  const allTags = new Set<string>();
  const operations: ParsedOperation[] = [];

  const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;

  for (const [pathStr, pathItem] of Object.entries(paths)) {
    const pathParams = parseParameters(
      (pathItem["parameters"] as unknown as SchemaObject[]) || [],
      doc
    );

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method] as OperationObject | undefined;
      if (!operation) continue;

      const tags = (operation["tags"] as string[]) || ["default"];
      tags.forEach((t) => allTags.add(t));

      const operationId =
        (operation["operationId"] as string) ||
        buildOperationId(method, pathStr);

      const operationParams = parseParameters(
        (operation["parameters"] as unknown as SchemaObject[]) || [],
        doc
      );

      const allParams = [...pathParams, ...operationParams].filter(
        (p, i, arr) => arr.findIndex((x) => x.name === p.name) === i
      );

      operations.push({
        operationId,
        method,
        path: pathStr,
        summary: (operation["summary"] as string) || "",
        description: (operation["description"] as string) || "",
        tags,
        parameters: allParams,
        requestBody: parseRequestBody(operation["requestBody"] as SchemaObject, doc),
        responses: parseResponses(
          operation["responses"] as Record<string, SchemaObject>,
          doc
        ),
        requiresAuth: hasSecurityRequirement(operation, doc),
        deprecated: Boolean(operation["deprecated"]),
      });
    }
  }

  const models: ParsedModel[] = Object.entries(schemas).map(([name, schema]) => {
    const parsed = parseSchema(schema, doc);
    return {
      name,
      description: (schema["description"] as string) || "",
      schema: parsed,
      properties: parsed.properties || {},
      required: parsed.required || [],
    };
  });

  return {
    title: info["title"] || "Lomash Wood API",
    version: info["version"] || "1.0.0",
    description: info["description"] || "",
    baseUrl: servers[0]?.url || "http://localhost:3000",
    operations,
    models,
    tags: Array.from(allTags).sort(),
    securitySchemes,
  };
}

export function schemaToTypeScript(schema: ParsedSchema, indent: number = 0): string {
  const pad = "  ".repeat(indent);

  if (schema.ref) return schema.ref;

  if (schema.enum) {
    return schema.enum.map((v) => (typeof v === "string" ? `"${v}"` : String(v))).join(" | ");
  }

  switch (schema.type) {
    case "string":
      return "string";
    case "number":
    case "integer":
      return "number";
    case "boolean":
      return "boolean";
    case "array":
      return `Array<${schemaToTypeScript(schema.items || { type: "unknown" }, indent)}>`;
    case "object": {
      if (!schema.properties || Object.keys(schema.properties).length === 0) {
        return "Record<string, unknown>";
      }
      const required = new Set(schema.required || []);
      const fields = Object.entries(schema.properties)
        .map(([key, val]) => {
          const optional = !required.has(key) ? "?" : "";
          const nullable = val.nullable ? " | null" : "";
          return `${pad}  ${key}${optional}: ${schemaToTypeScript(val, indent + 1)}${nullable};`;
        })
        .join("\n");
      return `{\n${fields}\n${pad}}`;
    }
    case "union": {
      if (!schema.properties) return "unknown";
      return Object.values(schema.properties)
        .map((v) => schemaToTypeScript(v, indent))
        .join(" | ");
    }
    default:
      return "unknown";
  }
}

export function schemaToZod(schema: ParsedSchema, indent: number = 0): string {
  if (schema.ref) return `${schema.ref}Schema`;

  if (schema.enum) {
    const values = schema.enum.map((v) =>
      typeof v === "string" ? `"${v}"` : String(v)
    );
    if (schema.type === "string") {
      return `z.enum([${values.join(", ")}])`;
    }
    return `z.union([${values.map((v) => `z.literal(${v})`).join(", ")}])`;
  }

  let base: string;

  switch (schema.type) {
    case "string": {
      let chain = "z.string()";
      if (schema.minLength) chain += `.min(${schema.minLength})`;
      if (schema.maxLength) chain += `.max(${schema.maxLength})`;
      if (schema.format === "email") chain += ".email()";
      if (schema.format === "uri") chain += ".url()";
      if (schema.format === "uuid") chain += ".uuid()";
      base = chain;
      break;
    }
    case "number":
    case "integer": {
      let chain = "z.number()";
      if (schema.type === "integer") chain += ".int()";
      if (schema.minimum !== undefined) chain += `.min(${schema.minimum})`;
      if (schema.maximum !== undefined) chain += `.max(${schema.maximum})`;
      base = chain;
      break;
    }
    case "boolean":
      base = "z.boolean()";
      break;
    case "array":
      base = `z.array(${schemaToZod(schema.items || { type: "unknown" }, indent)})`;
      break;
    case "object": {
      if (!schema.properties || Object.keys(schema.properties).length === 0) {
        base = "z.record(z.unknown())";
        break;
      }
      const required = new Set(schema.required || []);
      const pad = "  ".repeat(indent + 1);
      const fields = Object.entries(schema.properties)
        .map(([key, val]) => {
          let zodType = schemaToZod(val, indent + 1);
          if (!required.has(key)) zodType += ".optional()";
          if (val.nullable) zodType += ".nullable()";
          return `${pad}${key}: ${zodType}`;
        })
        .join(",\n");
      base = `z.object({\n${fields}\n${"  ".repeat(indent)}})`;
      break;
    }
    default:
      base = "z.unknown()";
  }

  if (schema.nullable) base += ".nullable()";
  return base;
}

if (require.main === module) {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error("Usage: ts-node src/parser.ts <openapi-file>");
    process.exit(1);
  }

  try {
    const spec = parseOpenApiSpec(filePath);
    console.log(JSON.stringify(spec, null, 2));
  } catch (err) {
    console.error("Parse failed:", err);
    process.exit(1);
  }
}