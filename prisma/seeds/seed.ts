import { randomBytes, scryptSync } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../generated/prisma/client";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/postgres";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

async function seedAdmin() {
  await prisma.adminUser.upsert({
    where: { email: "admin@lomashwood.com" },
    update: {
      name: "Lomash Admin",
      status: "active",
      roleName: "admin",
    },
    create: {
      name: "Lomash Admin",
      email: "admin@lomashwood.com",
      passwordHash: hashPassword("admin12345"),
      roleName: "admin",
      status: "active",
    },
  });
}

async function seedCatalog() {
  async function upsertColourByName(name: string, hexCode: string) {
    const existing = await prisma.colour.findFirst({ where: { name } });
    if (existing) {
      return prisma.colour.update({ where: { id: existing.id }, data: { hexCode } });
    }
    return prisma.colour.create({ data: { name, hexCode } });
  }

  async function upsertSizeByTitle(title: string, description: string) {
    const existing = await prisma.size.findFirst({ where: { title } });
    if (existing) {
      return prisma.size.update({ where: { id: existing.id }, data: { description } });
    }
    return prisma.size.create({ data: { title, description } });
  }

  async function upsertPackageByTitle(data: {
    title: string;
    description: string;
    image: string;
    category: "kitchen" | "bedroom";
    price: number;
    features: string[];
  }) {
    const existing = await prisma.package.findFirst({ where: { title: data.title } });
    if (existing) {
      return prisma.package.update({
        where: { id: existing.id },
        data: {
          description: data.description,
          image: data.image,
          category: data.category,
          price: data.price,
          features: data.features,
          isActive: true,
        },
      });
    }

    return prisma.package.create({
      data: {
        title: data.title,
        description: data.description,
        image: data.image,
        category: data.category,
        price: data.price,
        features: data.features,
        isActive: true,
      },
    });
  }

  const colours = await Promise.all([
    upsertColourByName("Cashmere", "#D2C6B2"),
    upsertColourByName("Graphite", "#3B3F46"),
    upsertColourByName("Ivory", "#F7F1E6"),
  ]);

  const sizes = await Promise.all([
    upsertSizeByTitle("Compact", "Ideal for small spaces"),
    upsertSizeByTitle("Standard", "Standard family size"),
    upsertSizeByTitle("Large", "Large open-plan spaces"),
  ]);

  const packages = await Promise.all([
    upsertPackageByTitle({
      title: "Complete Kitchen Package",
      description:
        "A comprehensive kitchen package including cabinets, countertops, and appliances. Perfect for a full kitchen renovation.",
      image:
        "https://plus.unsplash.com/premium_photo-1683140941523-f1fbbabe54d5?q=80&w=3174&auto=format&fit=crop",
      category: "kitchen",
      price: 9999,
      features: ["Cabinets", "Countertops", "Appliances"],
    }),
    upsertPackageByTitle({
      title: "Bedroom Makeover Bundle",
      description:
        "Transform your bedroom with our makeover bundle. Includes bed frame, wardrobe, and bedside tables.",
      image:
        "https://plus.unsplash.com/premium_photo-1683140941523-f1fbbabe54d5?q=80&w=3174&auto=format&fit=crop",
      category: "bedroom",
      price: 4999,
      features: ["Bed Frame", "Wardrobe", "Bedside Tables"],
    }),
    upsertPackageByTitle({
      title: "Small Space Kitchen Solution",
      description:
        "Ideal for apartments and small homes, this package includes space-saving kitchen essentials.",
      image:
        "https://plus.unsplash.com/premium_photo-1683140941523-f1fbbabe54d5?q=80&w=3174&auto=format&fit=crop",
      category: "kitchen",
      price: 5999,
      features: ["Space-Saving Design", "Essential Appliances"],
    }),
  ]);

  const productData = [
    {
      title: "Luna Handleless Kitchen",
      description: "Modern handleless kitchen range with anti-fingerprint finish.",
      category: "kitchen" as const,
      rangeName: "Luna",
      images: ["/images/products/luna-1.jpg", "/images/products/luna-2.jpg"],
      price: 8499,
      packageTitle: "Complete Kitchen Package",
      finish: "matt" as const,
      style: "modern" as const,
      isPublished: true,
      colourNames: ["Cashmere", "Graphite"],
      sizeTitles: ["Standard", "Large"],
    },
    {
      title: "Haven Fitted Bedroom",
      description: "Shaker style fitted wardrobes and bedside set.",
      category: "bedroom" as const,
      rangeName: "Haven",
      images: ["/images/products/haven-1.jpg"],
      price: 5299,
      packageTitle: "Bedroom Makeover Bundle",
      finish: "satin" as const,
      style: "classic" as const,
      isPublished: true,
      colourNames: ["Ivory", "Cashmere"],
      sizeTitles: ["Compact", "Standard"],
    },
    {
      title: "Oakline Family Kitchen",
      description: "Warm oak kitchen with integrated island storage.",
      category: "kitchen" as const,
      rangeName: "Oakline",
      images: ["/images/products/oakline-1.jpg"],
      price: 10299,
      packageTitle: "Small Space Kitchen Solution",
      finish: "shaker" as const,
      style: "traditional" as const,
      isPublished: false,
      colourNames: ["Graphite"],
      sizeTitles: ["Large"],
    },
  ];

  const colourByName = new Map(colours.map((c) => [c.name, c.id]));
  const sizeByTitle = new Map(sizes.map((s) => [s.title, s.id]));
  const packageByTitle = new Map(packages.map((pkg) => [pkg.title, pkg.id]));

  for (const item of productData) {
    const existing = await prisma.product.findFirst({ where: { title: item.title } });

    const product = existing
      ? await prisma.product.update({
          where: { id: existing.id },
          data: {
            description: item.description,
            category: item.category,
            rangeName: item.rangeName,
            images: item.images,
            price: item.price,
            packageId: packageByTitle.get(item.packageTitle) ?? null,
            finish: item.finish,
            style: item.style,
            isPublished: item.isPublished,
          },
        })
      : await prisma.product.create({
          data: {
            title: item.title,
            description: item.description,
            category: item.category,
            rangeName: item.rangeName,
            images: item.images,
            price: item.price,
            packageId: packageByTitle.get(item.packageTitle) ?? null,
            finish: item.finish,
            style: item.style,
            isPublished: item.isPublished,
          },
        });

    await prisma.productColour.deleteMany({ where: { productId: product.id } });
    await prisma.productSize.deleteMany({ where: { productId: product.id } });

    const colourRows = item.colourNames
      .map((name) => colourByName.get(name))
      .filter((id): id is string => Boolean(id))
      .map((colourId) => ({ productId: product.id, colourId }));

    if (colourRows.length > 0) {
      await prisma.productColour.createMany({ data: colourRows, skipDuplicates: true });
    }

    const sizeRows = item.sizeTitles
      .map((title) => sizeByTitle.get(title))
      .filter((id): id is string => Boolean(id))
      .map((sizeId) => ({ productId: product.id, sizeId }));

    if (sizeRows.length > 0) {
      await prisma.productSize.createMany({ data: sizeRows, skipDuplicates: true });
    }
  }
}

async function seedProductOptions() {
  const styles = [
    {
      name: "Shaker",
      description: "Classic frame-and-panel look suited to both kitchen and bedroom spaces.",
      image: "https://cdn.lomashwood.co.uk/styles/shaker.jpg",
      isActive: true,
    },
    {
      name: "Handleless",
      description: "Minimal contemporary style with clean lines.",
      image: "https://cdn.lomashwood.co.uk/styles/handleless.jpg",
      isActive: true,
    },
    {
      name: "Traditional",
      description: "Heritage-inspired detailing and warm character.",
      image: "https://cdn.lomashwood.co.uk/styles/traditional.jpg",
      isActive: true,
    },
    {
      name: "Modern",
      description: "Sleek modern styling for premium interiors.",
      image: "https://cdn.lomashwood.co.uk/styles/modern.jpg",
      isActive: true,
    },
  ];

  const finishes = [
    {
      name: "Gloss",
      description: "High-shine reflective finish.",
      image: "https://cdn.lomashwood.co.uk/finishes/gloss.jpg",
      isActive: true,
    },
    {
      name: "Matt",
      description: "Low-sheen smooth finish for a soft modern look.",
      image: "https://cdn.lomashwood.co.uk/finishes/matt.jpg",
      isActive: true,
    },
    {
      name: "Satin",
      description: "Balanced sheen between gloss and matt.",
      image: "https://cdn.lomashwood.co.uk/finishes/satin.jpg",
      isActive: true,
    },
    {
      name: "Textured",
      description: "Structured tactile finish.",
      image: "https://cdn.lomashwood.co.uk/finishes/textured.jpg",
      isActive: false,
    },
  ];

  for (const style of styles) {
    await prisma.style.upsert({
      where: { name: style.name },
      update: {
        description: style.description,
        image: style.image,
        isActive: style.isActive,
      },
      create: style,
    });
  }

  for (const finish of finishes) {
    await prisma.finish.upsert({
      where: { name: finish.name },
      update: {
        description: finish.description,
        image: finish.image,
        isActive: finish.isActive,
      },
      create: finish,
    });
  }
}

async function seedShowrooms() {
  const showrooms = [
    {
      slug: "london-wembley",
      name: "Lomash Wood London Wembley",
      city: "London Wembley",
      address: "Unit 4, Wembley Commercial Centre, East Lane",
      postcode: "HA9 7UR",
      phone: "+442089001234",
      email: "wembley@lomashwood.co.uk",
      latitude: 51.556,
      longitude: -0.296,
      image:
        "https://asset.nobiadigital.com/fetch/ar_1.4,c_fill,q_auto,w_1600/f_auto/https%3A%2F%2Fwww.magnet.co.uk%2Fglobalassets%2Fshowrooms%2Fleeds%2F6.jpg",
      openToday: "9:00 AM - 6:00 PM",
      facilities: [
        "Dog friendly",
        "Expert advice",
        "Free design appointments",
        "Free parking",
        "Free WiFi",
        "Kitchens on display",
        "Bedrooms on display",
      ],
      team: [
        { name: "Raj", role: "Store Manager" },
        { name: "Priya", role: "Senior Kitchen Designer" },
        { name: "James", role: "Kitchen Designer" },
        { name: "Aisha", role: "Bedroom Specialist" },
      ],
      kitchensOnDisplay: [
        {
          name: "Milano Handleless Gloss",
          image:
            "https://asset.nobiadigital.com/fetch/ar_1.4,c_fill,q_auto,w_1600/f_auto/https%3A%2F%2Fwww.magnet.co.uk%2Fglobalassets%2Fshowrooms%2Fleeds%2Fkitchen-display-1.jpg",
          style: "Modern",
          isPrimary: true,
        },
        {
          name: "Cambridge Shaker",
          image:
            "https://asset.nobiadigital.com/fetch/ar_1.4,c_fill,q_auto,w_1600/f_auto/https%3A%2F%2Fwww.magnet.co.uk%2Fglobalassets%2Fshowrooms%2Fleeds%2Fkitchen-display-2.jpg",
          style: "Traditional",
        },
        {
          name: "Oslo Matt Graphite",
          image:
            "https://asset.nobiadigital.com/fetch/ar_1.4,c_fill,q_auto,w_1600/f_auto/https%3A%2F%2Fwww.magnet.co.uk%2Fglobalassets%2Fshowrooms%2Fleeds%2Fkitchen-display-3.jpg",
          style: "Contemporary",
        },
      ],
      openingHours: [
        { day: "Monday", date: "24 Feb", hours: "9:00 AM - 6:00 PM" },
        { day: "Tuesday", date: "25 Feb", hours: "9:00 AM - 6:00 PM" },
        { day: "Wednesday", date: "26 Feb", hours: "9:00 AM - 6:00 PM" },
        { day: "Thursday", date: "27 Feb", hours: "9:00 AM - 8:00 PM" },
        { day: "Friday", date: "28 Feb", hours: "9:00 AM - 6:00 PM" },
        { day: "Saturday", date: "01 Mar", hours: "9:00 AM - 5:00 PM" },
        { day: "Sunday", date: "02 Mar", hours: "10:00 AM - 4:00 PM" },
      ],
      nearbyStores: ["birmingham", "leicester", "manchester-trafford"],
    },
    {
      slug: "birmingham",
      name: "Lomash Wood Birmingham",
      city: "Birmingham",
      address: "45 High Street, Digbeth",
      postcode: "B5 6AH",
      phone: "+441211234567",
      email: "birmingham@lomashwood.co.uk",
      latitude: 52.4862,
      longitude: -1.8904,
      image:
        "https://asset.nobiadigital.com/fetch/ar_1.4,c_fill,q_auto,w_1600/f_auto/https%3A%2F%2Fwww.magnet.co.uk%2Fglobalassets%2Fshowrooms%2Fleeds%2F7.jpg",
      openToday: "9:00 AM - 5:30 PM",
      facilities: [
        "Expert advice",
        "Free design appointments",
        "Free parking",
        "Free WiFi",
        "Kitchens on display",
        "Bedrooms on display",
        "Toilets",
      ],
      team: [
        { name: "David", role: "Store Manager" },
        { name: "Sophie", role: "Kitchen Designer" },
        { name: "Imran", role: "Kitchen Designer" },
      ],
      kitchensOnDisplay: [
        {
          name: "Milano Handleless Gloss",
          image:
            "https://asset.nobiadigital.com/fetch/ar_1.4,c_fill,q_auto,w_1600/f_auto/https%3A%2F%2Fwww.magnet.co.uk%2Fglobalassets%2Fshowrooms%2Fleeds%2Fkitchen-display-1.jpg",
          style: "Modern",
          isPrimary: true,
        },
        {
          name: "Cambridge Shaker",
          image:
            "https://asset.nobiadigital.com/fetch/ar_1.4,c_fill,q_auto,w_1600/f_auto/https%3A%2F%2Fwww.magnet.co.uk%2Fglobalassets%2Fshowrooms%2Fleeds%2Fkitchen-display-2.jpg",
          style: "Traditional",
        },
        {
          name: "Oslo Matt Graphite",
          image:
            "https://asset.nobiadigital.com/fetch/ar_1.4,c_fill,q_auto,w_1600/f_auto/https%3A%2F%2Fwww.magnet.co.uk%2Fglobalassets%2Fshowrooms%2Fleeds%2Fkitchen-display-3.jpg",
          style: "Contemporary",
        },
      ],
      openingHours: [
        { day: "Monday", date: "24 Feb", hours: "9:00 AM - 5:30 PM" },
        { day: "Tuesday", date: "25 Feb", hours: "9:00 AM - 5:30 PM" },
        { day: "Wednesday", date: "26 Feb", hours: "9:00 AM - 5:30 PM" },
        { day: "Thursday", date: "27 Feb", hours: "9:00 AM - 7:00 PM" },
        { day: "Friday", date: "28 Feb", hours: "9:00 AM - 5:30 PM" },
        { day: "Saturday", date: "01 Mar", hours: "9:00 AM - 5:00 PM" },
        { day: "Sunday", date: "02 Mar", hours: "Closed" },
      ],
      nearbyStores: ["london-wembley", "leicester", "manchester-trafford"],
    },
    {
      slug: "leicester",
      name: "Lomash Wood Leicester",
      city: "Leicester",
      address: "Unit 12, Meridian Business Park, Braunstone Town",
      postcode: "LE19 1WZ",
      phone: "+441162345678",
      email: "leicester@lomashwood.co.uk",
      latitude: 52.6369,
      longitude: -1.1398,
      image:
        "https://asset.nobiadigital.com/fetch/ar_1.4,c_fill,q_auto,w_1600/f_auto/https%3A%2F%2Fwww.magnet.co.uk%2Fglobalassets%2Fshowrooms%2Fleeds%2F1.jpg",
      openToday: "9:00 AM - 5:30 PM",
      facilities: [
        "Dog friendly",
        "Expert advice",
        "Free design appointments",
        "Free parking",
        "Free WiFi",
        "Kitchens on display",
      ],
      team: [
        { name: "Sarah", role: "Store Manager" },
        { name: "Vikram", role: "Senior Kitchen Designer" },
        { name: "Emma", role: "Kitchen Designer" },
      ],
      kitchensOnDisplay: [
        {
          name: "Milano Handleless Gloss",
          image:
            "https://asset.nobiadigital.com/fetch/ar_1.4,c_fill,q_auto,w_1600/f_auto/https%3A%2F%2Fwww.magnet.co.uk%2Fglobalassets%2Fshowrooms%2Fleeds%2Fkitchen-display-1.jpg",
          style: "Modern",
        },
        {
          name: "Cambridge Shaker",
          image:
            "https://asset.nobiadigital.com/fetch/ar_1.4,c_fill,q_auto,w_1600/f_auto/https%3A%2F%2Fwww.magnet.co.uk%2Fglobalassets%2Fshowrooms%2Fleeds%2Fkitchen-display-2.jpg",
          style: "Traditional",
        },
      ],
      openingHours: [
        { day: "Monday", date: "24 Feb", hours: "9:00 AM - 5:30 PM" },
        { day: "Tuesday", date: "25 Feb", hours: "9:00 AM - 5:30 PM" },
        { day: "Wednesday", date: "26 Feb", hours: "9:00 AM - 5:30 PM" },
        { day: "Thursday", date: "27 Feb", hours: "9:00 AM - 7:00 PM" },
        { day: "Friday", date: "28 Feb", hours: "9:00 AM - 5:30 PM" },
        { day: "Saturday", date: "01 Mar", hours: "9:00 AM - 5:00 PM" },
        { day: "Sunday", date: "02 Mar", hours: "Closed" },
      ],
      nearbyStores: ["birmingham", "london-wembley", "manchester-trafford"],
    },
    {
      slug: "manchester-trafford",
      name: "Lomash Wood Manchester Trafford",
      city: "Manchester Trafford",
      address: "Unit 8, Trafford Retail Park, Chester Road",
      postcode: "M32 0TL",
      phone: "+441612345678",
      email: "manchester@lomashwood.co.uk",
      latitude: 53.4631,
      longitude: -2.2714,
      image:
        "https://asset.nobiadigital.com/fetch/ar_1.4,c_fill,q_auto,w_1600/f_auto/https%3A%2F%2Fwww.magnet.co.uk%2Fglobalassets%2Fshowrooms%2Fleeds%2F8.jpg",
      openToday: "9:00 AM - 6:00 PM",
      facilities: [
        "Dog friendly",
        "Expert advice",
        "Free design appointments",
        "Free parking",
        "Free WiFi",
        "Kitchens on display",
        "Bedrooms on display",
        "Toilets",
      ],
      team: [
        { name: "Tom", role: "Store Manager" },
        { name: "Nina", role: "Senior Kitchen Designer" },
        { name: "Chris", role: "Kitchen Designer" },
        { name: "Lauren", role: "Bedroom Specialist" },
      ],
      kitchensOnDisplay: [
        {
          name: "Milano Handleless Gloss",
          image:
            "https://asset.nobiadigital.com/fetch/ar_1.4,c_fill,q_auto,w_1600/f_auto/https%3A%2F%2Fwww.magnet.co.uk%2Fglobalassets%2Fshowrooms%2Fleeds%2Fkitchen-display-1.jpg",
          style: "Modern",
          isPrimary: true,
        },
        {
          name: "Cambridge Shaker",
          image:
            "https://asset.nobiadigital.com/fetch/ar_1.4,c_fill,q_auto,w_1600/f_auto/https%3A%2F%2Fwww.magnet.co.uk%2Fglobalassets%2Fshowrooms%2Fleeds%2Fkitchen-display-2.jpg",
          style: "Traditional",
        },
        {
          name: "Oslo Matt Graphite",
          image:
            "https://asset.nobiadigital.com/fetch/ar_1.4,c_fill,q_auto,w_1600/f_auto/https%3A%2F%2Fwww.magnet.co.uk%2Fglobalassets%2Fshowrooms%2Fleeds%2Fkitchen-display-3.jpg",
          style: "Contemporary",
        },
      ],
      openingHours: [
        { day: "Monday", date: "24 Feb", hours: "9:00 AM - 6:00 PM" },
        { day: "Tuesday", date: "25 Feb", hours: "9:00 AM - 6:00 PM" },
        { day: "Wednesday", date: "26 Feb", hours: "9:00 AM - 6:00 PM" },
        { day: "Thursday", date: "27 Feb", hours: "9:00 AM - 8:00 PM" },
        { day: "Friday", date: "28 Feb", hours: "9:00 AM - 6:00 PM" },
        { day: "Saturday", date: "01 Mar", hours: "9:00 AM - 5:00 PM" },
        { day: "Sunday", date: "02 Mar", hours: "10:00 AM - 4:00 PM" },
      ],
      nearbyStores: ["birmingham", "leicester", "london-wembley"],
    },
    {
      slug: "leeds",
      name: "Lomash Wood Leeds",
      city: "Leeds",
      address: "Crown Point Retail Park, Junction 3, M621",
      postcode: "LS10 1ET",
      phone: "+441132345678",
      email: "leeds@lomashwood.co.uk",
      latitude: 53.796,
      longitude: -1.5548,
      image:
        "https://asset.nobiadigital.com/fetch/ar_1.4,c_fill,q_auto,w_1600/f_auto/https%3A%2F%2Fwww.magnet.co.uk%2Fglobalassets%2Fshowrooms%2Fleeds%2F9.jpg",
      openToday: "9:00 AM - 5:30 PM",
      facilities: [
        "Expert advice",
        "Free design appointments",
        "Free parking",
        "Free WiFi",
        "Kitchens on display",
        "Toilets",
      ],
      team: [
        { name: "Mark", role: "Store Manager" },
        { name: "Hannah", role: "Kitchen Designer" },
      ],
      kitchensOnDisplay: [
        {
          name: "Cambridge Shaker",
          image:
            "https://asset.nobiadigital.com/fetch/ar_1.4,c_fill,q_auto,w_1600/f_auto/https%3A%2F%2Fwww.magnet.co.uk%2Fglobalassets%2Fshowrooms%2Fleeds%2Fkitchen-display-2.jpg",
          style: "Traditional",
        },
        {
          name: "Oslo Matt Graphite",
          image:
            "https://asset.nobiadigital.com/fetch/ar_1.4,c_fill,q_auto,w_1600/f_auto/https%3A%2F%2Fwww.magnet.co.uk%2Fglobalassets%2Fshowrooms%2Fleeds%2Fkitchen-display-3.jpg",
          style: "Contemporary",
        },
      ],
      openingHours: [
        { day: "Monday", date: "24 Feb", hours: "9:00 AM - 5:30 PM" },
        { day: "Tuesday", date: "25 Feb", hours: "9:00 AM - 5:30 PM" },
        { day: "Wednesday", date: "26 Feb", hours: "9:00 AM - 5:30 PM" },
        { day: "Thursday", date: "27 Feb", hours: "9:00 AM - 7:00 PM" },
        { day: "Friday", date: "28 Feb", hours: "9:00 AM - 5:30 PM" },
        { day: "Saturday", date: "01 Mar", hours: "9:00 AM - 5:00 PM" },
        { day: "Sunday", date: "02 Mar", hours: "Closed" },
      ],
      nearbyStores: ["manchester-trafford", "birmingham", "leicester"],
    },
    {
      slug: "bristol",
      name: "Lomash Wood Bristol",
      city: "Bristol",
      address: "Unit 3, Longwell Green Retail Park",
      postcode: "BS30 7DY",
      phone: "+441173456789",
      email: "bristol@lomashwood.co.uk",
      latitude: 51.4545,
      longitude: -2.5879,
      image:
        "https://asset.nobiadigital.com/fetch/ar_1.4,c_fill,q_auto,w_1600/f_auto/https%3A%2F%2Fwww.magnet.co.uk%2Fglobalassets%2Fshowrooms%2Fbristol%2F1.jpg",
      openToday: "9:00 AM - 5:30 PM",
      facilities: [
        "Dog friendly",
        "Expert advice",
        "Free design appointments",
        "Free parking",
        "Free WiFi",
        "Kitchens on display",
      ],
      team: [
        { name: "Oliver", role: "Store Manager" },
        { name: "Kate", role: "Senior Kitchen Designer" },
        { name: "Daniel", role: "Kitchen Designer" },
      ],
      kitchensOnDisplay: [
        {
          name: "Milano Handleless Gloss",
          image:
            "https://asset.nobiadigital.com/fetch/ar_1.4,c_fill,q_auto,w_1600/f_auto/https%3A%2F%2Fwww.magnet.co.uk%2Fglobalassets%2Fshowrooms%2Fbristol%2Fkitchen-display-1.jpg",
          style: "Modern",
        },
        {
          name: "Cambridge Shaker",
          image:
            "https://asset.nobiadigital.com/fetch/ar_1.4,c_fill,q_auto,w_1600/f_auto/https%3A%2F%2Fwww.magnet.co.uk%2Fglobalassets%2Fshowrooms%2Fbristol%2Fkitchen-display-2.jpg",
          style: "Traditional",
        },
        {
          name: "Oslo Matt Graphite",
          image:
            "https://asset.nobiadigital.com/fetch/ar_1.4,c_fill,q_auto,w_1600/f_auto/https%3A%2F%2Fwww.magnet.co.uk%2Fglobalassets%2Fshowrooms%2Fbristol%2Fkitchen-display-3.jpg",
          style: "Contemporary",
        },
      ],
      openingHours: [
        { day: "Monday", date: "24 Feb", hours: "9:00 AM - 5:30 PM" },
        { day: "Tuesday", date: "25 Feb", hours: "9:00 AM - 5:30 PM" },
        { day: "Wednesday", date: "26 Feb", hours: "9:00 AM - 5:30 PM" },
        { day: "Thursday", date: "27 Feb", hours: "9:00 AM - 7:00 PM" },
        { day: "Friday", date: "28 Feb", hours: "9:00 AM - 5:30 PM" },
        { day: "Saturday", date: "01 Mar", hours: "9:00 AM - 5:00 PM" },
        { day: "Sunday", date: "02 Mar", hours: "10:00 AM - 4:00 PM" },
      ],
      nearbyStores: ["london-wembley", "birmingham", "leicester"],
    },
  ];

  const displayProducts = await prisma.product.findMany({
    where: { category: { in: ["kitchen", "bedroom"] } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
    take: 3,
  });

  const displayRows = displayProducts.map((product, index) => ({
    productId: product.id,
    isPrimary: index === 0,
  }));

  for (const showroom of showrooms) {
    const existing = await prisma.showroom.findUnique({ where: { slug: showroom.slug } });
    const { kitchensOnDisplay: removedKitchensOnDisplay, ...showroomData } = showroom;
    void removedKitchensOnDisplay;

    if (existing) {
      await prisma.showroom.update({
        where: { id: existing.id },
        data: {
          ...showroomData,
          displayProducts: {
            deleteMany: {},
            create: displayRows,
          },
        },
      });
    } else {
      await prisma.showroom.create({
        data: {
          ...showroomData,
          displayProducts: {
            create: displayRows,
          },
        },
      });
    }
  }
}

async function seedCustomersOrdersAppointments() {
  const defaultShowroom = await prisma.showroom.findFirst({
    where: { slug: "london-wembley" },
    select: { id: true, name: true },
  });

  const leedsShowroom = await prisma.showroom.findFirst({
    where: { slug: "leeds" },
    select: { id: true, name: true },
  });

  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { email: "james.thornton@email.com" },
      update: {
        name: "James Thornton",
        phone: "+44 7700 100001",
        postcode: "SW1A 1AA",
        address: "12 Belgrave Square, London",
      },
      create: {
        name: "James Thornton",
        email: "james.thornton@email.com",
        phone: "+44 7700 100001",
        postcode: "SW1A 1AA",
        address: "12 Belgrave Square, London",
        loyaltyTier: "gold",
        loyaltyPoints: 1200,
        totalSpend: 0,
      },
    }),
    prisma.customer.upsert({
      where: { email: "sarah.mitchell@email.com" },
      update: {
        name: "Sarah Mitchell",
        phone: "+44 7700 100002",
        postcode: "M1 1AE",
        address: "44 King Street, Manchester",
      },
      create: {
        name: "Sarah Mitchell",
        email: "sarah.mitchell@email.com",
        phone: "+44 7700 100002",
        postcode: "M1 1AE",
        address: "44 King Street, Manchester",
        loyaltyTier: "silver",
        loyaltyPoints: 450,
        totalSpend: 0,
      },
    }),
  ]);

  const products = await prisma.product.findMany({ take: 2, orderBy: { createdAt: "asc" } });
  if (products.length < 2) return;

  const [productOne, productTwo] = products;
  if (!productOne || !productTwo) return;

  const orderSpecs = [
    { customer: customers[0], product: productOne, orderNumber: "LW-1001", quantity: 1 },
    { customer: customers[1], product: productTwo, orderNumber: "LW-1002", quantity: 1 },
  ];

  for (const spec of orderSpecs) {
    const unitPrice = spec.product.price ?? 0;
    const subtotal = unitPrice * spec.quantity;
    const tax = Number((subtotal * 0.2).toFixed(2));
    const total = subtotal + tax;

    await prisma.order.upsert({
      where: { orderNumber: spec.orderNumber },
      update: {
        customerId: spec.customer.id,
        status: "confirmed",
        subtotal,
        tax,
        total,
        items: {
          deleteMany: {},
          create: [
            {
              productId: spec.product.id,
              productTitle: spec.product.title,
              productCategory: spec.product.category,
              quantity: spec.quantity,
              unitPrice,
              totalPrice: subtotal,
            },
          ],
        },
      },
      create: {
        orderNumber: spec.orderNumber,
        customerId: spec.customer.id,
        status: "confirmed",
        subtotal,
        tax,
        total,
        items: {
          create: [
            {
              productId: spec.product.id,
              productTitle: spec.product.title,
              productCategory: spec.product.category,
              quantity: spec.quantity,
              unitPrice,
              totalPrice: subtotal,
            },
          ],
        },
      },
    });

    await prisma.customer.update({
      where: { id: spec.customer.id },
      data: {
        totalSpend: total,
        orderCount: 1,
      },
    });
  }

  const apptDate1 = new Date();
  apptDate1.setDate(apptDate1.getDate() + 3);
  apptDate1.setHours(10, 0, 0, 0);
  const apptDate2 = new Date();
  apptDate2.setDate(apptDate2.getDate() + 7);
  apptDate2.setHours(14, 0, 0, 0);
  const apptDate3 = new Date();
  apptDate3.setDate(apptDate3.getDate() + 1);
  apptDate3.setHours(9, 0, 0, 0);
  const apptDate4 = new Date();
  apptDate4.setDate(apptDate4.getDate() + 1);
  apptDate4.setHours(11, 0, 0, 0);
  const apptDate5 = new Date();
  apptDate5.setDate(apptDate5.getDate() - 2);
  apptDate5.setHours(15, 0, 0, 0);
  const apptDate6 = new Date();
  apptDate6.setDate(apptDate6.getDate() + 5);
  apptDate6.setHours(13, 0, 0, 0);

  const extraCustomers = await Promise.all([
    prisma.customer.upsert({
      where: { email: "priya.sharma@email.com" },
      update: {
        name: "Priya Sharma",
        phone: "+44 7700 100003",
        postcode: "B15 2TT",
        address: "18 Harborne Road, Birmingham",
      },
      create: {
        name: "Priya Sharma",
        email: "priya.sharma@email.com",
        phone: "+44 7700 100003",
        postcode: "B15 2TT",
        address: "18 Harborne Road, Birmingham",
        loyaltyTier: "bronze",
        loyaltyPoints: 120,
        totalSpend: 0,
      },
    }),
    prisma.customer.upsert({
      where: { email: "emma.lawson@email.com" },
      update: {
        name: "Emma Lawson",
        phone: "+44 7700 100004",
        postcode: "LS1 4AP",
        address: "6 Park Row, Leeds",
      },
      create: {
        name: "Emma Lawson",
        email: "emma.lawson@email.com",
        phone: "+44 7700 100004",
        postcode: "LS1 4AP",
        address: "6 Park Row, Leeds",
        loyaltyTier: "silver",
        loyaltyPoints: 330,
        totalSpend: 0,
      },
    }),
    prisma.customer.upsert({
      where: { email: "daniel.huang@email.com" },
      update: {
        name: "Daniel Huang",
        phone: "+44 7700 100005",
        postcode: "BS1 5AH",
        address: "22 Queen Square, Bristol",
      },
      create: {
        name: "Daniel Huang",
        email: "daniel.huang@email.com",
        phone: "+44 7700 100005",
        postcode: "BS1 5AH",
        address: "22 Queen Square, Bristol",
        loyaltyTier: "bronze",
        loyaltyPoints: 80,
        totalSpend: 0,
      },
    }),
    prisma.customer.upsert({
      where: { email: "aisha.okoye@email.com" },
      update: {
        name: "Aisha Okoye",
        phone: "+44 7700 100006",
        postcode: "W1D 4FA",
        address: "10 Soho Square, London",
      },
      create: {
        name: "Aisha Okoye",
        email: "aisha.okoye@email.com",
        phone: "+44 7700 100006",
        postcode: "W1D 4FA",
        address: "10 Soho Square, London",
        loyaltyTier: "gold",
        loyaltyPoints: 910,
        totalSpend: 0,
      },
    }),
  ]);

  await prisma.appointment.upsert({
    where: {
      id: "seed-appointment-1",
    },
    update: {
      customerId: customers[0].id,
      customerName: customers[0].name,
      customerEmail: customers[0].email,
      customerPhone: customers[0].phone,
      postcode: customers[0].postcode,
      address: customers[0].address,
      showroomId: defaultShowroom?.id,
      showroomName: defaultShowroom?.name,
      consultantName: "Sarah Alderton",
      slot: apptDate1,
      status: "confirmed",
    },
    create: {
      id: "seed-appointment-1",
      type: "showroom",
      forKitchen: true,
      forBedroom: false,
      customerId: customers[0].id,
      customerName: customers[0].name,
      customerEmail: customers[0].email,
      customerPhone: customers[0].phone,
      postcode: customers[0].postcode,
      address: customers[0].address,
      showroomId: defaultShowroom?.id,
      showroomName: defaultShowroom?.name,
      consultantName: "Sarah Alderton",
      slot: apptDate1,
      status: "confirmed",
      notes: "Requested in-person design consultation",
    },
  });

  await prisma.appointment.upsert({
    where: {
      id: "seed-appointment-2",
    },
    update: {
      customerId: customers[1].id,
      customerName: customers[1].name,
      customerEmail: customers[1].email,
      customerPhone: customers[1].phone,
      postcode: customers[1].postcode,
      address: customers[1].address,
      consultantName: "Marcus Webb",
      slot: apptDate2,
      status: "pending",
    },
    create: {
      id: "seed-appointment-2",
      type: "online",
      forKitchen: false,
      forBedroom: true,
      customerId: customers[1].id,
      customerName: customers[1].name,
      customerEmail: customers[1].email,
      customerPhone: customers[1].phone,
      postcode: customers[1].postcode,
      address: customers[1].address,
      consultantName: "Marcus Webb",
      slot: apptDate2,
      status: "pending",
      notes: "Requested virtual wardrobe planning",
    },
  });

  const seededAppointments = [
    {
      id: "seed-appointment-3",
      customer: extraCustomers[0],
      type: "home" as const,
      forKitchen: true,
      forBedroom: false,
      slot: apptDate3,
      status: "confirmed" as const,
      consultantName: "Jade Nguyen",
      notes: "Needs full kitchen remeasure before quote.",
    },
    {
      id: "seed-appointment-4",
      customer: extraCustomers[1],
      type: "showroom" as const,
      forKitchen: false,
      forBedroom: true,
      slot: apptDate4,
      status: "pending" as const,
      consultantName: "Marcus Webb",
      showroomId: leedsShowroom?.id,
      showroomName: leedsShowroom?.name,
      notes: "Wardrobe layout review and finish samples.",
    },
    {
      id: "seed-appointment-5",
      customer: extraCustomers[2],
      type: "online" as const,
      forKitchen: true,
      forBedroom: true,
      slot: apptDate5,
      status: "completed" as const,
      consultantName: "Sarah Alderton",
      notes: "Discussed combined kitchen and bedroom renovation scope.",
    },
    {
      id: "seed-appointment-6",
      customer: extraCustomers[3],
      type: "showroom" as const,
      forKitchen: true,
      forBedroom: false,
      slot: apptDate6,
      status: "no_show" as const,
      consultantName: "Jade Nguyen",
      showroomId: defaultShowroom?.id,
      showroomName: defaultShowroom?.name,
      notes: "Customer did not arrive for scheduled consultation.",
    },
  ];

  for (const item of seededAppointments) {
    await prisma.appointment.upsert({
      where: { id: item.id },
      update: {
        customerId: item.customer.id,
        customerName: item.customer.name,
        customerEmail: item.customer.email,
        customerPhone: item.customer.phone,
        postcode: item.customer.postcode,
        address: item.customer.address,
        showroomId: item.showroomId,
        showroomName: item.showroomName,
        consultantName: item.consultantName,
        slot: item.slot,
        status: item.status,
        notes: item.notes,
      },
      create: {
        id: item.id,
        type: item.type,
        forKitchen: item.forKitchen,
        forBedroom: item.forBedroom,
        customerId: item.customer.id,
        customerName: item.customer.name,
        customerEmail: item.customer.email,
        customerPhone: item.customer.phone,
        postcode: item.customer.postcode,
        address: item.customer.address,
        showroomId: item.showroomId,
        showroomName: item.showroomName,
        consultantName: item.consultantName,
        slot: item.slot,
        status: item.status,
        notes: item.notes,
      },
    });
  }

  const availabilityRows = [
    { date: apptDate1, slots: ["10:00", "11:00", "14:00"], isBlocked: false },
    { date: apptDate2, slots: ["14:00", "15:00"], isBlocked: false },
    { date: apptDate3, slots: ["09:00", "11:00", "13:00"], isBlocked: false },
    { date: apptDate4, slots: [], isBlocked: true },
  ];

  for (const item of availabilityRows) {
    const dateOnly = new Date(
      Date.UTC(item.date.getFullYear(), item.date.getMonth(), item.date.getDate()),
    );
    await prisma.availability.upsert({
      where: {
        consultantId_date: {
          consultantId: "global",
          date: dateOnly,
        },
      },
      update: {
        slots: item.slots,
        isBlocked: item.isBlocked,
      },
      create: {
        consultantId: "global",
        date: dateOnly,
        slots: item.slots,
        isBlocked: item.isBlocked,
      },
    });
  }

  const allSeedCustomers = [...customers, ...extraCustomers];
  for (const customer of allSeedCustomers) {
    const appointmentCount = await prisma.appointment.count({ where: { customerId: customer.id } });
    await prisma.customer.update({ where: { id: customer.id }, data: { appointmentCount } });
  }
}

async function seedBrochures() {
  const brochureSeeds = [
    {
      title: "Lomashwood Kitchen Collection 2026",
      slug: "kitchen-collection-2026",
      description: "Explore modern and classic kitchen ranges, finishes, and design inspiration.",
      coverImage:
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1400&q=80",
      pdfUrl: "https://example-brochures.s3.amazonaws.com/kitchen-collection-2026.pdf",
      category: "kitchen",
      tags: ["kitchen", "modern", "handleless"],
      pages: 64,
      sizeMb: 18.4,
      year: 2026,
      isFeatured: true,
      isPublished: true,
      sortOrder: 1,
    },
    {
      title: "Lomashwood Bedroom Collection 2026",
      slug: "bedroom-collection-2026",
      description: "Wardrobes, fitted storage, and elegant bedroom styles for every home.",
      coverImage:
        "https://images.unsplash.com/photo-1616594039964-3d132b6c1fbc?auto=format&fit=crop&w=1400&q=80",
      pdfUrl: "https://example-brochures.s3.amazonaws.com/bedroom-collection-2026.pdf",
      category: "bedroom",
      tags: ["bedroom", "wardrobe", "storage"],
      pages: 52,
      sizeMb: 15.9,
      year: 2026,
      isFeatured: true,
      isPublished: true,
      sortOrder: 2,
    },
    {
      title: "Design & Finishes Guide",
      slug: "design-finishes-guide",
      description: "A practical guide to colours, materials, and finishes across our full range.",
      coverImage:
        "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=1400&q=80",
      pdfUrl: "https://example-brochures.s3.amazonaws.com/design-finishes-guide.pdf",
      category: "inspiration",
      tags: ["finishes", "materials", "inspiration"],
      pages: 36,
      sizeMb: 10.2,
      year: 2025,
      isFeatured: false,
      isPublished: true,
      sortOrder: 3,
    },
  ];

  const seededBrochures = [] as Array<{ id: string; title: string }>;
  for (const brochure of brochureSeeds) {
    const saved = await prisma.brochure.upsert({
      where: { slug: brochure.slug },
      update: brochure,
      create: brochure,
    });
    seededBrochures.push({ id: saved.id, title: saved.title });
  }

  await prisma.brochureRequest.upsert({
    where: { id: "seed-brochure-request-1" },
    update: {
      firstName: "Oliver",
      lastName: "Grant",
      email: "oliver.grant@email.com",
      phone: "+44 7700 200001",
      postcode: "SW1A 1AA",
      address: "14 Buckingham Gate, London",
      deliveryMethod: "download",
      marketingOptIn: true,
      brochureIds: seededBrochures.slice(0, 2).map((item) => item.id),
      brochureTitles: seededBrochures.slice(0, 2).map((item) => item.title),
      notes: "Interested in a full kitchen and bedroom renovation.",
      brochures: {
        set: seededBrochures.slice(0, 2).map((item) => ({ id: item.id })),
      },
    },
    create: {
      id: "seed-brochure-request-1",
      firstName: "Oliver",
      lastName: "Grant",
      email: "oliver.grant@email.com",
      phone: "+44 7700 200001",
      postcode: "SW1A 1AA",
      address: "14 Buckingham Gate, London",
      deliveryMethod: "download",
      marketingOptIn: true,
      brochureIds: seededBrochures.slice(0, 2).map((item) => item.id),
      brochureTitles: seededBrochures.slice(0, 2).map((item) => item.title),
      notes: "Interested in a full kitchen and bedroom renovation.",
      brochures: {
        connect: seededBrochures.slice(0, 2).map((item) => ({ id: item.id })),
      },
    },
  });

  await prisma.brochureRequest.upsert({
    where: { id: "seed-brochure-request-2" },
    update: {
      firstName: "Sophie",
      lastName: "Bennett",
      email: "sophie.bennett@email.com",
      phone: "+44 7700 200002",
      postcode: "M2 5DB",
      address: "22 King Street, Manchester",
      deliveryMethod: "post",
      marketingOptIn: false,
      brochureIds: seededBrochures.slice(1).map((item) => item.id),
      brochureTitles: seededBrochures.slice(1).map((item) => item.title),
      notes: "Please post printed brochures to my home address.",
      brochures: {
        set: seededBrochures.slice(1).map((item) => ({ id: item.id })),
      },
    },
    create: {
      id: "seed-brochure-request-2",
      firstName: "Sophie",
      lastName: "Bennett",
      email: "sophie.bennett@email.com",
      phone: "+44 7700 200002",
      postcode: "M2 5DB",
      address: "22 King Street, Manchester",
      deliveryMethod: "post",
      marketingOptIn: false,
      brochureIds: seededBrochures.slice(1).map((item) => item.id),
      brochureTitles: seededBrochures.slice(1).map((item) => item.title),
      notes: "Please post printed brochures to my home address.",
      brochures: {
        connect: seededBrochures.slice(1).map((item) => ({ id: item.id })),
      },
    },
  });
}

async function main() {
  console.log("Seeding started...");

  await seedAdmin();
  await seedCatalog();
  await seedProductOptions();
  await seedShowrooms();
  await seedCustomersOrdersAppointments();
  await seedBrochures();

  console.log("Seeding completed successfully.");
  console.log("Admin login: admin@lomashwood.com / admin12345");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
