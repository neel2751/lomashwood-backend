import { PrismaClient } from "@prisma/client";
import { fakerEN as faker } from "../faker.config";
import { generateId, generateTimestamps } from "../generate";

const prisma = new PrismaClient();

type UserRole = "ADMIN" | "STAFF" | "CUSTOMER";

interface SeedUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  emailVerified: boolean;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import("bcrypt");
  return bcrypt.hash(password, 10);
}

function generateUKPhone(): string {
  const prefixes = ["07700", "07800", "07900", "07400", "07500", "07600"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 900000 + 100000);
  return `${prefix} ${number}`;
}

async function generateUsers(count: number): Promise<SeedUser[]> {
  const defaultPassword = await hashPassword("Test@1234!");
  const users: SeedUser[] = [];

  const adminUser: SeedUser = {
    id: generateId(),
    email: "admin@lomashwood.co.uk",
    name: "Lomash Wood Admin",
    passwordHash: await hashPassword("Admin@LomashWood2024!"),
    role: "ADMIN",
    emailVerified: true,
    phone: "020 7946 0000",
    ...generateTimestamps(),
  };

  const staffUser: SeedUser = {
    id: generateId(),
    email: "staff@lomashwood.co.uk",
    name: "Lomash Wood Staff",
    passwordHash: await hashPassword("Staff@LomashWood2024!"),
    role: "STAFF",
    emailVerified: true,
    phone: "020 7946 0001",
    ...generateTimestamps(),
  };

  users.push(adminUser, staffUser);

  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    users.push({
      id: generateId(),
      email: faker.internet.email({ firstName, lastName, provider: "example.com" }),
      name: `${firstName} ${lastName}`,
      passwordHash: defaultPassword,
      role: "CUSTOMER",
      emailVerified: faker.datatype.boolean({ probability: 0.8 }),
      phone: Math.random() > 0.3 ? generateUKPhone() : null,
      ...generateTimestamps(),
    });
  }

  return users;
}

async function generateSessions(users: SeedUser[]): Promise<void> {
  const customers = users.filter((u) => u.role === "CUSTOMER").slice(0, 20);

  for (const user of customers) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        id: generateId(),
        userId: user.id,
        token: faker.string.alphanumeric(64),
        expiresAt,
        userAgent: faker.internet.userAgent(),
        ipAddress: faker.internet.ip(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}

async function main(): Promise<void> {
  console.log("Seeding auth data...");

  const existingCount = await prisma.user.count();
  if (existingCount > 0) {
    console.log("Users already seeded, skipping...");
    return;
  }

  const users = await generateUsers(50);

  console.log(`Creating ${users.length} users...`);

  for (const user of users) {
    await prisma.user.create({ data: user });
  }

  await generateSessions(users);

  console.log(`✓ Created ${users.length} users`);
  console.log("✓ Created sessions for active users");
  console.log("\nAdmin credentials:");
  console.log("  Email: admin@lomashwood.co.uk");
  console.log("  Password: Admin@LomashWood2024!");
  console.log("\nStaff credentials:");
  console.log("  Email: staff@lomashwood.co.uk");
  console.log("  Password: Staff@LomashWood2024!");
}

main()
  .catch((error) => {
    console.error("Auth seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });