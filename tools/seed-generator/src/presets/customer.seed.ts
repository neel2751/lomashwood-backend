import { PrismaClient } from "@prisma/client";
import { fakerEN as faker } from "../faker.config";
import {
  UK_POSTCODES,
  UK_CITIES,
  randomItem,
  randomBoolean,
  randomPastDate,
} from "../faker.config";
import { generateId } from "../generate";

const prisma = new PrismaClient();

async function seedShowrooms(): Promise<void> {
  const showrooms = [
    {
      name: "Lomash Wood London Clapham",
      address: "42 High Street, Clapham, London, SW4 7UR",
      email: "clapham@lomashwood.co.uk",
      phone: "020 7946 0001",
      openingHours: "Mon-Sat: 9am-6pm, Sun: 10am-4pm",
      mapLink: "https://maps.google.com/?q=42+High+Street+Clapham+London",
      imageUrl: "https://cdn.lomashwood.co.uk/showrooms/clapham.jpg",
      isActive: true,
    },
    {
      name: "Lomash Wood Manchester Deansgate",
      address: "15 Deansgate, Manchester, M3 4LQ",
      email: "manchester@lomashwood.co.uk",
      phone: "0161 946 0002",
      openingHours: "Mon-Sat: 9am-6pm, Sun: 10am-4pm",
      mapLink: "https://maps.google.com/?q=15+Deansgate+Manchester",
      imageUrl: "https://cdn.lomashwood.co.uk/showrooms/manchester.jpg",
      isActive: true,
    },
    {
      name: "Lomash Wood Birmingham Broad Street",
      address: "88 Broad Street, Birmingham, B15 1AU",
      email: "birmingham@lomashwood.co.uk",
      phone: "0121 946 0003",
      openingHours: "Mon-Sat: 9am-6pm, Sun: 11am-4pm",
      mapLink: "https://maps.google.com/?q=88+Broad+Street+Birmingham",
      imageUrl: "https://cdn.lomashwood.co.uk/showrooms/birmingham.jpg",
      isActive: true,
    },
    {
      name: "Lomash Wood Leeds Headrow",
      address: "22 The Headrow, Leeds, LS1 6PT",
      email: "leeds@lomashwood.co.uk",
      phone: "0113 946 0004",
      openingHours: "Mon-Sat: 9am-6pm, Sun: 10am-5pm",
      mapLink: "https://maps.google.com/?q=22+The+Headrow+Leeds",
      imageUrl: "https://cdn.lomashwood.co.uk/showrooms/leeds.jpg",
      isActive: true,
    },
    {
      name: "Lomash Wood Bristol Clifton",
      address: "7 Clifton Down, Bristol, BS8 3HT",
      email: "bristol@lomashwood.co.uk",
      phone: "0117 946 0005",
      openingHours: "Mon-Sat: 9am-5:30pm, Sun: 11am-4pm",
      mapLink: "https://maps.google.com/?q=7+Clifton+Down+Bristol",
      imageUrl: "https://cdn.lomashwood.co.uk/showrooms/bristol.jpg",
      isActive: true,
    },
    {
      name: "Lomash Wood Liverpool",
      address: "55 Bold Street, Liverpool, L1 4EU",
      email: "liverpool@lomashwood.co.uk",
      phone: "0151 946 0006",
      openingHours: "Mon-Sat: 9am-6pm, Sun: 11am-5pm",
      mapLink: "https://maps.google.com/?q=55+Bold+Street+Liverpool",
      imageUrl: "https://cdn.lomashwood.co.uk/showrooms/liverpool.jpg",
      isActive: true,
    },
    {
      name: "Lomash Wood Edinburgh",
      address: "33 Princes Street, Edinburgh, EH2 2BY",
      email: "edinburgh@lomashwood.co.uk",
      phone: "0131 946 0007",
      openingHours: "Mon-Sat: 9am-6pm, Sun: 12pm-5pm",
      mapLink: "https://maps.google.com/?q=33+Princes+Street+Edinburgh",
      imageUrl: "https://cdn.lomashwood.co.uk/showrooms/edinburgh.jpg",
      isActive: true,
    },
    {
      name: "Lomash Wood Sheffield",
      address: "18 Fargate, Sheffield, S1 2HH",
      email: "sheffield@lomashwood.co.uk",
      phone: "0114 946 0008",
      openingHours: "Mon-Sat: 9am-5:30pm, Sun: 11am-4pm",
      mapLink: "https://maps.google.com/?q=18+Fargate+Sheffield",
      imageUrl: "https://cdn.lomashwood.co.uk/showrooms/sheffield.jpg",
      isActive: true,
    },
    {
      name: "Lomash Wood Nottingham",
      address: "44 Upper Parliament Street, Nottingham, NG1 2AG",
      email: "nottingham@lomashwood.co.uk",
      phone: "0115 946 0009",
      openingHours: "Mon-Sat: 9am-6pm, Sun: 11am-4pm",
      mapLink: "https://maps.google.com/?q=44+Upper+Parliament+Street+Nottingham",
      imageUrl: "https://cdn.lomashwood.co.uk/showrooms/nottingham.jpg",
      isActive: false,
    },
    {
      name: "Lomash Wood Cardiff",
      address: "12 St Mary Street, Cardiff, CF10 1AT",
      email: "cardiff@lomashwood.co.uk",
      phone: "029 2046 0010",
      openingHours: "Mon-Sat: 9am-6pm, Sun: 11am-5pm",
      mapLink: "https://maps.google.com/?q=12+St+Mary+Street+Cardiff",
      imageUrl: "https://cdn.lomashwood.co.uk/showrooms/cardiff.jpg",
      isActive: true,
    },
  ];

  for (const showroom of showrooms) {
    await prisma.showroom.upsert({
      where: { email: showroom.email },
      update: { isActive: showroom.isActive },
      create: {
        id: generateId(),
        ...showroom,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  const total = await prisma.showroom.count();
  console.log(`✓ Seeded ${total} showrooms`);
}

async function seedCustomerProfiles(): Promise<void> {
  const users = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: { id: true, name: true, email: true },
  });

  if (users.length === 0) {
    console.log("No customer users found. Run auth seed first.");
    return;
  }

  let profileCount = 0;

  for (const user of users) {
    const hasProfile = randomBoolean(0.8);
    if (!hasProfile) continue;

    const city = randomItem(UK_CITIES);
    const postcode = randomItem(UK_POSTCODES);

    try {
      await prisma.customerProfile.create({
        data: {
          id: generateId(),
          userId: user.id,
          phone: `07${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 900000 + 100000)}`,
          address: faker.location.streetAddress(),
          city,
          postcode,
          county: faker.location.county(),
          country: "GB",
          preferredContactMethod: randomItem(["EMAIL", "PHONE", "ANY"]),
          marketingOptIn: randomBoolean(0.6),
          smsOptIn: randomBoolean(0.4),
          interestedIn: randomItem(["KITCHEN", "BEDROOM", "BOTH"]),
          notes: randomBoolean(0.2) ? faker.lorem.sentence() : null,
          createdAt: randomPastDate(365),
          updatedAt: new Date(),
        },
      });
      profileCount++;
    } catch {
      // Profile already exists
    }
  }

  console.log(`✓ Seeded ${profileCount} customer profiles`);
}

async function seedFAQs(): Promise<void> {
  const faqs = [
    {
      question: "How long does a kitchen installation take?",
      answer: "A standard kitchen installation typically takes 5–10 working days, depending on the complexity of the design and any building work required. Our project manager will provide a detailed timeline before work begins.",
      category: "Installation",
      sortOrder: 1,
      isPublished: true,
    },
    {
      question: "Do you offer a guarantee on your kitchens and bedrooms?",
      answer: "Yes, all Lomash Wood kitchens and bedrooms come with a comprehensive 10-year manufacturer's guarantee on cabinet frames and doors, plus a 2-year guarantee on appliances. Our installation work carries a 1-year guarantee.",
      category: "Guarantee",
      sortOrder: 2,
      isPublished: true,
    },
    {
      question: "Can I see the products in person before ordering?",
      answer: "Absolutely. We have showrooms across the UK where you can view our full range of kitchens and bedrooms. You can book a free design consultation at your nearest showroom.",
      category: "Showroom",
      sortOrder: 3,
      isPublished: true,
    },
    {
      question: "Do you offer finance options?",
      answer: "Yes, we offer a range of flexible finance options including 0% interest-free credit, buy now pay later, and low APR finance. Apply in-store or contact our team to discuss your options.",
      category: "Finance",
      sortOrder: 4,
      isPublished: true,
    },
    {
      question: "What is included in the free design consultation?",
      answer: "Your free design consultation includes a full assessment of your space, a 3D CAD design of your new kitchen or bedroom, a detailed quote, and expert advice from one of our qualified designers.",
      category: "Design",
      sortOrder: 5,
      isPublished: true,
    },
    {
      question: "How do I book a home measurement appointment?",
      answer: "You can book a home measurement appointment online through our website, by calling your nearest showroom, or by visiting us in store. Home visits are available 7 days a week.",
      category: "Booking",
      sortOrder: 6,
      isPublished: true,
    },
    {
      question: "Can I supply my own appliances?",
      answer: "Yes, we can accommodate customer-supplied appliances. However, please note that our installation guarantee does not cover appliances not supplied by Lomash Wood.",
      category: "Installation",
      sortOrder: 7,
      isPublished: true,
    },
    {
      question: "Do you handle the full installation including plumbing and electrics?",
      answer: "Yes, we offer a complete turnkey installation service including all plumbing, electrical work, plastering, tiling, and decorating. We use fully qualified and insured tradespeople.",
      category: "Installation",
      sortOrder: 8,
      isPublished: true,
    },
  ];

  for (const faq of faqs) {
    await prisma.fAQ.create({
      data: {
        id: generateId(),
        ...faq,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  console.log(`✓ Seeded ${faqs.length} FAQs`);
}

async function seedAccreditations(): Promise<void> {
  const accreditations = [
    {
      name: "Which? Trusted Trader",
      imageUrl: "https://cdn.lomashwood.co.uk/accreditations/which-trusted-trader.png",
      link: "https://trustedtraders.which.co.uk",
      sortOrder: 1,
      isActive: true,
    },
    {
      name: "Real Homes Award Winner",
      imageUrl: "https://cdn.lomashwood.co.uk/accreditations/real-homes-award.png",
      link: "https://www.realhomes.com",
      sortOrder: 2,
      isActive: true,
    },
    {
      name: "Checkatrade Verified",
      imageUrl: "https://cdn.lomashwood.co.uk/accreditations/checkatrade.png",
      link: "https://www.checkatrade.com",
      sortOrder: 3,
      isActive: true,
    },
    {
      name: "FIRA Gold Certified",
      imageUrl: "https://cdn.lomashwood.co.uk/accreditations/fira-gold.png",
      link: "https://www.fira.co.uk",
      sortOrder: 4,
      isActive: true,
    },
    {
      name: "Made in Britain",
      imageUrl: "https://cdn.lomashwood.co.uk/accreditations/made-in-britain.png",
      link: "https://www.madeinbritain.org",
      sortOrder: 5,
      isActive: true,
    },
  ];

  for (const accreditation of accreditations) {
    await prisma.accreditation.create({
      data: {
        id: generateId(),
        ...accreditation,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  console.log(`✓ Seeded ${accreditations.length} accreditations`);
}

async function main(): Promise<void> {
  console.log("Seeding customer data...");

  await seedShowrooms();
  await seedCustomerProfiles();
  await seedFAQs();
  await seedAccreditations();

  console.log("\n✓ Customer seeding complete");
}

main()
  .catch((error) => {
    console.error("Customer seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });