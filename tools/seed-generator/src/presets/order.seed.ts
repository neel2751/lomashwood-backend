import { PrismaClient } from "@prisma/client";
import { fakerEN as faker } from "../faker.config";
import {
  UK_POSTCODES,
  UK_CITIES,
  randomItem,
  randomInt,
  randomPrice,
  randomBoolean,
  randomPastDate,
} from "../faker.config";
import { generateId, generateTimestamps } from "../generate";

const prisma = new PrismaClient();

type OrderStatus = "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "REFUNDED";
type PaymentStatus = "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "REFUNDED" | "CANCELLED";
type PaymentMethod = "STRIPE" | "BANK_TRANSFER" | "FINANCE";

function generateOrderReference(): string {
  const prefix = "LW";
  const year = new Date().getFullYear();
  const number = randomInt(10000, 99999);
  return `${prefix}-${year}-${number}`;
}

function generateStripePaymentIntentId(): string {
  return `pi_${faker.string.alphanumeric(24)}`;
}

function generateStripeChargeId(): string {
  return `ch_${faker.string.alphanumeric(24)}`;
}

function buildDeliveryAddress(): object {
  const city = randomItem(UK_CITIES);
  const postcode = randomItem(UK_POSTCODES);
  return {
    line1: faker.location.streetAddress(),
    line2: randomBoolean(0.3) ? faker.location.secondaryAddress() : null,
    city,
    county: faker.location.county(),
    postcode,
    country: "GB",
  };
}

async function seedOrders(): Promise<void> {
  const users = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: { id: true, email: true, name: true },
    take: 40,
  });

  const products = await prisma.product.findMany({
    select: { id: true, title: true, basePrice: true },
    take: 50,
  });

  if (users.length === 0 || products.length === 0) {
    console.log("No users or products found. Run auth and product seeds first.");
    return;
  }

  const orderStatuses: OrderStatus[] = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
  const paymentMethods: PaymentMethod[] = ["STRIPE", "STRIPE", "STRIPE", "BANK_TRANSFER", "FINANCE"];

  const orderCount = 80;
  console.log(`Creating ${orderCount} orders...`);

  for (let i = 0; i < orderCount; i++) {
    const user = randomItem(users);
    const orderStatus = randomItem(orderStatuses);
    const paymentMethod = randomItem(paymentMethods);
    const selectedProducts = products.slice(0, randomInt(1, 3));

    const items = selectedProducts.map((product) => ({
      id: generateId(),
      productId: product.id,
      productTitle: product.title,
      quantity: randomInt(1, 1),
      unitPrice: product.basePrice,
      totalPrice: product.basePrice,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const vatAmount = parseFloat((subtotal * 0.2).toFixed(2));
    const deliveryAmount = subtotal > 10000 ? 0 : 495;
    const totalAmount = parseFloat((subtotal + vatAmount + deliveryAmount).toFixed(2));

    const depositPercent = randomItem([0, 10, 25, 50]);
    const depositAmount = depositPercent > 0 ? parseFloat((totalAmount * (depositPercent / 100)).toFixed(2)) : 0;
    const balanceDue = parseFloat((totalAmount - depositAmount).toFixed(2));

    const isCompleted = orderStatus === "COMPLETED";
    const isCancelled = orderStatus === "CANCELLED";

    let paymentStatus: PaymentStatus = "PENDING";
    if (isCompleted) paymentStatus = "SUCCEEDED";
    else if (isCancelled) paymentStatus = randomBoolean(0.5) ? "CANCELLED" : "REFUNDED";
    else if (orderStatus === "CONFIRMED" || orderStatus === "IN_PROGRESS") paymentStatus = "SUCCEEDED";

    const createdAt = randomPastDate(365);

    const order = await prisma.order.create({
      data: {
        id: generateId(),
        orderReference: generateOrderReference(),
        userId: user.id,
        status: orderStatus,
        subtotal,
        vatAmount,
        deliveryAmount,
        totalAmount,
        depositAmount,
        balanceDue,
        paymentMethod,
        paymentStatus,
        notes: randomBoolean(0.3) ? faker.lorem.sentence() : null,
        deliveryAddress: buildDeliveryAddress(),
        items: {
          create: items,
        },
        createdAt,
        updatedAt: createdAt,
      },
    });

    if (paymentStatus === "SUCCEEDED" || paymentStatus === "REFUNDED") {
      const stripePaymentIntentId = paymentMethod === "STRIPE" ? generateStripePaymentIntentId() : null;
      const stripeChargeId = paymentMethod === "STRIPE" && paymentStatus === "SUCCEEDED" ? generateStripeChargeId() : null;

      await prisma.paymentTransaction.create({
        data: {
          id: generateId(),
          orderId: order.id,
          userId: user.id,
          amount: paymentStatus === "REFUNDED" ? depositAmount || totalAmount : totalAmount,
          currency: "GBP",
          status: paymentStatus,
          paymentMethod,
          stripePaymentIntentId,
          stripeChargeId,
          description: `Payment for order ${order.orderReference}`,
          metadata: {
            orderReference: order.orderReference,
            customerEmail: user.email,
          },
          processedAt: paymentStatus === "SUCCEEDED" ? new Date(createdAt.getTime() + randomInt(60000, 600000)) : null,
          createdAt,
          updatedAt: createdAt,
        },
      });
    }

    if ((i + 1) % 20 === 0) {
      console.log(`  Created ${i + 1}/${orderCount} orders`);
    }
  }

  const totalOrders = await prisma.order.count();
  const totalTransactions = await prisma.paymentTransaction.count();
  console.log(`✓ Seeded ${totalOrders} orders`);
  console.log(`✓ Seeded ${totalTransactions} payment transactions`);
}

async function main(): Promise<void> {
  console.log("Seeding order data...");
  await seedOrders();
  console.log("\n✓ Order seeding complete");
}

main()
  .catch((error) => {
    console.error("Order seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });