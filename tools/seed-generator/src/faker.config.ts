import { faker } from "@faker-js/faker";

faker.seed(42);

export const fakerEN = faker;

export const UK_POSTCODES = [
  "SW1A 1AA",
  "EC1A 1BB",
  "W1A 0AX",
  "M1 1AE",
  "B1 1BB",
  "LS1 1BA",
  "E1 6AN",
  "N1 9GU",
  "SE1 7PB",
  "WC2N 5DU",
];

export const UK_CITIES = [
  "London",
  "Manchester",
  "Birmingham",
  "Leeds",
  "Liverpool",
  "Bristol",
  "Sheffield",
  "Edinburgh",
  "Glasgow",
  "Cardiff",
];

export const KITCHEN_STYLES = [
  "Modern",
  "Classic",
  "Shaker",
  "Handleless",
  "In-Frame",
  "Contemporary",
  "Traditional",
  "Industrial",
];

export const BEDROOM_STYLES = [
  "Modern",
  "Classic",
  "Fitted",
  "Sliding Door",
  "Walk-In",
  "Contemporary",
  "Traditional",
  "Minimalist",
];

export const FINISHES = [
  "Gloss",
  "Matt",
  "Silk",
  "Textured",
  "Woodgrain",
  "Stone Effect",
  "High Gloss",
  "Satin",
];

export const COLOUR_HEX_MAP: Record<string, string> = {
  "Pebble Grey": "#9E9E9E",
  "Ivory White": "#FFFFF0",
  "Anthracite Grey": "#3B3B3B",
  "Midnight Blue": "#191970",
  "Forest Green": "#228B22",
  "Cream": "#FFFDD0",
  "Cashmere": "#E8D8C4",
  "Dove Grey": "#B0B0B0",
  "Graphite": "#474747",
  "Alabaster White": "#F2F0EB",
  "Sage Green": "#B2AC88",
  "Navy Blue": "#000080",
  "Dusty Pink": "#D9A0A0",
  "Charcoal": "#36454F",
  "Soft White": "#F5F5F5",
  "Stone Grey": "#928E85",
  "Warm Oak": "#8B6914",
  "Pale Grey": "#D3D3D3",
];

export const BUSINESS_TYPES = [
  "Builder",
  "Contractor",
  "Interior Designer",
  "Developer",
  "Architect",
  "Plumber",
  "Electrician",
  "Joiner",
  "Other",
];

export const APPOINTMENT_TYPES = [
  "HOME_MEASUREMENT",
  "ONLINE",
  "SHOWROOM",
] as const;

export const PRODUCT_RANGES = [
  "Lucia",
  "Belgravia",
  "Malton",
  "Cassia",
  "Caraway",
  "Delphi",
  "Zola",
  "Linea",
  "Farrow",
  "Brindley",
];

export function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomItems<T>(arr: T[], min = 1, max = 3): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomPrice(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

export function randomBoolean(probability = 0.5): boolean {
  return Math.random() < probability;
}

export function randomFutureDate(daysAhead = 30): Date {
  const date = new Date();
  date.setDate(date.getDate() + randomInt(1, daysAhead));
  date.setHours(randomInt(9, 17), randomItem([0, 30]), 0, 0);
  return date;
}

export function randomPastDate(daysBack = 90): Date {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(1, daysBack));
  return date;
}