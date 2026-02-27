import { PrismaClient, ReviewStatus, SupportTicketStatus, SupportTicketPriority, LoyaltyTransactionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const profile1 = await prisma.customerProfile.upsert({
    where: { email: 'jane.doe@example.com' },
    update: {},
    create: {
      userId: 'user_seed_001',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      phone: '+441234567890',
      isVerified: true,
      addresses: {
        create: {
          label: 'Home',
          line1: '12 Oak Street',
          city: 'London',
          postcode: 'SW1A 1AA',
          isDefault: true,
        },
      },
      preferences: {
        create: {
          emailNotifications: true,
          marketingEmails: true,
          newsletterSubscribed: true,
          preferredCategories: ['kitchen', 'bedroom'],
        },
      },
      loyaltyAccount: {
        create: {
          points: 500,
          lifetimePoints: 1200,
          tier: 'SILVER',
          transactions: {
            create: [
              {
                type: LoyaltyTransactionType.EARN,
                points: 200,
                description: 'Order #ORD-001',
                referenceId: 'ORD-001',
              },
              {
                type: LoyaltyTransactionType.EARN,
                points: 300,
                description: 'Referral bonus',
              },
            ],
          },
        },
      },
      reviews: {
        create: {
          productId: 'prod_seed_001',
          rating: 5,
          title: 'Absolutely stunning kitchen',
          body: 'The Luna White kitchen is exactly as described. Installation was smooth and the finish is perfect.',
          status: ReviewStatus.APPROVED,
          isVerified: true,
        },
      },
      supportTickets: {
        create: {
          ticketRef: 'TKT-000001',
          subject: 'Delivery inquiry',
          description: 'When will my order arrive?',
          status: SupportTicketStatus.RESOLVED,
          priority: SupportTicketPriority.LOW,
        },
      },
    },
  });

  await prisma.wishlistItem.upsert({
    where: { profileId_productId: { profileId: profile1.id, productId: 'prod_seed_002' } },
    update: {},
    create: {
      profileId: profile1.id,
      productId: 'prod_seed_002',
      productName: 'Opus Bedroom',
      productSlug: 'opus-bedroom',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });