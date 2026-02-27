

import { Prisma } from '@prisma/client';


export const categoryFixtures = {
  kitchen: {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Kitchen',
    slug: 'kitchen',
    description: 'Modern and traditional kitchen designs',
    imageUrl: 'https://cdn.lomashwood.com/categories/kitchen.jpg',
    isActive: true,
    displayOrder: 1,
    seoTitle: 'Kitchen Designs | Lomash Wood',
    seoDescription: 'Explore our range of beautiful kitchen designs',
    seoKeywords: 'kitchen, modern kitchen, traditional kitchen',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as const,

  bedroom: {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Bedroom',
    slug: 'bedroom',
    description: 'Elegant bedroom furniture and designs',
    imageUrl: 'https://cdn.lomashwood.com/categories/bedroom.jpg',
    isActive: true,
    displayOrder: 2,
    seoTitle: 'Bedroom Designs | Lomash Wood',
    seoDescription: 'Discover our elegant bedroom furniture collection',
    seoKeywords: 'bedroom, bedroom furniture, wardrobes',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as const,

  inactive: {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Bathroom',
    slug: 'bathroom',
    description: 'Bathroom furniture (Inactive)',
    imageUrl: 'https://cdn.lomashwood.com/categories/bathroom.jpg',
    isActive: false,
    displayOrder: 3,
    seoTitle: null,
    seoDescription: null,
    seoKeywords: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as const,
};

export const colourFixtures = {
  white: {
    id: '660e8400-e29b-41d4-a716-446655440001',
    name: 'White',
    hexCode: '#FFFFFF',
    imageUrl: 'https://cdn.lomashwood.com/colours/white.jpg',
    isActive: true,
    displayOrder: 1,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as const,

  pebbleGrey: {
    id: '660e8400-e29b-41d4-a716-446655440002',
    name: 'Pebble Grey',
    hexCode: '#8B8680',
    imageUrl: 'https://cdn.lomashwood.com/colours/pebble-grey.jpg',
    isActive: true,
    displayOrder: 2,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as const,

  navyBlue: {
    id: '660e8400-e29b-41d4-a716-446655440003',
    name: 'Navy Blue',
    hexCode: '#000080',
    imageUrl: 'https://cdn.lomashwood.com/colours/navy-blue.jpg',
    isActive: true,
    displayOrder: 3,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as const,

  charcoal: {
    id: '660e8400-e29b-41d4-a716-446655440004',
    name: 'Charcoal',
    hexCode: '#36454F',
    imageUrl: 'https://cdn.lomashwood.com/colours/charcoal.jpg',
    isActive: true,
    displayOrder: 4,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as const,

  oak: {
    id: '660e8400-e29b-41d4-a716-446655440005',
    name: 'Natural Oak',
    hexCode: '#D2B48C',
    imageUrl: 'https://cdn.lomashwood.com/colours/natural-oak.jpg',
    isActive: true,
    displayOrder: 5,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as const,

  walnut: {
    id: '660e8400-e29b-41d4-a716-446655440006',
    name: 'Walnut',
    hexCode: '#5C4033',
    imageUrl: 'https://cdn.lomashwood.com/colours/walnut.jpg',
    isActive: true,
    displayOrder: 6,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as const,

  inactive: {
    id: '660e8400-e29b-41d4-a716-446655440007',
    name: 'Discontinued Red',
    hexCode: '#FF0000',
    imageUrl: null,
    isActive: false,
    displayOrder: 99,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as const,
};


export const sizeFixtures = {
  standardBase: {
    id: '770e8400-e29b-41d4-a716-446655440001',
    name: 'Standard Base Unit',
    code: 'STD-BASE-600',
    width: 600,
    height: 720,
    depth: 560,
    unit: 'mm',
    imageUrl: 'https://cdn.lomashwood.com/sizes/standard-base.jpg',
    description: 'Standard base cabinet unit - 600mm width',
    isActive: true,
    displayOrder: 1,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as const,

  largeBase: {
    id: '770e8400-e29b-41d4-a716-446655440002',
    name: 'Large Base Unit',
    code: 'LRG-BASE-800',
    width: 800,
    height: 720,
    depth: 560,
    unit: 'mm',
    imageUrl: 'https://cdn.lomashwood.com/sizes/large-base.jpg',
    description: 'Large base cabinet unit - 800mm width',
    isActive: true,
    displayOrder: 2,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as const,

  wallUnit: {
    id: '770e8400-e29b-41d4-a716-446655440003',
    name: 'Standard Wall Unit',
    code: 'STD-WALL-600',
    width: 600,
    height: 720,
    depth: 300,
    unit: 'mm',
    imageUrl: 'https://cdn.lomashwood.com/sizes/wall-unit.jpg',
    description: 'Standard wall cabinet unit - 600mm width',
    isActive: true,
    displayOrder: 3,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as const,

  tallUnit: {
    id: '770e8400-e29b-41d4-a716-446655440004',
    name: 'Tall Unit',
    code: 'TALL-600',
    width: 600,
    height: 2000,
    depth: 560,
    unit: 'mm',
    imageUrl: 'https://cdn.lomashwood.com/sizes/tall-unit.jpg',
    description: 'Tall cabinet unit - full height',
    isActive: true,
    displayOrder: 4,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as const,

  wardrobeDouble: {
    id: '770e8400-e29b-41d4-a716-446655440005',
    name: 'Double Wardrobe',
    code: 'DBL-WARD-1000',
    width: 1000,
    height: 2000,
    depth: 600,
    unit: 'mm',
    imageUrl: 'https://cdn.lomashwood.com/sizes/double-wardrobe.jpg',
    description: 'Double door wardrobe',
    isActive: true,
    displayOrder: 5,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as const,
};


export const productFixtures = {
  lunaWhiteKitchen: {
    id: '880e8400-e29b-41d4-a716-446655440001',
    categoryId: categoryFixtures.kitchen.id,
    name: 'Luna White Gloss Kitchen',
    slug: 'luna-white-gloss-kitchen',
    description: 'Modern handleless kitchen with high-gloss white finish. Features sleek J-pull design for a contemporary look.',
    longDescription: 'The Luna White Gloss kitchen combines minimalist design with maximum functionality. The handleless doors create clean lines throughout, while the high-gloss finish adds brightness and space to any kitchen. Perfect for modern homes seeking a sophisticated aesthetic.',
    sku: 'KIT-LUNA-WHT-001',
    rangeName: 'Luna Collection',
    style: 'Modern',
    finish: 'High Gloss',
    material: 'MDF',
    basePrice: 8999.00,
    currency: 'GBP',
    priceUnit: 'complete',
    isActive: true,
    isFeatured: true,
    stockStatus: 'IN_STOCK',
    leadTimeDays: 28,
    metaTitle: 'Luna White Gloss Kitchen | Modern Handleless Design',
    metaDescription: 'Discover the Luna White Gloss kitchen - a stunning modern handleless design with high-gloss finish. From £8,999.',
    metaKeywords: 'luna kitchen, white gloss kitchen, handleless kitchen, modern kitchen',
    viewCount: 1542,
    popularity: 95,
    displayOrder: 1,
    createdAt: new Date('2024-01-15T00:00:00Z'),
    updatedAt: new Date('2024-02-01T00:00:00Z'),
  } as const,

  jPullPebbleGrey: {
    id: '880e8400-e29b-41d4-a716-446655440002',
    categoryId: categoryFixtures.kitchen.id,
    name: 'J-Pull Pebble Grey Gloss Kitchen',
    slug: 'j-pull-pebble-grey-gloss',
    description: 'Contemporary J-pull kitchen in sophisticated pebble grey gloss finish.',
    longDescription: 'The J-Pull Pebble Grey kitchen offers a perfect balance of style and practicality. The integrated J-handle design provides a sleek, handleless appearance while maintaining easy access to all cabinets. The subtle grey tone adds warmth and elegance.',
    sku: 'KIT-JPULL-PBL-002',
    rangeName: 'J-Pull Collection',
    style: 'Contemporary',
    finish: 'High Gloss',
    material: 'MDF',
    basePrice: 9499.00,
    currency: 'GBP',
    priceUnit: 'complete',
    isActive: true,
    isFeatured: true,
    stockStatus: 'IN_STOCK',
    leadTimeDays: 28,
    metaTitle: 'J-Pull Pebble Grey Gloss Kitchen | Wren-Style Design',
    metaDescription: 'Shop the J-Pull Pebble Grey Gloss kitchen. Contemporary handleless design in elegant grey. From £9,499.',
    metaKeywords: 'j-pull kitchen, pebble grey kitchen, gloss kitchen',
    viewCount: 2103,
    popularity: 98,
    displayOrder: 2,
    createdAt: new Date('2024-01-10T00:00:00Z'),
    updatedAt: new Date('2024-02-05T00:00:00Z'),
  } as const,

  shakerNavyKitchen: {
    id: '880e8400-e29b-41d4-a716-446655440003',
    categoryId: categoryFixtures.kitchen.id,
    name: 'Shaker Navy Blue Kitchen',
    slug: 'shaker-navy-blue-kitchen',
    description: 'Classic shaker style kitchen in bold navy blue with traditional elegance.',
    longDescription: 'Our Shaker Navy Blue kitchen brings timeless charm to modern living. Hand-crafted shaker doors in deep navy blue create a statement look, while the versatile design works perfectly in both traditional and contemporary settings.',
    sku: 'KIT-SHAK-NVY-003',
    rangeName: 'Shaker Heritage',
    style: 'Traditional',
    finish: 'Painted',
    material: 'Solid Wood',
    basePrice: 12999.00,
    currency: 'GBP',
    priceUnit: 'complete',
    isActive: true,
    isFeatured: true,
    stockStatus: 'IN_STOCK',
    leadTimeDays: 35,
    metaTitle: 'Shaker Navy Blue Kitchen | Traditional Elegance',
    metaDescription: 'Explore our Shaker Navy Blue kitchen. Classic shaker design in stunning navy. From £12,999.',
    metaKeywords: 'shaker kitchen, navy kitchen, traditional kitchen, blue kitchen',
    viewCount: 1876,
    popularity: 92,
    displayOrder: 3,
    createdAt: new Date('2024-01-20T00:00:00Z'),
    updatedAt: new Date('2024-02-10T00:00:00Z'),
  } as const,

  modernOakKitchen: {
    id: '880e8400-e29b-41d4-a716-446655440004',
    categoryId: categoryFixtures.kitchen.id,
    name: 'Natural Oak Modern Kitchen',
    slug: 'natural-oak-modern-kitchen',
    description: 'Warm natural oak kitchen with contemporary design elements.',
    longDescription: 'Experience the natural beauty of oak in a modern setting. This kitchen combines the warmth of natural wood with sleek contemporary hardware and design, creating a space that is both inviting and stylish.',
    sku: 'KIT-OAK-MOD-004',
    rangeName: 'Natural Living',
    style: 'Scandinavian',
    finish: 'Matt',
    material: 'Oak Veneer',
    basePrice: 10499.00,
    currency: 'GBP',
    priceUnit: 'complete',
    isActive: true,
    isFeatured: false,
    stockStatus: 'LOW_STOCK',
    leadTimeDays: 42,
    metaTitle: 'Natural Oak Modern Kitchen | Scandinavian Design',
    metaDescription: 'Discover our Natural Oak kitchen. Warm wood tones meet modern design. From £10,499.',
    metaKeywords: 'oak kitchen, scandinavian kitchen, wood kitchen, natural kitchen',
    viewCount: 987,
    popularity: 78,
    displayOrder: 4,
    createdAt: new Date('2024-01-25T00:00:00Z'),
    updatedAt: new Date('2024-02-08T00:00:00Z'),
  } as const,

  charcoalMatteKitchen: {
    id: '880e8400-e29b-41d4-a716-446655440005',
    categoryId: categoryFixtures.kitchen.id,
    name: 'Charcoal Matte Kitchen',
    slug: 'charcoal-matte-kitchen',
    description: 'Ultra-modern charcoal kitchen with sophisticated matte finish.',
    longDescription: 'Make a bold statement with our Charcoal Matte kitchen. The deep, rich color combined with a non-reflective matte finish creates drama and sophistication. Ideal for those seeking a truly contemporary space.',
    sku: 'KIT-CHAR-MAT-005',
    rangeName: 'Urban Edge',
    style: 'Industrial',
    finish: 'Matte',
    material: 'MDF',
    basePrice: 11299.00,
    currency: 'GBP',
    priceUnit: 'complete',
    isActive: true,
    isFeatured: false,
    stockStatus: 'IN_STOCK',
    leadTimeDays: 30,
    metaTitle: 'Charcoal Matte Kitchen | Bold Industrial Design',
    metaDescription: 'Shop our Charcoal Matte kitchen. Dark, dramatic, and distinctly modern. From £11,299.',
    metaKeywords: 'charcoal kitchen, matte kitchen, dark kitchen, industrial kitchen',
    viewCount: 756,
    popularity: 85,
    displayOrder: 5,
    createdAt: new Date('2024-02-01T00:00:00Z'),
    updatedAt: new Date('2024-02-12T00:00:00Z'),
  } as const,

  classicWalnutBedroom: {
    id: '880e8400-e29b-41d4-a716-446655440006',
    categoryId: categoryFixtures.bedroom.id,
    name: 'Classic Walnut Bedroom Suite',
    slug: 'classic-walnut-bedroom-suite',
    description: 'Luxurious walnut bedroom furniture with timeless design.',
    longDescription: 'The Classic Walnut Bedroom Suite exudes elegance and quality. Crafted from premium walnut veneer, this collection offers a complete bedroom solution with wardrobes, bedside tables, and chest of drawers. Perfect for creating a sophisticated sleeping sanctuary.',
    sku: 'BED-WAL-CLS-006',
    rangeName: 'Heritage Collection',
    style: 'Classic',
    finish: 'Natural Wood',
    material: 'Walnut Veneer',
    basePrice: 5999.00,
    currency: 'GBP',
    priceUnit: 'suite',
    isActive: true,
    isFeatured: true,
    stockStatus: 'IN_STOCK',
    leadTimeDays: 21,
    metaTitle: 'Classic Walnut Bedroom Suite | Luxury Furniture',
    metaDescription: 'Browse our Classic Walnut Bedroom Suite. Timeless elegance in rich walnut. From £5,999.',
    metaKeywords: 'walnut bedroom, bedroom suite, luxury bedroom, classic bedroom',
    viewCount: 1234,
    popularity: 88,
    displayOrder: 1,
    createdAt: new Date('2024-01-18T00:00:00Z'),
    updatedAt: new Date('2024-02-02T00:00:00Z'),
  } as const,

  modernWhiteBedroom: {
    id: '880e8400-e29b-41d4-a716-446655440007',
    categoryId: categoryFixtures.bedroom.id,
    name: 'Modern White Gloss Bedroom',
    slug: 'modern-white-gloss-bedroom',
    description: 'Contemporary white gloss bedroom furniture with clean lines.',
    longDescription: 'Create a bright, spacious feel with our Modern White Gloss Bedroom collection. High-gloss white finish reflects light beautifully, while handleless design ensures a seamless, modern aesthetic. Includes fitted wardrobes and storage solutions.',
    sku: 'BED-WHT-MOD-007',
    rangeName: 'Contemporary Living',
    style: 'Modern',
    finish: 'High Gloss',
    material: 'MDF',
    basePrice: 4499.00,
    currency: 'GBP',
    priceUnit: 'suite',
    isActive: true,
    isFeatured: true,
    stockStatus: 'IN_STOCK',
    leadTimeDays: 28,
    metaTitle: 'Modern White Gloss Bedroom | Contemporary Furniture',
    metaDescription: 'Discover our Modern White Gloss Bedroom. Sleek, bright, and beautifully minimalist. From £4,499.',
    metaKeywords: 'white bedroom, gloss bedroom, modern bedroom, fitted wardrobes',
    viewCount: 1567,
    popularity: 91,
    displayOrder: 2,
    createdAt: new Date('2024-01-22T00:00:00Z'),
    updatedAt: new Date('2024-02-06T00:00:00Z'),
  } as const,

  inactiveBedroom: {
    id: '880e8400-e29b-41d4-a716-446655440008',
    categoryId: categoryFixtures.bedroom.id,
    name: 'Discontinued Pine Bedroom',
    slug: 'discontinued-pine-bedroom',
    description: 'Old pine bedroom range - discontinued.',
    longDescription: 'This product has been discontinued.',
    sku: 'BED-PIN-DIS-008',
    rangeName: 'Archive',
    style: 'Traditional',
    finish: 'Natural Wood',
    material: 'Pine',
    basePrice: 0,
    currency: 'GBP',
    priceUnit: 'suite',
    isActive: false,
    isFeatured: false,
    stockStatus: 'OUT_OF_STOCK',
    leadTimeDays: 0,
    metaTitle: null,
    metaDescription: null,
    metaKeywords: null,
    viewCount: 0,
    popularity: 0,
    displayOrder: 999,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-12-31T00:00:00Z'),
  } as const,
};


export const productImageFixtures = {
  lunaWhite1: {
    id: '990e8400-e29b-41d4-a716-446655440001',
    productId: productFixtures.lunaWhiteKitchen.id,
    url: 'https://cdn.lomashwood.com/products/luna-white-1.jpg',
    altText: 'Luna White Gloss Kitchen - Main View',
    isPrimary: true,
    displayOrder: 1,
    createdAt: new Date('2024-01-15T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z'),
  } as const,

  lunaWhite2: {
    id: '990e8400-e29b-41d4-a716-446655440002',
    productId: productFixtures.lunaWhiteKitchen.id,
    url: 'https://cdn.lomashwood.com/products/luna-white-2.jpg',
    altText: 'Luna White Gloss Kitchen - Close Up',
    isPrimary: false,
    displayOrder: 2,
    createdAt: new Date('2024-01-15T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z'),
  } as const,

  lunaWhite3: {
    id: '990e8400-e29b-41d4-a716-446655440003',
    productId: productFixtures.lunaWhiteKitchen.id,
    url: 'https://cdn.lomashwood.com/products/luna-white-3.jpg',
    altText: 'Luna White Gloss Kitchen - Island View',
    isPrimary: false,
    displayOrder: 3,
    createdAt: new Date('2024-01-15T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z'),
  } as const,

  jPullGrey1: {
    id: '990e8400-e29b-41d4-a716-446655440004',
    productId: productFixtures.jPullPebbleGrey.id,
    url: 'https://cdn.lomashwood.com/products/jpull-grey-1.jpg',
    altText: 'J-Pull Pebble Grey Kitchen - Main View',
    isPrimary: true,
    displayOrder: 1,
    createdAt: new Date('2024-01-10T00:00:00Z'),
    updatedAt: new Date('2024-01-10T00:00:00Z'),
  } as const,

  shakerNavy1: {
    id: '990e8400-e29b-41d4-a716-446655440005',
    productId: productFixtures.shakerNavyKitchen.id,
    url: 'https://cdn.lomashwood.com/products/shaker-navy-1.jpg',
    altText: 'Shaker Navy Blue Kitchen - Main View',
    isPrimary: true,
    displayOrder: 1,
    createdAt: new Date('2024-01-20T00:00:00Z'),
    updatedAt: new Date('2024-01-20T00:00:00Z'),
  } as const,

  walnutBedroom1: {
    id: '990e8400-e29b-41d4-a716-446655440006',
    productId: productFixtures.classicWalnutBedroom.id,
    url: 'https://cdn.lomashwood.com/products/walnut-bedroom-1.jpg',
    altText: 'Classic Walnut Bedroom - Main View',
    isPrimary: true,
    displayOrder: 1,
    createdAt: new Date('2024-01-18T00:00:00Z'),
    updatedAt: new Date('2024-01-18T00:00:00Z'),
  } as const,
};


export const productColourFixtures = {
  lunaWhite: {
    id: 'aa0e8400-e29b-41d4-a716-446655440001',
    productId: productFixtures.lunaWhiteKitchen.id,
    colourId: colourFixtures.white.id,
    isPrimary: true,
    createdAt: new Date('2024-01-15T00:00:00Z'),
  } as const,

  lunaGrey: {
    id: 'aa0e8400-e29b-41d4-a716-446655440002',
    productId: productFixtures.lunaWhiteKitchen.id,
    colourId: colourFixtures.pebbleGrey.id,
    isPrimary: false,
    createdAt: new Date('2024-01-15T00:00:00Z'),
  } as const,

  jPullGrey: {
    id: 'aa0e8400-e29b-41d4-a716-446655440003',
    productId: productFixtures.jPullPebbleGrey.id,
    colourId: colourFixtures.pebbleGrey.id,
    isPrimary: true,
    createdAt: new Date('2024-01-10T00:00:00Z'),
  } as const,

  jPullWhite: {
    id: 'aa0e8400-e29b-41d4-a716-446655440004',
    productId: productFixtures.jPullPebbleGrey.id,
    colourId: colourFixtures.white.id,
    isPrimary: false,
    createdAt: new Date('2024-01-10T00:00:00Z'),
  } as const,

  shakerNavy: {
    id: 'aa0e8400-e29b-41d4-a716-446655440005',
    productId: productFixtures.shakerNavyKitchen.id,
    colourId: colourFixtures.navyBlue.id,
    isPrimary: true,
    createdAt: new Date('2024-01-20T00:00:00Z'),
  } as const,

  walnutBedroom: {
    id: 'aa0e8400-e29b-41d4-a716-446655440006',
    productId: productFixtures.classicWalnutBedroom.id,
    colourId: colourFixtures.walnut.id,
    isPrimary: true,
    createdAt: new Date('2024-01-18T00:00:00Z'),
  } as const,

  whiteBedroom: {
    id: 'aa0e8400-e29b-41d4-a716-446655440007',
    productId: productFixtures.modernWhiteBedroom.id,
    colourId: colourFixtures.white.id,
    isPrimary: true,
    createdAt: new Date('2024-01-22T00:00:00Z'),
  } as const,
};


export const productSizeFixtures = {
  lunaBase: {
    id: 'bb0e8400-e29b-41d4-a716-446655440001',
    productId: productFixtures.lunaWhiteKitchen.id,
    sizeId: sizeFixtures.standardBase.id,
    priceModifier: 0,
    stockQuantity: 50,
    createdAt: new Date('2024-01-15T00:00:00Z'),
  } as const,

  lunaLargeBase: {
    id: 'bb0e8400-e29b-41d4-a716-446655440002',
    productId: productFixtures.lunaWhiteKitchen.id,
    sizeId: sizeFixtures.largeBase.id,
    priceModifier: 150.00,
    stockQuantity: 30,
    createdAt: new Date('2024-01-15T00:00:00Z'),
  } as const,

  lunaWall: {
    id: 'bb0e8400-e29b-41d4-a716-446655440003',
    productId: productFixtures.lunaWhiteKitchen.id,
    sizeId: sizeFixtures.wallUnit.id,
    priceModifier: -200.00,
    stockQuantity: 75,
    createdAt: new Date('2024-01-15T00:00:00Z'),
  } as const,

  walnutWardrobe: {
    id: 'bb0e8400-e29b-41d4-a716-446655440004',
    productId: productFixtures.classicWalnutBedroom.id,
    sizeId: sizeFixtures.wardrobeDouble.id,
    priceModifier: 0,
    stockQuantity: 15,
    createdAt: new Date('2024-01-18T00:00:00Z'),
  } as const,
};


export const inventoryFixtures = {
  lunaWhiteInventory: {
    id: 'cc0e8400-e29b-41d4-a716-446655440001',
    productId: productFixtures.lunaWhiteKitchen.id,
    sku: productFixtures.lunaWhiteKitchen.sku,
    quantityAvailable: 100,
    quantityReserved: 5,
    quantityOnOrder: 50,
    reorderPoint: 10,
    reorderQuantity: 25,
    warehouseLocation: 'WH-A-01-15',
    lastRestocked: new Date('2024-02-01T00:00:00Z'),
    createdAt: new Date('2024-01-15T00:00:00Z'),
    updatedAt: new Date('2024-02-01T00:00:00Z'),
  } as const,

  jPullGreyInventory: {
    id: 'cc0e8400-e29b-41d4-a716-446655440002',
    productId: productFixtures.jPullPebbleGrey.id,
    sku: productFixtures.jPullPebbleGrey.sku,
    quantityAvailable: 85,
    quantityReserved: 10,
    quantityOnOrder: 40,
    reorderPoint: 15,
    reorderQuantity: 30,
    warehouseLocation: 'WH-A-02-08',
    lastRestocked: new Date('2024-01-28T00:00:00Z'),
    createdAt: new Date('2024-01-10T00:00:00Z'),
    updatedAt: new Date('2024-01-28T00:00:00Z'),
  } as const,

  shakerNavyInventory: {
    id: 'cc0e8400-e29b-41d4-a716-446655440003',
    productId: productFixtures.shakerNavyKitchen.id,
    sku: productFixtures.shakerNavyKitchen.sku,
    quantityAvailable: 45,
    quantityReserved: 3,
    quantityOnOrder: 20,
    reorderPoint: 8,
    reorderQuantity: 15,
    warehouseLocation: 'WH-B-03-22',
    lastRestocked: new Date('2024-02-05T00:00:00Z'),
    createdAt: new Date('2024-01-20T00:00:00Z'),
    updatedAt: new Date('2024-02-05T00:00:00Z'),
  } as const,

  lowStock: {
    id: 'cc0e8400-e29b-41d4-a716-446655440004',
    productId: productFixtures.modernOakKitchen.id,
    sku: productFixtures.modernOakKitchen.sku,
    quantityAvailable: 5,
    quantityReserved: 2,
    quantityOnOrder: 30,
    reorderPoint: 10,
    reorderQuantity: 25,
    warehouseLocation: 'WH-C-01-05',
    lastRestocked: new Date('2024-01-15T00:00:00Z'),
    createdAt: new Date('2024-01-25T00:00:00Z'),
    updatedAt: new Date('2024-02-08T00:00:00Z'),
  } as const,

  outOfStock: {
    id: 'cc0e8400-e29b-41d4-a716-446655440005',
    productId: productFixtures.inactiveBedroom.id,
    sku: productFixtures.inactiveBedroom.sku,
    quantityAvailable: 0,
    quantityReserved: 0,
    quantityOnOrder: 0,
    reorderPoint: 0,
    reorderQuantity: 0,
    warehouseLocation: 'DISCONTINUED',
    lastRestocked: null,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-12-31T00:00:00Z'),
  } as const,
};

export const pricingFixtures = {
  lunaWhiteBasic: {
    id: 'dd0e8400-e29b-41d4-a716-446655440001',
    productId: productFixtures.lunaWhiteKitchen.id,
    priceType: 'BASE',
    amount: 8999.00,
    currency: 'GBP',
    validFrom: new Date('2024-01-01T00:00:00Z'),
    validTo: null,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as const,

  lunaWhiteSale: {
    id: 'dd0e8400-e29b-41d4-a716-446655440002',
    productId: productFixtures.lunaWhiteKitchen.id,
    priceType: 'SALE',
    amount: 7999.00,
    currency: 'GBP',
    validFrom: new Date('2024-02-01T00:00:00Z'),
    validTo: new Date('2024-02-28T23:59:59Z'),
    isActive: true,
    createdAt: new Date('2024-02-01T00:00:00Z'),
    updatedAt: new Date('2024-02-01T00:00:00Z'),
  } as const,

  jPullGreyBase: {
    id: 'dd0e8400-e29b-41d4-a716-446655440003',
    productId: productFixtures.jPullPebbleGrey.id,
    priceType: 'BASE',
    amount: 9499.00,
    currency: 'GBP',
    validFrom: new Date('2024-01-01T00:00:00Z'),
    validTo: null,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as const,

  shakerNavyBase: {
    id: 'dd0e8400-e29b-41d4-a716-446655440004',
    productId: productFixtures.shakerNavyKitchen.id,
    priceType: 'BASE',
    amount: 12999.00,
    currency: 'GBP',
    validFrom: new Date('2024-01-01T00:00:00Z'),
    validTo: null,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as const,

  walnutBedroomBase: {
    id: 'dd0e8400-e29b-41d4-a716-446655440005',
    productId: productFixtures.classicWalnutBedroom.id,
    priceType: 'BASE',
    amount: 5999.00,
    currency: 'GBP',
    validFrom: new Date('2024-01-01T00:00:00Z'),
    validTo: null,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as const,

  expiredSale: {
    id: 'dd0e8400-e29b-41d4-a716-446655440006',
    productId: productFixtures.shakerNavyKitchen.id,
    priceType: 'SALE',
    amount: 10999.00,
    currency: 'GBP',
    validFrom: new Date('2024-01-01T00:00:00Z'),
    validTo: new Date('2024-01-31T23:59:59Z'),
    isActive: false,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-02-01T00:00:00Z'),
  } as const,
};


export const commonFixtures = {
  validPagination: {
    page: 1,
    limit: 10,
    offset: 0,
  },

  largePagination: {
    page: 1,
    limit: 50,
    offset: 0,
  },

  secondPage: {
    page: 2,
    limit: 10,
    offset: 10,
  },

  dateRanges: {
    last7Days: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      to: new Date(),
    },
    last30Days: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date(),
    },
    currentMonth: {
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      to: new Date(),
    },
  },

  filters: {
    kitchen: {
      categoryId: categoryFixtures.kitchen.id,
      isActive: true,
    },
    bedroom: {
      categoryId: categoryFixtures.bedroom.id,
      isActive: true,
    },
    featured: {
      isFeatured: true,
      isActive: true,
    },
    inStock: {
      stockStatus: 'IN_STOCK',
      isActive: true,
    },
  },

  sortOptions: {
    priceAsc: { field: 'basePrice', order: 'asc' as const },
    priceDesc: { field: 'basePrice', order: 'desc' as const },
    popularityDesc: { field: 'popularity', order: 'desc' as const },
    newestFirst: { field: 'createdAt', order: 'desc' as const },
    nameAsc: { field: 'name', order: 'asc' as const },
  },
};

export const fixtures = {
  categories: categoryFixtures,
  colours: colourFixtures,
  sizes: sizeFixtures,
  products: productFixtures,
  productImages: productImageFixtures,
  productColours: productColourFixtures,
  productSizes: productSizeFixtures,
  inventory: inventoryFixtures,
  pricing: pricingFixtures,
  common: commonFixtures,
};

export default fixtures;



export const getActiveKitchenProducts = () => {
  return Object.values(productFixtures).filter(
    (product) =>
      product.categoryId === categoryFixtures.kitchen.id && product.isActive
  );
};


export const getActiveBedroomProducts = () => {
  return Object.values(productFixtures).filter(
    (product) =>
      product.categoryId === categoryFixtures.bedroom.id && product.isActive
  );
};


export const getFeaturedProducts = () => {
  return Object.values(productFixtures).filter(
    (product) => product.isFeatured && product.isActive
  );
};

export const getProductsOnSale = () => {
  const now = new Date();
  const saleProductIds = Object.values(pricingFixtures)
    .filter(
      (price) =>
        price.priceType === 'SALE' &&
        price.isActive &&
        price.validFrom <= now &&
        (!price.validTo || price.validTo >= now)
    )
    .map((price) => price.productId);

  return Object.values(productFixtures).filter((product) =>
    saleProductIds.includes(product.id)
  );
};


export const getProductsByColour = (colourId: string) => {
  const productIds = Object.values(productColourFixtures)
    .filter((pc) => pc.colourId === colourId)
    .map((pc) => pc.productId);

  return Object.values(productFixtures).filter((product) =>
    productIds.includes(product.id)
  );
};

export const getLowStockProducts = () => {
  return Object.values(inventoryFixtures).filter(
    (inv) => inv.quantityAvailable <= inv.reorderPoint && inv.quantityAvailable > 0
  );
};


export const getOutOfStockProducts = () => {
  return Object.values(inventoryFixtures).filter(
    (inv) => inv.quantityAvailable === 0
  );
};

export const createTestProduct = (overrides: Partial<typeof productFixtures.lunaWhiteKitchen> = {}) => {
  return {
    ...productFixtures.lunaWhiteKitchen,
    id: `test-${Date.now()}`,
    sku: `TEST-SKU-${Date.now()}`,
    slug: `test-product-${Date.now()}`,
    ...overrides,
  };
};


export const createTestCategory = (overrides: Partial<typeof categoryFixtures.kitchen> = {}) => {
  return {
    ...categoryFixtures.kitchen,
    id: `test-cat-${Date.now()}`,
    slug: `test-category-${Date.now()}`,
    ...overrides,
  };
};


export const createTestColour = (overrides: Partial<typeof colourFixtures.white> = {}) => {
  return {
    ...colourFixtures.white,
    id: `test-col-${Date.now()}`,
    ...overrides,
  };
};