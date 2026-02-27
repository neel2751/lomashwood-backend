import { PrismaClient } from "@prisma/client";
import { fakerEN as faker } from "../faker.config";
import {
  KITCHEN_STYLES,
  BEDROOM_STYLES,
  FINISHES,
  COLOUR_HEX_MAP,
  PRODUCT_RANGES,
  randomItem,
  randomItems,
  randomPrice,
  randomInt,
} from "../faker.config";
import { generateId, generateTimestamps, generateSlug } from "../generate";

const prisma = new PrismaClient();

type ProductCategory = "KITCHEN" | "BEDROOM";

interface SeededColour {
  id: string;
  name: string;
  hexCode: string;
}

interface SeededCategory {
  id: string;
  name: string;
  slug: string;
}

async function seedColours(): Promise<SeededColour[]> {
  const colours: SeededColour[] = [];

  for (const [name, hexCode] of Object.entries(COLOUR_HEX_MAP)) {
    const colour = await prisma.colour.upsert({
      where: { name },
      update: {},
      create: {
        id: generateId(),
        name,
        hexCode,
        ...generateTimestamps(),
      },
    });
    colours.push(colour);
  }

  console.log(`✓ Seeded ${colours.length} colours`);
  return colours;
}

async function seedCategories(): Promise<SeededCategory[]> {
  const defs = [
    { name: "Kitchen", slug: "kitchen", description: "Complete kitchen design and installation solutions for your home." },
    { name: "Bedroom", slug: "bedroom", description: "Fitted bedroom furniture and bespoke wardrobe solutions." },
  ];

  const categories: SeededCategory[] = [];

  for (const def of defs) {
    const category = await prisma.category.upsert({
      where: { slug: def.slug },
      update: {},
      create: {
        id: generateId(),
        ...def,
        ...generateTimestamps(),
      },
    });
    categories.push(category);
  }

  console.log(`✓ Seeded ${categories.length} categories`);
  return categories;
}

function buildProductDescription(style: string, range: string, category: ProductCategory): string {
  const kitchenTexts = [
    `The ${range} ${style} kitchen combines elegant design with practical functionality. Featuring premium soft-close hinges and high-quality carcass construction, this range delivers outstanding durability and refined aesthetics for modern living.`,
    `Transform your kitchen with the stunning ${range} collection. This ${style.toLowerCase()} design offers the perfect balance of form and function, with crisp lines and an effortless aesthetic that will stand the test of time.`,
    `Discover the beauty of the ${range} ${style.toLowerCase()} kitchen. Crafted with meticulous attention to detail, each door is finished to perfection, offering a seamless, contemporary look that elevates any kitchen space.`,
  ];

  const bedroomTexts = [
    `The ${range} fitted bedroom range offers a sophisticated storage solution tailored to your lifestyle. With fully customisable interiors, this ${style.toLowerCase()} design maximises every inch of your space.`,
    `Achieve the bedroom of your dreams with the ${range} collection. This ${style.toLowerCase()} range provides elegant fitted furniture that seamlessly blends with your existing décor while offering exceptional storage capacity.`,
    `The ${range} bedroom furniture combines timeless ${style.toLowerCase()} design with intelligent storage solutions. Built to last, each piece is crafted using premium materials and expert joinery techniques.`,
  ];

  const texts = category === "KITCHEN" ? kitchenTexts : bedroomTexts;
  return texts[Math.floor(Math.random() * texts.length)];
}

async function seedKitchenProducts(
  kitchenCategory: SeededCategory,
  colours: SeededColour[]
): Promise<void> {
  const count = 50;
  console.log(`Creating ${count} kitchen products...`);

  for (let i = 0; i < count; i++) {
    const style = randomItem(KITCHEN_STYLES);
    const range = randomItem(PRODUCT_RANGES);
    const finish = randomItem(FINISHES);
    const selectedColours = randomItems(colours, 2, 6);
    const title = `${range} ${style} Kitchen`;
    const slug = generateSlug(`${title}-${i}`);
    const basePrice = randomPrice(3000, 20000);

    const product = await prisma.product.create({
      data: {
        id: generateId(),
        title,
        slug,
        description: buildProductDescription(style, range, "KITCHEN"),
        category: "KITCHEN",
        categoryId: kitchenCategory.id,
        rangeName: range,
        style,
        finish,
        basePrice,
        isPublished: Math.random() > 0.1,
        isFeatured: Math.random() > 0.8,
        sortOrder: i + 1,
        colours: {
          connect: selectedColours.map((c) => ({ id: c.id })),
        },
        images: {
          create: Array.from({ length: randomInt(3, 6) }, (_, idx) => ({
            id: generateId(),
            url: `https://cdn.lomashwood.co.uk/products/kitchens/${slug}-${idx + 1}.jpg`,
            altText: `${title} - Image ${idx + 1}`,
            isPrimary: idx === 0,
            sortOrder: idx + 1,
          })),
        },
        units: {
          create: Array.from({ length: randomInt(2, 5) }, (_, idx) => ({
            id: generateId(),
            title: `${randomItem(["Base", "Wall", "Tower", "Corner", "Larder"])} Unit ${idx + 1}`,
            description: faker.commerce.productDescription(),
            imageUrl: `https://cdn.lomashwood.co.uk/products/units/${slug}-unit-${idx + 1}.jpg`,
            width: randomItem([300, 400, 450, 500, 600, 800, 900, 1000]),
            height: randomItem([720, 900, 1950, 2100, 2400]),
            depth: randomItem([300, 350, 560, 580, 600]),
            price: randomPrice(200, 2000),
          })),
        },
        ...generateTimestamps(),
      },
    });

    if ((i + 1) % 10 === 0) {
      console.log(`  Created ${i + 1}/${count} kitchen products`);
    }
  }
}

async function seedBedroomProducts(
  bedroomCategory: SeededCategory,
  colours: SeededColour[]
): Promise<void> {
  const count = 50;
  console.log(`Creating ${count} bedroom products...`);

  for (let i = 0; i < count; i++) {
    const style = randomItem(BEDROOM_STYLES);
    const range = randomItem(PRODUCT_RANGES);
    const finish = randomItem(FINISHES);
    const selectedColours = randomItems(colours, 2, 5);
    const title = `${range} ${style} Bedroom`;
    const slug = generateSlug(`${title}-${i}`);
    const basePrice = randomPrice(2000, 15000);

    await prisma.product.create({
      data: {
        id: generateId(),
        title,
        slug,
        description: buildProductDescription(style, range, "BEDROOM"),
        category: "BEDROOM",
        categoryId: bedroomCategory.id,
        rangeName: range,
        style,
        finish,
        basePrice,
        isPublished: Math.random() > 0.1,
        isFeatured: Math.random() > 0.8,
        sortOrder: i + 1,
        colours: {
          connect: selectedColours.map((c) => ({ id: c.id })),
        },
        images: {
          create: Array.from({ length: randomInt(3, 6) }, (_, idx) => ({
            id: generateId(),
            url: `https://cdn.lomashwood.co.uk/products/bedrooms/${slug}-${idx + 1}.jpg`,
            altText: `${title} - Image ${idx + 1}`,
            isPrimary: idx === 0,
            sortOrder: idx + 1,
          })),
        },
        units: {
          create: Array.from({ length: randomInt(1, 4) }, (_, idx) => ({
            id: generateId(),
            title: `${randomItem(["Wardrobe", "Chest of Drawers", "Bedside Cabinet", "Dressing Table", "Ottoman"])} ${idx + 1}`,
            description: faker.commerce.productDescription(),
            imageUrl: `https://cdn.lomashwood.co.uk/products/units/${slug}-unit-${idx + 1}.jpg`,
            width: randomItem([600, 900, 1200, 1500, 1800, 2000]),
            height: randomItem([1950, 2100, 2250, 2400]),
            depth: randomItem([550, 600, 650]),
            price: randomPrice(300, 3000),
          })),
        },
        ...generateTimestamps(),
      },
    });

    if ((i + 1) % 10 === 0) {
      console.log(`  Created ${i + 1}/${count} bedroom products`);
    }
  }
}

async function seedSales(products: { id: string; title: string; category: string }[]): Promise<void> {
  const sales = [
    {
      title: "Spring Kitchen Sale",
      description: "Save up to 50% on selected kitchen ranges this spring. Limited time offer.",
      imageUrl: "https://cdn.lomashwood.co.uk/sales/spring-kitchen-sale.jpg",
      discountPercent: 50,
      isActive: true,
      validFrom: new Date("2024-03-01"),
      validTo: new Date("2024-05-31"),
      termsAndConditions: "Offer applies to selected ranges only. Cannot be combined with other offers. Subject to availability.",
      appliesTo: "KITCHEN" as const,
    },
    {
      title: "Bedroom Clearance Event",
      description: "Huge savings on fitted bedroom furniture. Up to 40% off across the entire bedroom range.",
      imageUrl: "https://cdn.lomashwood.co.uk/sales/bedroom-clearance.jpg",
      discountPercent: 40,
      isActive: true,
      validFrom: new Date("2024-01-01"),
      validTo: new Date("2024-12-31"),
      termsAndConditions: "Valid on new orders placed during promotional period. Installation not included.",
      appliesTo: "BEDROOM" as const,
    },
    {
      title: "Summer Design Special",
      description: "Book a consultation this summer and receive a free design package worth £500.",
      imageUrl: "https://cdn.lomashwood.co.uk/sales/summer-design-special.jpg",
      discountPercent: null,
      isActive: true,
      validFrom: new Date("2024-06-01"),
      validTo: new Date("2024-08-31"),
      termsAndConditions: "Free design package applies to orders over £8,000. One per household.",
      appliesTo: "BOTH" as const,
    },
    {
      title: "January Sale",
      description: "Start the new year with a brand new kitchen or bedroom. Save up to 60% in our January Sale.",
      imageUrl: "https://cdn.lomashwood.co.uk/sales/january-sale.jpg",
      discountPercent: 60,
      isActive: false,
      validFrom: new Date("2024-01-01"),
      validTo: new Date("2024-01-31"),
      termsAndConditions: "Selected ranges only. Orders must be placed by 31st January 2024.",
      appliesTo: "BOTH" as const,
    },
  ];

  for (const sale of sales) {
    const kitchenProducts = products.filter((p) => p.category === "KITCHEN").slice(0, 5);
    const bedroomProducts = products.filter((p) => p.category === "BEDROOM").slice(0, 5);

    let connectProducts: { id: string }[] = [];
    if (sale.appliesTo === "KITCHEN") connectProducts = kitchenProducts.map((p) => ({ id: p.id }));
    else if (sale.appliesTo === "BEDROOM") connectProducts = bedroomProducts.map((p) => ({ id: p.id }));
    else connectProducts = [...kitchenProducts, ...bedroomProducts].map((p) => ({ id: p.id }));

    await prisma.sale.create({
      data: {
        id: generateId(),
        title: sale.title,
        description: sale.description,
        imageUrl: sale.imageUrl,
        discountPercent: sale.discountPercent,
        isActive: sale.isActive,
        validFrom: sale.validFrom,
        validTo: sale.validTo,
        termsAndConditions: sale.termsAndConditions,
        products: { connect: connectProducts },
        ...generateTimestamps(),
      },
    });
  }

  console.log(`✓ Seeded ${sales.length} sales`);
}

async function seedPackages(): Promise<void> {
  const packages = [
    {
      title: "Essential Kitchen Package",
      description: "Everything you need for a stylish new kitchen. Includes units, worktop, sink, and installation.",
      imageUrl: "https://cdn.lomashwood.co.uk/packages/essential-kitchen.jpg",
      price: 5999,
      isActive: true,
      category: "KITCHEN" as const,
    },
    {
      title: "Premium Kitchen Package",
      description: "Our most popular package. Premium appliances, quartz worktop, and full installation included.",
      imageUrl: "https://cdn.lomashwood.co.uk/packages/premium-kitchen.jpg",
      price: 12999,
      isActive: true,
      category: "KITCHEN" as const,
    },
    {
      title: "Luxury Kitchen Package",
      description: "The ultimate kitchen transformation. Top-of-the-range appliances, granite surfaces, and bespoke design service.",
      imageUrl: "https://cdn.lomashwood.co.uk/packages/luxury-kitchen.jpg",
      price: 24999,
      isActive: true,
      category: "KITCHEN" as const,
    },
    {
      title: "Essential Bedroom Package",
      description: "A complete fitted bedroom solution. Wardrobe, drawers, and bedside cabinets included with fitting.",
      imageUrl: "https://cdn.lomashwood.co.uk/packages/essential-bedroom.jpg",
      price: 3999,
      isActive: true,
      category: "BEDROOM" as const,
    },
    {
      title: "Premium Bedroom Package",
      description: "Luxurious fitted bedroom with walk-in wardrobe, dressing table, and premium interior fittings.",
      imageUrl: "https://cdn.lomashwood.co.uk/packages/premium-bedroom.jpg",
      price: 8999,
      isActive: true,
      category: "BEDROOM" as const,
    },
  ];

  for (const pkg of packages) {
    await prisma.package.create({
      data: {
        id: generateId(),
        ...pkg,
        ...generateTimestamps(),
      },
    });
  }

  console.log(`✓ Seeded ${packages.length} packages`);
}

async function main(): Promise<void> {
  console.log("Seeding product data...");

  const colours = await seedColours();
  const categories = await seedCategories();

  const kitchenCategory = categories.find((c) => c.slug === "kitchen")!;
  const bedroomCategory = categories.find((c) => c.slug === "bedroom")!;

  await seedKitchenProducts(kitchenCategory, colours);
  await seedBedroomProducts(bedroomCategory, colours);

  const allProducts = await prisma.product.findMany({ select: { id: true, title: true, category: true } });

  await seedSales(allProducts);
  await seedPackages();

  const totalProducts = await prisma.product.count();
  console.log(`\n✓ Product seeding complete`);
  console.log(`  Total products: ${totalProducts}`);
  console.log(`  Colours: ${colours.length}`);
  console.log(`  Categories: ${categories.length}`);
}

main()
  .catch((error) => {
    console.error("Product seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });