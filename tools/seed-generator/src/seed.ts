import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runSeeder(name: string, fn: () => Promise<void>): Promise<void> {
  console.log(`Seeding ${name}...`);
  try {
    await fn();
    console.log(`✓ ${name} seeded`);
  } catch (error) {
    console.error(`✗ ${name} failed:`, error);
    throw error;
  }
}

async function clearDatabase(): Promise<void> {
  console.log("Clearing database...");
  await prisma.$transaction([
    prisma.paymentTransaction.deleteMany(),
    prisma.order.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.brochureRequest.deleteMany(),
    prisma.businessInquiry.deleteMany(),
    prisma.newsletterSubscription.deleteMany(),
    prisma.review.deleteMany(),
    prisma.mediaWall.deleteMany(),
    prisma.blog.deleteMany(),
    prisma.showroom.deleteMany(),
    prisma.product.deleteMany(),
    prisma.colour.deleteMany(),
    prisma.category.deleteMany(),
    prisma.sale.deleteMany(),
    prisma.package.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  console.log("✓ Database cleared");
}

async function seedColours(): Promise<void> {
  const colours = [
    { name: "Pebble Grey", hexCode: "#9E9E9E" },
    { name: "Ivory White", hexCode: "#FFFFF0" },
    { name: "Anthracite Grey", hexCode: "#3B3B3B" },
    { name: "Midnight Blue", hexCode: "#191970" },
    { name: "Forest Green", hexCode: "#228B22" },
    { name: "Cream", hexCode: "#FFFDD0" },
    { name: "Cashmere", hexCode: "#E8D8C4" },
    { name: "Dove Grey", hexCode: "#B0B0B0" },
    { name: "Graphite", hexCode: "#474747" },
    { name: "Alabaster White", hexCode: "#F2F0EB" },
    { name: "Sage Green", hexCode: "#B2AC88" },
    { name: "Navy Blue", hexCode: "#000080" },
    { name: "Dusty Pink", hexCode: "#D9A0A0" },
    { name: "Charcoal", hexCode: "#36454F" },
    { name: "Soft White", hexCode: "#F5F5F5" },
    { name: "Stone Grey", hexCode: "#928E85" },
    { name: "Warm Oak", hexCode: "#8B6914" },
    { name: "Pale Grey", hexCode: "#D3D3D3" },
  ];

  for (const colour of colours) {
    await prisma.colour.upsert({
      where: { name: colour.name },
      update: {},
      create: colour,
    });
  }
}

async function seedCategories(): Promise<void> {
  const categories = [
    { name: "Kitchen", slug: "kitchen", description: "Complete kitchen design solutions" },
    { name: "Bedroom", slug: "bedroom", description: "Fitted bedroom furniture and wardrobes" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
}

async function seedShowrooms(): Promise<void> {
  const showrooms = [
    {
      name: "Lomash Wood London Clapham",
      address: "42 High Street, Clapham, London, SW4 7UR",
      email: "clapham@lomashwood.co.uk",
      phone: "020 7946 0001",
      openingHours: "Mon-Sat: 9am-6pm, Sun: 10am-4pm",
      mapLink: "https://maps.google.com/?q=Clapham+London",
      imageUrl: "https://cdn.lomashwood.co.uk/showrooms/clapham.jpg",
    },
    {
      name: "Lomash Wood Manchester",
      address: "15 Deansgate, Manchester, M3 4LQ",
      email: "manchester@lomashwood.co.uk",
      phone: "0161 946 0002",
      openingHours: "Mon-Sat: 9am-6pm, Sun: 10am-4pm",
      mapLink: "https://maps.google.com/?q=Deansgate+Manchester",
      imageUrl: "https://cdn.lomashwood.co.uk/showrooms/manchester.jpg",
    },
    {
      name: "Lomash Wood Birmingham",
      address: "88 Broad Street, Birmingham, B15 1AU",
      email: "birmingham@lomashwood.co.uk",
      phone: "0121 946 0003",
      openingHours: "Mon-Sat: 9am-6pm, Sun: 11am-4pm",
      mapLink: "https://maps.google.com/?q=Broad+Street+Birmingham",
      imageUrl: "https://cdn.lomashwood.co.uk/showrooms/birmingham.jpg",
    },
    {
      name: "Lomash Wood Leeds",
      address: "22 The Headrow, Leeds, LS1 6PT",
      email: "leeds@lomashwood.co.uk",
      phone: "0113 946 0004",
      openingHours: "Mon-Sat: 9am-6pm, Sun: 10am-5pm",
      mapLink: "https://maps.google.com/?q=The+Headrow+Leeds",
      imageUrl: "https://cdn.lomashwood.co.uk/showrooms/leeds.jpg",
    },
    {
      name: "Lomash Wood Bristol",
      address: "7 Clifton Down, Bristol, BS8 3HT",
      email: "bristol@lomashwood.co.uk",
      phone: "0117 946 0005",
      openingHours: "Mon-Sat: 9am-5:30pm, Sun: 11am-4pm",
      mapLink: "https://maps.google.com/?q=Clifton+Down+Bristol",
      imageUrl: "https://cdn.lomashwood.co.uk/showrooms/bristol.jpg",
    },
  ];

  for (const showroom of showrooms) {
    await prisma.showroom.upsert({
      where: { email: showroom.email },
      update: {},
      create: showroom,
    });
  }
}

async function seedAdminUser(): Promise<void> {
  const bcrypt = await import("bcrypt");
  const passwordHash = await bcrypt.hash("Admin@LomashWood2024!", 12);

  await prisma.user.upsert({
    where: { email: "admin@lomashwood.co.uk" },
    update: {},
    create: {
      email: "admin@lomashwood.co.uk",
      name: "Lomash Wood Admin",
      passwordHash,
      role: "ADMIN",
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "staff@lomashwood.co.uk" },
    update: {},
    create: {
      email: "staff@lomashwood.co.uk",
      name: "Lomash Wood Staff",
      passwordHash,
      role: "STAFF",
      emailVerified: true,
    },
  });
}

async function main(): Promise<void> {
  console.log("Lomash Wood Database Seeder");
  console.log("============================\n");

  const args = process.argv.slice(2);
  const shouldClear = args.includes("--clear");

  if (shouldClear) {
    await clearDatabase();
  }

  await runSeeder("colours", seedColours);
  await runSeeder("categories", seedCategories);
  await runSeeder("showrooms", seedShowrooms);
  await runSeeder("admin users", seedAdminUser);

  console.log("\n✓ All seeds completed successfully");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });