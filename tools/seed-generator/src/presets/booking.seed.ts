import { PrismaClient } from "@prisma/client";
import { fakerEN as faker } from "../faker.config";
import {
  UK_POSTCODES,
  UK_CITIES,
  APPOINTMENT_TYPES,
  randomItem,
  randomInt,
  randomBoolean,
  randomFutureDate,
  randomPastDate,
} from "../faker.config";
import { generateId } from "../generate";

const prisma = new PrismaClient();

type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

function generateUKPhone(): string {
  const prefixes = ["07700", "07800", "07900", "07400", "07500"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 900000 + 100000);
  return `${prefix} ${number}`;
}

function generateTimeSlot(): string {
  const hours = randomItem([9, 9, 10, 10, 11, 12, 13, 14, 14, 15, 16]);
  const minutes = randomItem(["00", "30"]);
  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

async function seedAppointments(): Promise<void> {
  const users = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: { id: true },
    take: 30,
  });

  const showrooms = await prisma.showroom.findMany({
    select: { id: true, name: true },
  });

  if (showrooms.length === 0) {
    console.log("No showrooms found. Run main seed first.");
    return;
  }

  const statuses: AppointmentStatus[] = [
    "PENDING",
    "CONFIRMED",
    "CONFIRMED",
    "COMPLETED",
    "COMPLETED",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
  ];

  const appointmentCount = 60;
  console.log(`Creating ${appointmentCount} appointments...`);

  for (let i = 0; i < appointmentCount; i++) {
    const appointmentType = randomItem(APPOINTMENT_TYPES);
    const status = randomItem(statuses);
    const isForKitchen = randomBoolean(0.7);
    const isForBedroom = randomBoolean(0.6);
    const forKitchen = isForKitchen || (!isForKitchen && !isForBedroom);
    const forBedroom = isForBedroom || (!isForKitchen && !isForBedroom);

    const isPast = randomBoolean(0.6);
    const appointmentDate = isPast ? randomPastDate(90) : randomFutureDate(60);
    const timeSlot = generateTimeSlot();

    const userId = users.length > 0 && randomBoolean(0.7) ? randomItem(users).id : null;
    const showroomId = appointmentType === "SHOWROOM" ? randomItem(showrooms).id : null;

    const city = randomItem(UK_CITIES);
    const postcode = randomItem(UK_POSTCODES);

    await prisma.appointment.create({
      data: {
        id: generateId(),
        userId,
        appointmentType,
        forKitchen,
        forBedroom,
        status,
        appointmentDate,
        timeSlot,
        showroomId,
        customerName: faker.person.fullName(),
        customerEmail: faker.internet.email(),
        customerPhone: generateUKPhone(),
        customerPostcode: postcode,
        customerAddress: `${faker.location.streetAddress()}, ${city}, ${postcode}`,
        notes: randomBoolean(0.3) ? faker.lorem.sentence() : null,
        reminderSent: isPast && status !== "PENDING",
        confirmationSent: status !== "PENDING",
        createdAt: randomPastDate(120),
        updatedAt: new Date(),
      },
    });

    if ((i + 1) % 20 === 0) {
      console.log(`  Created ${i + 1}/${appointmentCount} appointments`);
    }
  }

  const total = await prisma.appointment.count();
  console.log(`✓ Seeded ${total} appointments`);
}

async function seedBrochureRequests(): Promise<void> {
  const count = 30;
  console.log(`Creating ${count} brochure requests...`);

  for (let i = 0; i < count; i++) {
    const city = randomItem(UK_CITIES);
    const postcode = randomItem(UK_POSTCODES);

    await prisma.brochureRequest.create({
      data: {
        id: generateId(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: `07${randomInt(700, 999)} ${randomInt(100000, 999999)}`,
        postcode,
        address: `${faker.location.streetAddress()}, ${city}, ${postcode}`,
        isProcessed: randomBoolean(0.6),
        createdAt: randomPastDate(180),
        updatedAt: new Date(),
      },
    });
  }

  const total = await prisma.brochureRequest.count();
  console.log(`✓ Seeded ${total} brochure requests`);
}

async function seedBusinessInquiries(): Promise<void> {
  const businessTypes = [
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

  const count = 20;
  console.log(`Creating ${count} business inquiries...`);

  for (let i = 0; i < count; i++) {
    await prisma.businessInquiry.create({
      data: {
        id: generateId(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: `07${randomInt(700, 999)} ${randomInt(100000, 999999)}`,
        businessType: randomItem(businessTypes),
        message: randomBoolean(0.5) ? faker.lorem.paragraph() : null,
        isContacted: randomBoolean(0.4),
        createdAt: randomPastDate(180),
        updatedAt: new Date(),
      },
    });
  }

  const total = await prisma.businessInquiry.count();
  console.log(`✓ Seeded ${total} business inquiries`);
}

async function seedNewsletterSubscriptions(): Promise<void> {
  const count = 80;
  console.log(`Creating ${count} newsletter subscriptions...`);

  for (let i = 0; i < count; i++) {
    try {
      await prisma.newsletterSubscription.create({
        data: {
          id: generateId(),
          email: faker.internet.email(),
          isActive: randomBoolean(0.85),
          subscribedAt: randomPastDate(365),
          unsubscribedAt: null,
          createdAt: randomPastDate(365),
          updatedAt: new Date(),
        },
      });
    } catch {
      // Skip duplicate emails
    }
  }

  const total = await prisma.newsletterSubscription.count();
  console.log(`✓ Seeded ${total} newsletter subscriptions`);
}

async function main(): Promise<void> {
  console.log("Seeding booking data...");

  await seedAppointments();
  await seedBrochureRequests();
  await seedBusinessInquiries();
  await seedNewsletterSubscriptions();

  console.log("\n✓ Booking seeding complete");
}

main()
  .catch((error) => {
    console.error("Booking seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });