import bcrypt from 'bcryptjs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'System administrator with full access',
      permissions: ['*'],
    },
  });

  const customerRole = await prisma.role.upsert({
    where: { name: 'CUSTOMER' },
    update: {},
    create: {
      name: 'CUSTOMER',
      description: 'Regular customer with limited access',
      permissions: ['READ_PRODUCTS', 'CREATE_ORDERS', 'MANAGE_PROFILE'],
    },
  });

  await prisma.role.upsert({
    where: { name: 'CONSULTANT' },
    update: {},
    create: {
      name: 'CONSULTANT',
      description: 'Sales consultant with appointment management access',
      permissions: ['READ_PRODUCTS', 'MANAGE_APPOINTMENTS', 'VIEW_CUSTOMERS'],
    },
  });

  const hashedPassword = await bcrypt.hash('admin123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@lomashwood.com' },
    update: {},
    create: {
      email: 'admin@lomashwood.com',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+44 20 7123 4567',
      isActive: true,
      isEmailVerified: true,
      roleId: adminRole.id,
    },
  });

  const customer1 = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      email: 'john.doe@example.com',
      passwordHash: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+44 20 7123 4568',
      isActive: true,
      isEmailVerified: true,
      roleId: customerRole.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'jane.smith@example.com' },
    update: {},
    create: {
      email: 'jane.smith@example.com',
      passwordHash: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+44 20 7123 4569',
      isActive: true,
      isEmailVerified: true,
      roleId: customerRole.id,
    },
  });

  const kitchenCategory = await prisma.category.upsert({
    where: { slug: 'kitchen' },
    update: {},
    create: {
      name: 'Kitchen',
      slug: 'kitchen',
      description: 'Modern kitchen furniture and cabinets',
      image: '/images/categories/kitchen.jpg',
      sortOrder: 1,
      isActive: true,
    },
  });

  const bedroomCategory = await prisma.category.upsert({
    where: { slug: 'bedroom' },
    update: {},
    create: {
      name: 'Bedroom',
      slug: 'bedroom',
      description: 'Comfortable bedroom furniture and storage',
      image: '/images/categories/bedroom.jpg',
      sortOrder: 2,
      isActive: true,
    },
  });

  const oakColor = await prisma.color.upsert({
    where: { name: 'Oak' },
    update: {},
    create: {
      name: 'Oak',
      hexCode: '#D2B48C',
      image: '/images/colors/oak.jpg',
      isActive: true,
    },
  });

  const walnutColor = await prisma.color.upsert({
    where: { name: 'Walnut' },
    update: {},
    create: {
      name: 'Walnut',
      hexCode: '#8B4513',
      image: '/images/colors/walnut.jpg',
      isActive: true,
    },
  });

  await prisma.color.upsert({
    where: { name: 'White' },
    update: {},
    create: {
      name: 'White',
      hexCode: '#FFFFFF',
      image: '/images/colors/white.jpg',
      isActive: true,
    },
  });

  const smallSize = await prisma.size.upsert({
    where: { name: 'Small' },
    update: {},
    create: {
      name: 'Small',
      description: 'Compact furniture for small spaces',
      isActive: true,
    },
  });

  const mediumSize = await prisma.size.upsert({
    where: { name: 'Medium' },
    update: {},
    create: {
      name: 'Medium',
      description: 'Standard size furniture',
      isActive: true,
    },
  });

  const largeSize = await prisma.size.upsert({
    where: { name: 'Large' },
    update: {},
    create: {
      name: 'Large',
      description: 'Spacious furniture for large areas',
      isActive: true,
    },
  });

  const product1 = await prisma.product.upsert({
    where: { sku: 'KITCHEN-001' },
    update: {},
    create: {
      sku: 'KITCHEN-001',
      name: 'Modern Kitchen Cabinet Set',
      slug: 'modern-kitchen-cabinet-set',
      description: 'A complete modern kitchen cabinet set with premium oak finish',
      shortDescription: 'Modern oak kitchen cabinets',
      price: 2499.99,
      compareAtPrice: 2999.99,
      cost: 1500.00,
      images: [
        '/images/products/kitchen-1-1.jpg',
        '/images/products/kitchen-1-2.jpg',
        '/images/products/kitchen-1-3.jpg',
      ],
      categoryId: kitchenCategory.id,
      status: 'ACTIVE',
      featured: true,
      trackInventory: true,
      weight: 150.5,
      dimensions: {
        length: 200,
        width: 100,
        height: 60,
        unit: 'cm',
      },
      specifications: {
        material: 'Oak Wood',
        finish: 'Matte',
        warranty: '5 years',
        assembly: 'Required',
      },
      seoTitle: 'Modern Kitchen Cabinet Set | Lomash Wood',
      seoDescription: 'Transform your kitchen with our modern oak cabinet set',
      seoKeywords: 'kitchen cabinets, modern furniture, oak wood',
    },
  });

  const product2 = await prisma.product.upsert({
    where: { sku: 'BEDROOM-001' },
    update: {},
    create: {
      sku: 'BEDROOM-001',
      name: 'Luxury Bedroom Wardrobe',
      slug: 'luxury-bedroom-wardrobe',
      description: 'Spacious luxury wardrobe with walnut finish and ample storage',
      shortDescription: 'Luxury walnut wardrobe',
      price: 1899.99,
      compareAtPrice: 2299.99,
      cost: 1200.00,
      images: [
        '/images/products/bedroom-1-1.jpg',
        '/images/products/bedroom-1-2.jpg',
      ],
      categoryId: bedroomCategory.id,
      status: 'ACTIVE',
      featured: false,
      trackInventory: true,
      weight: 120.0,
      dimensions: {
        length: 180,
        width: 80,
        height: 220,
        unit: 'cm',
      },
      specifications: {
        material: 'Walnut Wood',
        finish: 'Glossy',
        warranty: '10 years',
        assembly: 'Required',
      },
      seoTitle: 'Luxury Bedroom Wardrobe | Lomash Wood',
      seoDescription: 'Spacious luxury wardrobe with premium walnut finish',
      seoKeywords: 'wardrobe, bedroom furniture, walnut wood',
    },
  });

  await prisma.productVariant.createMany({
    data: [
      {
        productId: product1.id,
        sku: 'KITCHEN-001-OAK-SMALL',
        name: 'Modern Kitchen Cabinet Set - Oak - Small',
        price: 1999.99,
        compareAtPrice: 2499.99,
        cost: 1200.00,
        colorId: oakColor.id,
        sizeId: smallSize.id,
        inventory: 10,
        weight: 120.0,
        isActive: true,
      },
      {
        productId: product1.id,
        sku: 'KITCHEN-001-OAK-MEDIUM',
        name: 'Modern Kitchen Cabinet Set - Oak - Medium',
        price: 2499.99,
        compareAtPrice: 2999.99,
        cost: 1500.00,
        colorId: oakColor.id,
        sizeId: mediumSize.id,
        inventory: 15,
        weight: 150.5,
        isActive: true,
      },
      {
        productId: product1.id,
        sku: 'KITCHEN-001-WALNUT-MEDIUM',
        name: 'Modern Kitchen Cabinet Set - Walnut - Medium',
        price: 2699.99,
        compareAtPrice: 3199.99,
        cost: 1600.00,
        colorId: walnutColor.id,
        sizeId: mediumSize.id,
        inventory: 8,
        weight: 155.0,
        isActive: true,
      },
      {
        productId: product2.id,
        sku: 'BEDROOM-001-WALNUT-LARGE',
        name: 'Luxury Bedroom Wardrobe - Walnut - Large',
        price: 1899.99,
        compareAtPrice: 2299.99,
        cost: 1200.00,
        colorId: walnutColor.id,
        sizeId: largeSize.id,
        inventory: 12,
        weight: 120.0,
        isActive: true,
      },
    ],
  });

  const londonShowroom = await prisma.showroom.upsert({
    where: { slug: 'london-showroom' },
    update: {},
    create: {
      name: 'London Showroom',
      slug: 'london-showroom',
      address: {
        street: '123 High Street',
        city: 'London',
        postalCode: 'SW1A 1AA',
        country: 'UK',
      },
      image: '/images/showrooms/london.jpg',
      email: 'london@lomashwood.com',
      phone: '+44 20 7123 4569',
      openingHours: {
        monday: '9:00 - 18:00',
        tuesday: '9:00 - 18:00',
        wednesday: '9:00 - 18:00',
        thursday: '9:00 - 18:00',
        friday: '9:00 - 18:00',
        saturday: '10:00 - 17:00',
        sunday: 'Closed',
      },
      mapUrl: 'https://maps.google.com/?q=lomashwood+london',
      coordinates: { lat: 51.5074, lng: -0.1278 },
      features: ['Parking', 'Wheelchair Access', 'Coffee Bar'],
      isActive: true,
      sortOrder: 1,
    },
  });

  const consultant1 = await prisma.consultant.upsert({
    where: { userId: 'consultant-1' },
    update: {},
    create: {
      userId: 'consultant-1',
      name: 'John Smith',
      email: 'john.smith@lomashwood.com',
      phone: '+44 20 7123 4567',
      specializations: ['KITCHEN', 'BEDROOM'],
      bio: 'Experienced furniture consultant with 10+ years in the industry.',
      avatar: '/images/consultants/john.jpg',
      isActive: true,
      rating: 4.8,
      reviewCount: 45,
    },
  });

  await prisma.consultant.upsert({
    where: { userId: 'consultant-2' },
    update: {},
    create: {
      userId: 'consultant-2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@lomashwood.com',
      phone: '+44 20 7123 4568',
      specializations: ['KITCHEN'],
      bio: 'Kitchen design specialist focused on modern and contemporary styles.',
      avatar: '/images/consultants/sarah.jpg',
      isActive: true,
      rating: 4.9,
      reviewCount: 32,
    },
  });

  await prisma.appointment.create({
    data: {
      customerId: customer1.id,
      consultantId: consultant1.id,
      showroomId: londonShowroom.id,
      type: 'SHOWROOM',
      serviceType: 'KITCHEN',
      status: 'CONFIRMED',
      customerDetails: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+44 20 7123 4568',
      },
      scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      scheduledTime: '14:00',
      duration: 60,
      notes: 'Interested in modern kitchen designs',
      reminderSent: false,
    },
  });

  const order1 = await prisma.order.create({
    data: {
      customerId: customer1.id,
      status: 'CONFIRMED',
      items: {
        create: [
          {
            productId: product1.id,
            productName: 'Modern Kitchen Cabinet Set',
            productImage: '/images/products/kitchen-1.jpg',
            quantity: 1,
            unitPrice: 2499.99,
            totalPrice: 2499.99,
          },
        ],
      },
      subtotal: 2499.99,
      tax: 249.99,
      shipping: 50.00,
      discount: 0,
      total: 2799.98,
      currency: 'GBP',
      shippingAddress: {
        street: '123 Main St',
        city: 'London',
        postalCode: 'SW1A 1AA',
        country: 'UK',
      },
      billingAddress: {
        street: '123 Main St',
        city: 'London',
        postalCode: 'SW1A 1AA',
        country: 'UK',
      },
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order1.id,
      customerId: customer1.id,
      amount: 2799.98,
      currency: 'GBP',
      status: 'COMPLETED',
      method: 'CREDIT_CARD',
      provider: 'stripe',
      transactionId: 'txn_123456789',
    },
  });

  await prisma.review.create({
    data: {
      customerId: customer1.id,
      productId: product1.id,
      orderId: order1.id,
      rating: 5,
      title: 'Excellent Quality',
      content: 'The kitchen cabinets are absolutely beautiful! Perfect fit and great quality.',
      images: ['/images/reviews/kitchen-1.jpg'],
      helpful: 12,
      status: 'APPROVED',
      verified: true,
    },
  });

  await prisma.blog.create({
    data: {
      title: 'Modern Kitchen Design Trends 2024',
      slug: 'modern-kitchen-design-trends-2024',
      excerpt: 'Discover the latest trends in modern kitchen design for 2024.',
      content: `# Modern Kitchen Design Trends 2024

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Key Trends

1. **Minimalist Design**: Clean lines and clutter-free spaces
2. **Smart Storage**: Innovative storage solutions
3. **Sustainable Materials**: Eco-friendly choices
4. **Bold Colors**: Statement pieces and accents

## Conclusion

Transform your kitchen with these modern design trends.`,
      featuredImage: '/images/blogs/kitchen-trends.jpg',
      category: 'Design',
      tags: ['kitchen', 'design', 'trends', '2024'],
      author: 'John Smith',
      authorId: 'author-1',
      status: 'PUBLISHED',
      featured: true,
      seoTitle: 'Modern Kitchen Design Trends 2024 | Lomash Wood',
      seoDescription: 'Discover the latest trends in modern kitchen design for 2024.',
      seoKeywords: 'kitchen design, modern kitchen, 2024 trends',
      publishedAt: new Date(),
    },
  });

  await prisma.cmsPage.create({
    data: {
      title: 'About Us',
      slug: 'about-us',
      content: `# About Lomash Wood

We are Lomash Wood, your trusted partner for quality furniture since 2010.

## Our Mission

To provide exceptional furniture solutions that transform houses into homes.

## Our Values

- Quality craftsmanship
- Sustainable practices
- Customer satisfaction`,
      template: 'default',
      status: 'PUBLISHED',
      seoTitle: 'About Us | Lomash Wood',
      seoDescription: 'Learn more about Lomash Wood and our commitment to quality furniture.',
      publishedAt: new Date(),
    },
  });

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });