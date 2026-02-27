import { PrismaClient, ProductCategory, ProductStatus, StyleType, FinishType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  await prisma.priceHistory.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.saleProduct.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.package.deleteMany();
  await prisma.productUnit.deleteMany();
  await prisma.productColour.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.colour.deleteMany();
  await prisma.size.deleteMany();
  await prisma.category.deleteMany();

  console.log('✅ Cleared existing data');

  const colours = await prisma.colour.createMany({
    data: [
      { name: 'White', hexCode: '#FFFFFF', order: 1 },
      { name: 'Black', hexCode: '#000000', order: 2 },
      { name: 'Grey', hexCode: '#808080', order: 3 },
      { name: 'Navy Blue', hexCode: '#000080', order: 4 },
      { name: 'Cream', hexCode: '#FFFDD0', order: 5 },
      { name: 'Oak', hexCode: '#D2B48C', order: 6 },
      { name: 'Walnut', hexCode: '#773F1A', order: 7 },
      { name: 'Sage Green', hexCode: '#9CAF88', order: 8 },
      { name: 'Charcoal', hexCode: '#36454F', order: 9 },
      { name: 'Pebble Grey', hexCode: '#C9C0BB', order: 10 },
    ],
  });

  console.log(`✅ Created ${colours.count} colours`);

  const sizes = await prisma.size.createMany({
    data: [
      { name: 'Small', value: '600', unit: 'mm', order: 1 },
      { name: 'Medium', value: '900', unit: 'mm', order: 2 },
      { name: 'Large', value: '1200', unit: 'mm', order: 3 },
      { name: 'Extra Large', value: '1500', unit: 'mm', order: 4 },
    ],
  });

  console.log(`✅ Created ${sizes.count} sizes`);

  // ─── FIX 1: removed unused kitchenCategory / bedroomCategory variables ───
  await prisma.category.create({
    data: {
      name: 'Modern Kitchens',
      slug: 'modern-kitchens',
      description: 'Contemporary kitchen designs',
      type: ProductCategory.KITCHEN,
      order: 1,
    },
  });

  await prisma.category.create({
    data: {
      name: 'Contemporary Bedrooms',
      slug: 'contemporary-bedrooms',
      description: 'Modern bedroom designs',
      type: ProductCategory.BEDROOM,
      order: 2,
    },
  });

  console.log('✅ Created categories');

  const colourRecords = await prisma.colour.findMany();

  const kitchenProducts = [
    {
      category: ProductCategory.KITCHEN,
      title: 'Luna White Gloss Kitchen',
      description: 'A stunning modern kitchen featuring high-gloss white doors with sleek handleless design. Perfect for contemporary homes seeking a clean, minimalist aesthetic.',
      price: 8999.99,
      rangeName: 'Luna Collection',
      status: ProductStatus.PUBLISHED,
      style: StyleType.MODERN,
      finish: FinishType.GLOSS,
      slug: 'luna-white-gloss-kitchen',
      metaTitle: 'Luna White Gloss Kitchen | Modern Kitchen Design',
      metaDescription: 'Discover our Luna White Gloss Kitchen featuring handleless design and contemporary aesthetics.',
      featured: true,
      sortOrder: 1,
    },
    {
      category: ProductCategory.KITCHEN,
      title: 'Shaker Oak Kitchen',
      description: 'Traditional shaker-style kitchen in natural oak finish. Timeless design with modern functionality.',
      price: 7499.99,
      rangeName: 'Heritage Collection',
      status: ProductStatus.PUBLISHED,
      style: StyleType.TRADITIONAL,
      finish: FinishType.WOOD_GRAIN,
      slug: 'shaker-oak-kitchen',
      metaTitle: 'Shaker Oak Kitchen | Traditional Design',
      metaDescription: 'Classic shaker-style kitchen in beautiful natural oak finish.',
      featured: true,
      sortOrder: 2,
    },
    {
      category: ProductCategory.KITCHEN,
      title: 'Industrial Charcoal Matt Kitchen',
      description: 'Bold industrial design with matt charcoal finish and exposed hardware.',
      price: 9999.99,
      rangeName: 'Urban Collection',
      status: ProductStatus.PUBLISHED,
      style: StyleType.INDUSTRIAL,
      finish: FinishType.MATT,
      slug: 'industrial-charcoal-matt-kitchen',
      metaTitle: 'Industrial Charcoal Kitchen | Urban Design',
      metaDescription: 'Modern industrial kitchen design with matt charcoal finish.',
      featured: false,
      sortOrder: 3,
    },
  ];

  const bedroomProducts = [
    {
      category: ProductCategory.BEDROOM,
      title: 'Minimalist White Bedroom Suite',
      description: 'Clean lines and minimalist design in pristine white. Create a serene sleeping environment.',
      price: 4999.99,
      rangeName: 'Serenity Collection',
      status: ProductStatus.PUBLISHED,
      style: StyleType.MINIMALIST,
      finish: FinishType.MATT,
      slug: 'minimalist-white-bedroom-suite',
      metaTitle: 'Minimalist White Bedroom | Modern Design',
      metaDescription: 'Beautiful minimalist bedroom suite in white finish.',
      featured: true,
      sortOrder: 4,
    },
    {
      category: ProductCategory.BEDROOM,
      title: 'Classic Walnut Bedroom',
      description: 'Rich walnut finish with traditional styling. Elegant and timeless bedroom furniture.',
      price: 5999.99,
      rangeName: 'Classic Collection',
      status: ProductStatus.PUBLISHED,
      style: StyleType.CLASSIC,
      finish: FinishType.WOOD_GRAIN,
      slug: 'classic-walnut-bedroom',
      metaTitle: 'Classic Walnut Bedroom | Traditional Style',
      metaDescription: 'Elegant walnut bedroom furniture with classic design.',
      featured: false,
      sortOrder: 5,
    },
  ];

  for (const productData of [...kitchenProducts, ...bedroomProducts]) {
    const product = await prisma.product.create({
      data: {
        ...productData,
        images: {
          create: [
            {
              url: `https://example.com/images/${productData.slug}-1.jpg`,
              altText: `${productData.title} - Main View`,
              order: 1,
            },
            {
              url: `https://example.com/images/${productData.slug}-2.jpg`,
              altText: `${productData.title} - Detail View`,
              order: 2,
            },
            {
              url: `https://example.com/images/${productData.slug}-3.jpg`,
              altText: `${productData.title} - Lifestyle View`,
              order: 3,
            },
          ],
        },
        colours: {
          // ─── FIX 2: renamed unused 'index' param to '_index' ───
          create: colourRecords.slice(0, 3).map((colour, _index) => ({
            colourId: colour.id,
          })),
        },
        units: {
          create: [
            {
              image: `https://example.com/images/${productData.slug}-unit-1.jpg`,
              title: 'Base Unit',
              description: '600mm base unit with soft-close drawers',
              order: 1,
            },
            {
              image: `https://example.com/images/${productData.slug}-unit-2.jpg`,
              title: 'Wall Unit',
              description: '900mm wall unit with glass doors',
              order: 2,
            },
            {
              image: `https://example.com/images/${productData.slug}-unit-3.jpg`,
              title: 'Tall Unit',
              description: '2100mm tall unit with adjustable shelves',
              order: 3,
            },
          ],
        },
        inventory: {
          create: {
            quantity: 100,
            reserved: 10,
            available: 90,
            lowStockAlert: 10,
            lastRestocked: new Date(),
          },
        },
      },
    });

    await prisma.priceHistory.create({
      data: {
        productId: product.id,
        oldPrice: null,
        newPrice: productData.price,
        reason: 'Initial price',
        changedBy: 'system',
      },
    });
  }

  console.log('✅ Created products with images, colours, units, and inventory');

  const sale = await prisma.sale.create({
    data: {
      title: 'Summer Kitchen Sale',
      description: 'Save up to 30% on selected kitchen ranges this summer!',
      image: 'https://example.com/images/summer-sale.jpg',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-08-31'),
      discount: 30.0,
      terms: 'Terms and conditions apply. Cannot be combined with other offers.',
      category: ProductCategory.KITCHEN,
      active: true,
      slug: 'summer-kitchen-sale-2026',
    },
  });

  const productsForSale = await prisma.product.findMany({
    where: { category: ProductCategory.KITCHEN },
    take: 2,
  });

  await prisma.saleProduct.createMany({
    data: productsForSale.map(p => ({
      saleId: sale.id,
      productId: p.id,
    })),
  });

  console.log('✅ Created sale with products');

  await prisma.package.createMany({
    data: [
      {
        title: 'Essential Kitchen Package',
        description: 'Everything you need for a complete kitchen transformation',
        image: 'https://example.com/images/essential-package.jpg',
        price: 12999.99,
        category: ProductCategory.KITCHEN,
        active: true,
        slug: 'essential-kitchen-package',
        features: JSON.stringify([
          'Base and wall units',
          'Worktops included',
          'Free design consultation',
          'Professional installation',
        ]),
      },
      {
        title: 'Premium Bedroom Package',
        description: 'Luxury bedroom furniture package with fitted wardrobes',
        image: 'https://example.com/images/premium-bedroom-package.jpg',
        price: 8999.99,
        category: ProductCategory.BEDROOM,
        active: true,
        slug: 'premium-bedroom-package',
        features: JSON.stringify([
          'Fitted wardrobes',
          'Bedside tables',
          'Dressing table',
          'Free home measurement',
        ]),
      },
    ],
  });

  console.log('✅ Created packages');

  const stats = {
    colours: await prisma.colour.count(),
    sizes: await prisma.size.count(),
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    productImages: await prisma.productImage.count(),
    productColours: await prisma.productColour.count(),
    productUnits: await prisma.productUnit.count(),
    sales: await prisma.sale.count(),
    saleProducts: await prisma.saleProduct.count(),
    packages: await prisma.package.count(),
    inventory: await prisma.inventory.count(),
    priceHistory: await prisma.priceHistory.count(),
  };

  console.log('\n📊 Seed Summary:');
  console.log(JSON.stringify(stats, null, 2));
  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });