import * as fs from "fs";
import * as path from "path";
import Handlebars from "handlebars";
import prettier from "prettier";
import { Command } from "commander";
import {
  parseOpenApiSpec,
  schemaToTypeScript,
  schemaToZod,
  ParsedSpec,
  ParsedOperation,
  ParsedSchema,
} from "./parser";
import { validateSpec } from "./validate";



type TemplateFormat = "typescript" | "axios" | "react-query" | "openapi";

interface GeneratorOptions {
  input: string;
  output: string;
  format: TemplateFormat;
  baseUrl: string | null;
  skipValidation: boolean;
  prettier: boolean;
}

const TEMPLATE_DIR = path.resolve(__dirname, "templates");



function loadTemplate(name: string): Handlebars.TemplateDelegate {
  const filePath = path.join(TEMPLATE_DIR, `${name}.hbs`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Template not found: ${filePath}`);
  }

  const source = fs.readFileSync(filePath, "utf-8");
  return Handlebars.compile(source, { noEscape: true });
}

function registerHelpers(): void {
  Handlebars.registerHelper("upperFirst", (str: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : ""
  );

  Handlebars.registerHelper("lowerFirst", (str: string) =>
    str ? str.charAt(0).toLowerCase() + str.slice(1) : ""
  );

  Handlebars.registerHelper("camelCase", (str: string) => {
    if (!str) return "";
    return str
      .replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase())
      .replace(/^(.)/, (c: string) => c.toLowerCase());
  });

  Handlebars.registerHelper("pascalCase", (str: string) => {
    if (!str) return "";
    return str
      .replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase())
      .replace(/^(.)/, (c: string) => c.toUpperCase());
  });

  Handlebars.registerHelper("constantCase", (str: string) => {
    if (!str) return "";
    return str
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .toUpperCase()
      .replace(/[-\s]+/g, "_");
  });

  Handlebars.registerHelper("schemaToTs", (schema: ParsedSchema) => {
    if (!schema) return "unknown";
    return schemaToTypeScript(schema);
  });

  Handlebars.registerHelper("schemaToZod", (schema: ParsedSchema) => {
    if (!schema) return "z.unknown()";
    return schemaToZod(schema);
  });

  Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);
  Handlebars.registerHelper("ne", (a: unknown, b: unknown) => a !== b);
  Handlebars.registerHelper("and", (a: unknown, b: unknown) => Boolean(a) && Boolean(b));
  Handlebars.registerHelper("or", (a: unknown, b: unknown) => Boolean(a) || Boolean(b));
  Handlebars.registerHelper("not", (a: unknown) => !a);

  Handlebars.registerHelper("includes", (arr: unknown[], val: unknown) =>
    Array.isArray(arr) && arr.includes(val)
  );

  Handlebars.registerHelper("join", (arr: string[], sep: string) =>
    Array.isArray(arr) ? arr.join(typeof sep === "string" ? sep : ", ") : ""
  );

  Handlebars.registerHelper("isLast", (index: number, arr: unknown[]) =>
    index === arr.length - 1
  );

  Handlebars.registerHelper("hasPathParams", (operation: ParsedOperation) =>
    operation.parameters.some((p) => p.in === "path")
  );

  Handlebars.registerHelper("hasQueryParams", (operation: ParsedOperation) =>
    operation.parameters.some((p) => p.in === "query")
  );

  Handlebars.registerHelper("pathParams", (operation: ParsedOperation) =>
    operation.parameters.filter((p) => p.in === "path")
  );

  Handlebars.registerHelper("queryParams", (operation: ParsedOperation) =>
    operation.parameters.filter((p) => p.in === "query")
  );

  Handlebars.registerHelper("httpMethodColor", (method: string) => {
    const colors: Record<string, string> = {
      get: "green",
      post: "blue",
      put: "orange",
      patch: "yellow",
      delete: "red",
    };
    return colors[method.toLowerCase()] || "gray";
  });

  Handlebars.registerHelper("successResponse", (operation: ParsedOperation) => {
    return (
      operation.responses.find(
        (r) => r.statusCode === "200" || r.statusCode === "201"
      ) || null
    );
  });

  Handlebars.registerHelper("pathToUrl", (pathStr: string) => {
    return pathStr.replace(/\{([^}]+)\}/g, "${$1}");
  });

  Handlebars.registerHelper(
    "operationsByTag",
    (operations: ParsedOperation[], tag: string) =>
      operations.filter((op) => op.tags.includes(tag))
  );

  Handlebars.registerHelper("tagToPascal", (tag: string) => {
    if (!tag) return "";
    return tag
      .split(/[-_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("");
  });

  Handlebars.registerHelper(
    "isRequired",
    (paramName: string, required: string[]) =>
      Array.isArray(required) && required.includes(paramName)
  );

  Handlebars.registerHelper("json", (value: unknown) =>
    JSON.stringify(value, null, 2)
  );

  Handlebars.registerHelper(
    "repeat",
    (count: number, options: Handlebars.HelperOptions) => {
      let result = "";
      for (let i = 0; i < count; i++) {
        result += options.fn({ index: i });
      }
      return result;
    }
  );

  Handlebars.registerHelper("reactQueryKey", (operation: ParsedOperation) => {
    const tag = operation.tags[0] || "api";
    return `["${tag}", "${operation.operationId}"]`;
  });

  Handlebars.registerHelper("isMutation", (operation: ParsedOperation) =>
    ["post", "put", "patch", "delete"].includes(operation.method)
  );

  Handlebars.registerHelper("isQuery", (operation: ParsedOperation) =>
    operation.method === "get"
  );
}

function groupOperationsByTag(
  spec: ParsedSpec
): Record<string, ParsedOperation[]> {
  const grouped: Record<string, ParsedOperation[]> = {};

  for (const operation of spec.operations) {
    const tag = operation.tags[0] || "default";
    if (!grouped[tag]) grouped[tag] = [];
    grouped[tag].push(operation);
  }

  return grouped;
}

function buildTemplateContext(
  spec: ParsedSpec,
  overrideBaseUrl: string | null
) {
  return {
    spec,
    title: spec.title,
    version: spec.version,
    description: spec.description,
    baseUrl: overrideBaseUrl || spec.baseUrl,
    operations: spec.operations,
    models: spec.models,
    tags: spec.tags,
    operationsByTag: groupOperationsByTag(spec),
    generatedAt: new Date().toISOString(),
    hasAuth: Object.keys(spec.securitySchemes).length > 0,
    totalOperations: spec.operations.length,
    totalModels: spec.models.length,
  };
}

async function formatCode(
  code: string,
  parser: prettier.BuiltInParserName
): Promise<string> {
  try {
    return await prettier.format(code, {
      parser,
      semi: true,
      singleQuote: false,
      trailingComma: "es5",
      printWidth: 100,
      tabWidth: 2,
    });
  } catch {
    return code;
  }
}

function getOutputExtension(format: TemplateFormat): string {
  switch (format) {
    case "typescript":
    case "axios":
    case "react-query":
      return ".ts";
    case "openapi":
      return ".yaml";
    default:
      return ".ts";
  }
}

function getPrettierParser(
  format: TemplateFormat
): prettier.BuiltInParserName {
  switch (format) {
    case "openapi":
      return "yaml";
    default:
      return "typescript";
  }
}

function getTemplateFileName(format: TemplateFormat): string {
  switch (format) {
    case "typescript":
      return "typescript";
    case "axios":
      return "axios";
    case "react-query":
      return "react-query";
    case "openapi":
      return "openapi";
    default:
      return "typescript";
  }
}

async function runGenerator(options: GeneratorOptions): Promise<void> {
  console.log("Lomash Wood API Client Generator");
  console.log("==================================");
  console.log(`Input:   ${options.input}`);
  console.log(`Output:  ${options.output}`);
  console.log(`Format:  ${options.format}`);
  console.log("");

  if (!options.skipValidation) {
    console.log("Validating spec...");
    const validationResult = await validateSpec(options.input);

    if (!validationResult.valid) {
      console.error(
        `Spec validation failed with ${validationResult.errors.length} error(s):`
      );
      validationResult.errors.forEach((e) => {
        console.error(`  [ERROR] ${e.path}: ${e.message}`);
      });
      process.exit(1);
    }

    if (validationResult.warnings.length > 0) {
      console.warn(
        `${validationResult.warnings.length} warning(s) found — proceeding`
      );
    }

    console.log(
      `Spec valid: ${validationResult.operationCount} operations, ${validationResult.modelCount} models`
    );
    console.log("");
  }

  console.log("Parsing spec...");
  const spec = parseOpenApiSpec(options.input);

  console.log(
    `Loaded: ${spec.operations.length} operations, ${spec.models.length} models`
  );
  console.log("");

  registerHelpers();

  const templateName = getTemplateFileName(options.format);
  const template = loadTemplate(templateName);
  const context = buildTemplateContext(spec, options.baseUrl);

  console.log(`Rendering ${options.format} template...`);
  let output = template(context);

  if (options.prettier) {
    console.log("Formatting output...");
    const parser = getPrettierParser(options.format);
    output = await formatCode(output, parser);
  }

  const outputDir = path.dirname(options.output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let outputPath = options.output;
  if (!path.extname(outputPath)) {
    outputPath += getOutputExtension(options.format);
  }

  fs.writeFileSync(outputPath, output, "utf-8");

  const sizeKb = (fs.statSync(outputPath).size / 1024).toFixed(1);
  console.log(`Generated: ${outputPath} (${sizeKb}KB)`);
  console.log("");
  console.log("Done.");
}

if (require.main === module) {
  const program = new Command();

  program
    .name("generate")
    .description("Generates API clients from a Lomash Wood OpenAPI specification")
    .requiredOption("-i, --input <file>", "Path to OpenAPI spec file (.yaml or .json)")
    .requiredOption(
      "-o, --output <file>",
      "Output file path (extension auto-added if omitted)"
    )
    .option(
      "-f, --format <type>",
      "Output format: typescript | axios | react-query | openapi",
      "typescript"
    )
    .option("--base-url <url>", "Override the base URL from the spec")
    .option("--skip-validation", "Skip spec validation before generating", false)
    .option("--no-prettier", "Skip prettier formatting of output")
    .action(
      (opts: {
        input: string;
        output: string;
        format: string;
        baseUrl?: string;
        skipValidation: boolean;
        prettier: boolean;
      }) => {
        const validFormats: TemplateFormat[] = [
          "typescript",
          "axios",
          "react-query",
          "openapi",
        ];

        if (!validFormats.includes(opts.format as TemplateFormat)) {
          console.error(`Invalid format: ${opts.format}`);
          console.error(`Valid formats: ${validFormats.join(", ")}`);
          process.exit(1);
        }

        runGenerator({
          input: opts.input,
          output: opts.output,
          format: opts.format as TemplateFormat,
          baseUrl: opts.baseUrl || null,
          skipValidation: opts.skipValidation,
          prettier: opts.prettier,
        }).catch((err) => {
          console.error("Generation failed:", err);
          process.exit(1);
        });
      }
    );

  program.parse(process.argv);
}