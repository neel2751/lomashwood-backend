import * as fs from "fs";
import * as path from "path";
import { fakerEN as faker } from "./faker.config";

export interface GeneratorConfig {
  outputDir: string;
  format: "json" | "sql" | "ts";
  count: Record<string, number>;
}

export const defaultConfig: GeneratorConfig = {
  outputDir: path.resolve(__dirname, "../generated"),
  format: "json",
  count: {
    users: 50,
    products: 100,
    categories: 10,
    colours: 18,
    orders: 200,
    appointments: 80,
    showrooms: 12,
    blogs: 30,
    reviews: 60,
    brochureRequests: 40,
    businessInquiries: 25,
    newsletterSubscriptions: 100,
  },
};

export function ensureOutputDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function writeJsonFile(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Generated: ${filePath}`);
}

export function writeSqlFile(filePath: string, sql: string): void {
  fs.writeFileSync(filePath, sql, "utf-8");
  console.log(`Generated: ${filePath}`);
}

export function generateId(): string {
  return faker.string.uuid();
}

export function generateTimestamps() {
  const createdAt = faker.date.past({ years: 2 });
  const updatedAt = faker.date.between({ from: createdAt, to: new Date() });
  return { createdAt, updatedAt };
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickRandomMany<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

async function main(): Promise<void> {
  const config = defaultConfig;
  ensureOutputDir(config.outputDir);

  console.log("Lomash Wood Seed Generator");
  console.log("===========================");
  console.log(`Output: ${config.outputDir}`);
  console.log(`Format: ${config.format}`);
  console.log("");
  console.log("Run individual seeders:");
  console.log("  npm run seed:auth");
  console.log("  npm run seed:product");
  console.log("  npm run seed:order");
  console.log("  npm run seed:booking");
  console.log("  npm run seed:content");
  console.log("  npm run seed:customer");
  console.log("");
  console.log("Or run all: npm run seed");
}

main().catch(console.error);