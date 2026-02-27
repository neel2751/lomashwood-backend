
export interface ProductFixture {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  categoryId: string;
  categoryName: string;
  subCategoryId?: string;
  subCategoryName?: string;
  type: 'MODULAR' | 'CUSTOM' | 'READY_MADE' | 'ACCESSORY';
  material: string;
  finish: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'mm' | 'cm' | 'inch' | 'feet';
  };
  weight?: {
    value: number;
    unit: 'kg' | 'lbs';
  };
  colours: string[];
  sizes: string[];
  price: {
    basePrice: number;
    salePrice?: number;
    currency: 'INR' | 'USD';
    taxRate: number;
  };
  inventory: {
    stockQuantity: number;
    lowStockThreshold: number;
    inStock: boolean;
    backorderable: boolean;
  };
  images: {
    main: string;
    gallery: string[];
    thumbnail: string;
  };
  features: string[];
  specifications: Record<string, string>;
  tags: string[];
  seoMetadata: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
  };
  isPublished: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isBestseller: boolean;
  rating?: {
    average: number;
    count: number;
  };
  customizable: boolean;
  customizationOptions?: {
    colours?: boolean;
    dimensions?: boolean;
    material?: boolean;
    finish?: boolean;
  };
  leadTime?: {
    min: number;
    max: number;
    unit: 'days' | 'weeks';
  };
  warranty?: {
    duration: number;
    unit: 'months' | 'years';
    terms?: string;
  };
  manufacturer?: string;
  brandName?: string;
  countryOfOrigin?: string;
  assemblyRequired: boolean;
  installationIncluded: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}


export interface ProductVariantFixture {
  id: string;
  productId: string;
  sku: string;
  colourId: string;
  sizeId: string;
  price: number;
  stockQuantity: number;
  images: string[];
  isActive: boolean;
}


export const modularKitchenBaseUnit: ProductFixture = {
  id: 'prod_kitchen_001',
  sku: 'LW-KIT-BASE-001',
  name: 'Modular Kitchen Base Unit - Premium Finish',
  slug: 'modular-kitchen-base-unit-premium',
  description: 'Premium modular kitchen base unit with soft-close drawers and adjustable shelves. Crafted from high-quality plywood with moisture-resistant coating. Perfect for modern Indian kitchens.',
  shortDescription: 'Premium base unit with soft-close drawers',
  categoryId: 'cat_kitchen_001',
  categoryName: 'Kitchen',
  subCategoryId: 'subcat_base_001',
  subCategoryName: 'Base Units',
  type: 'MODULAR',
  material: 'Marine Plywood',
  finish: 'Laminate',
  dimensions: {
    length: 900,
    width: 600,
    height: 850,
    unit: 'mm',
  },
  weight: {
    value: 45,
    unit: 'kg',
  },
  colours: ['colour_white_001', 'colour_grey_001', 'colour_walnut_001'],
  sizes: ['size_standard_001', 'size_large_001'],
  price: {
    basePrice: 18500,
    salePrice: 16650,
    currency: 'INR',
    taxRate: 18,
  },
  inventory: {
    stockQuantity: 35,
    lowStockThreshold: 10,
    inStock: true,
    backorderable: true,
  },
  images: {
    main: '/images/products/kitchen/base-unit-main.jpg',
    gallery: [
      '/images/products/kitchen/base-unit-1.jpg',
      '/images/products/kitchen/base-unit-2.jpg',
      '/images/products/kitchen/base-unit-3.jpg',
      '/images/products/kitchen/base-unit-4.jpg',
    ],
    thumbnail: '/images/products/kitchen/base-unit-thumb.jpg',
  },
  features: [
    'Soft-close drawer mechanism',
    'Moisture-resistant marine plywood',
    'Adjustable internal shelves',
    'Anti-bacterial laminate finish',
    'Termite and borer proof treatment',
    'Easy to clean surface',
  ],
  specifications: {
    'Carcass Material': 'BWP Grade Marine Plywood',
    'Shutter Material': 'MDF with laminate',
    'Drawer Type': 'Telescopic soft-close',
    'Hardware': 'Hettich/Blum',
    'Edge Banding': 'PVC',
    'Load Capacity': '50 kg per shelf',
    'Finish Type': 'Anti-fingerprint laminate',
  },
  tags: ['modular', 'kitchen', 'base-unit', 'soft-close', 'premium'],
  seoMetadata: {
    metaTitle: 'Premium Modular Kitchen Base Unit | Lomash Wood',
    metaDescription: 'Buy premium modular kitchen base units with soft-close drawers. Moisture-resistant marine plywood construction. Free installation in Ahmedabad.',
    metaKeywords: ['modular kitchen', 'base unit', 'kitchen cabinets', 'lomash wood'],
  },
  isPublished: true,
  isFeatured: true,
  isNew: false,
  isBestseller: true,
  rating: {
    average: 4.7,
    count: 156,
  },
  customizable: true,
  customizationOptions: {
    colours: true,
    dimensions: true,
    material: false,
    finish: true,
  },
  leadTime: {
    min: 15,
    max: 21,
    unit: 'days',
  },
  warranty: {
    duration: 5,
    unit: 'years',
    terms: 'Manufacturer warranty against manufacturing defects',
  },
  manufacturer: 'Lomash Wood Industries',
  brandName: 'Lomash Wood',
  countryOfOrigin: 'India',
  assemblyRequired: true,
  installationIncluded: true,
  createdAt: new Date('2024-01-15T10:00:00.000Z'),
  updatedAt: new Date('2024-02-10T14:30:00.000Z'),
  deletedAt: null,
};

export const modularKitchenWallUnit: ProductFixture = {
  id: 'prod_kitchen_002',
  sku: 'LW-KIT-WALL-002',
  name: 'Modular Kitchen Wall Cabinet with Glass Shutters',
  slug: 'modular-kitchen-wall-cabinet-glass',
  description: 'Elegant wall-mounted kitchen cabinet with frosted glass shutters. Features internal LED lighting and adjustable shelves. Ideal for displaying crockery and storing essentials.',
  shortDescription: 'Wall cabinet with glass shutters and LED lighting',
  categoryId: 'cat_kitchen_001',
  categoryName: 'Kitchen',
  subCategoryId: 'subcat_wall_001',
  subCategoryName: 'Wall Units',
  type: 'MODULAR',
  material: 'Marine Plywood',
  finish: 'Laminate with Glass',
  dimensions: {
    length: 900,
    width: 350,
    height: 700,
    unit: 'mm',
  },
  weight: {
    value: 28,
    unit: 'kg',
  },
  colours: ['colour_white_001', 'colour_beige_001', 'colour_grey_001'],
  sizes: ['size_standard_001'],
  price: {
    basePrice: 14200,
    salePrice: 12780,
    currency: 'INR',
    taxRate: 18,
  },
  inventory: {
    stockQuantity: 42,
    lowStockThreshold: 15,
    inStock: true,
    backorderable: true,
  },
  images: {
    main: '/images/products/kitchen/wall-unit-main.jpg',
    gallery: [
      '/images/products/kitchen/wall-unit-1.jpg',
      '/images/products/kitchen/wall-unit-2.jpg',
      '/images/products/kitchen/wall-unit-3.jpg',
    ],
    thumbnail: '/images/products/kitchen/wall-unit-thumb.jpg',
  },
  features: [
    'Frosted glass shutters',
    'Internal LED strip lighting',
    'Adjustable glass shelves',
    'Soft-close hinges',
    'Wall mounting hardware included',
    'Anti-scratch coating',
  ],
  specifications: {
    'Carcass Material': 'BWP Grade Marine Plywood',
    'Shutter Material': '5mm frosted glass with aluminum frame',
    'Hardware': 'Hettich soft-close hinges',
    'Lighting': 'LED strip (12V)',
    'Shelf Material': 'Toughened glass',
    'Load Capacity': '20 kg per shelf',
  },
  tags: ['modular', 'kitchen', 'wall-cabinet', 'glass', 'led-lighting'],
  seoMetadata: {
    metaTitle: 'Kitchen Wall Cabinet with Glass Shutters | Lomash Wood',
    metaDescription: 'Premium wall-mounted kitchen cabinets with frosted glass and LED lighting. Perfect for modern modular kitchens.',
    metaKeywords: ['wall cabinet', 'kitchen storage', 'glass cabinet', 'modular kitchen'],
  },
  isPublished: true,
  isFeatured: true,
  isNew: true,
  isBestseller: false,
  rating: {
    average: 4.6,
    count: 89,
  },
  customizable: true,
  customizationOptions: {
    colours: true,
    dimensions: true,
    material: false,
    finish: true,
  },
  leadTime: {
    min: 18,
    max: 25,
    unit: 'days',
  },
  warranty: {
    duration: 5,
    unit: 'years',
    terms: 'Warranty covers manufacturing defects only',
  },
  manufacturer: 'Lomash Wood Industries',
  brandName: 'Lomash Wood',
  countryOfOrigin: 'India',
  assemblyRequired: true,
  installationIncluded: true,
  createdAt: new Date('2024-02-01T09:00:00.000Z'),
  updatedAt: new Date('2024-02-11T11:20:00.000Z'),
  deletedAt: null,
};


export const kitchenTallUnit: ProductFixture = {
  id: 'prod_kitchen_003',
  sku: 'LW-KIT-TALL-003',
  name: 'Kitchen Tall Storage Unit - Pantry Cabinet',
  slug: 'kitchen-tall-storage-pantry-cabinet',
  description: 'Spacious tall unit perfect for pantry storage. Multiple adjustable shelves, pull-out drawers, and dedicated sections for different storage needs.',
  shortDescription: 'Tall pantry unit with pull-out shelves',
  categoryId: 'cat_kitchen_001',
  categoryName: 'Kitchen',
  subCategoryId: 'subcat_tall_001',
  subCategoryName: 'Tall Units',
  type: 'MODULAR',
  material: 'Marine Plywood',
  finish: 'Laminate',
  dimensions: {
    length: 600,
    width: 600,
    height: 2100,
    unit: 'mm',
  },
  weight: {
    value: 75,
    unit: 'kg',
  },
  colours: ['colour_white_001', 'colour_oak_001', 'colour_walnut_001'],
  sizes: ['size_standard_001'],
  price: {
    basePrice: 24500,
    currency: 'INR',
    taxRate: 18,
  },
  inventory: {
    stockQuantity: 18,
    lowStockThreshold: 8,
    inStock: true,
    backorderable: true,
  },
  images: {
    main: '/images/products/kitchen/tall-unit-main.jpg',
    gallery: [
      '/images/products/kitchen/tall-unit-1.jpg',
      '/images/products/kitchen/tall-unit-2.jpg',
    ],
    thumbnail: '/images/products/kitchen/tall-unit-thumb.jpg',
  },
  features: [
    'Full-length storage',
    'Pull-out wire baskets',
    'Adjustable shelves',
    'Soft-close door mechanism',
    'Anti-slip shelf liners',
    'Integrated handle design',
  ],
  specifications: {
    'Carcass Material': 'BWP Marine Plywood - 18mm',
    'Shutter Material': 'MDF with laminate - 18mm',
    'Internal Shelves': '6 adjustable',
    'Drawer Baskets': '3 pull-out wire baskets',
    'Hardware': 'Hettich/Blum premium',
    'Load Capacity': '80 kg total',
  },
  tags: ['tall-unit', 'pantry', 'storage', 'kitchen', 'modular'],
  seoMetadata: {
    metaTitle: 'Kitchen Tall Pantry Cabinet | Storage Unit | Lomash Wood',
    metaDescription: 'Buy spacious kitchen tall units for pantry storage. Pull-out baskets and adjustable shelves. Premium quality modular kitchen furniture.',
    metaKeywords: ['tall unit', 'pantry cabinet', 'kitchen storage'],
  },
  isPublished: true,
  isFeatured: false,
  isNew: false,
  isBestseller: true,
  rating: {
    average: 4.8,
    count: 124,
  },
  customizable: true,
  customizationOptions: {
    colours: true,
    dimensions: false,
    material: false,
    finish: true,
  },
  leadTime: {
    min: 20,
    max: 28,
    unit: 'days',
  },
  warranty: {
    duration: 5,
    unit: 'years',
  },
  manufacturer: 'Lomash Wood Industries',
  brandName: 'Lomash Wood',
  countryOfOrigin: 'India',
  assemblyRequired: true,
  installationIncluded: true,
  createdAt: new Date('2024-01-10T08:00:00.000Z'),
  updatedAt: new Date('2024-02-05T16:45:00.000Z'),
  deletedAt: null,
};


export const slidingDoorWardrobe: ProductFixture = {
  id: 'prod_bedroom_001',
  sku: 'LW-BED-WARD-001',
  name: 'Premium Sliding Door Wardrobe - 3 Door',
  slug: 'premium-sliding-door-wardrobe-3-door',
  description: 'Luxurious 3-door sliding wardrobe with mirror panel. Features hanging rods, shelves, and drawers. Spacious interior with organized compartments for all your storage needs.',
  shortDescription: 'Spacious 3-door sliding wardrobe with mirror',
  categoryId: 'cat_bedroom_001',
  categoryName: 'Bedroom',
  subCategoryId: 'subcat_wardrobe_001',
  subCategoryName: 'Wardrobes',
  type: 'MODULAR',
  material: 'Marine Plywood',
  finish: 'Laminate with Mirror',
  dimensions: {
    length: 2400,
    width: 600,
    height: 2400,
    unit: 'mm',
  },
  weight: {
    value: 180,
    unit: 'kg',
  },
  colours: ['colour_walnut_001', 'colour_white_001', 'colour_oak_001'],
  sizes: ['size_large_001'],
  price: {
    basePrice: 58900,
    salePrice: 52990,
    currency: 'INR',
    taxRate: 18,
  },
  inventory: {
    stockQuantity: 12,
    lowStockThreshold: 5,
    inStock: true,
    backorderable: true,
  },
  images: {
    main: '/images/products/bedroom/wardrobe-sliding-main.jpg',
    gallery: [
      '/images/products/bedroom/wardrobe-sliding-1.jpg',
      '/images/products/bedroom/wardrobe-sliding-2.jpg',
      '/images/products/bedroom/wardrobe-sliding-3.jpg',
      '/images/products/bedroom/wardrobe-sliding-4.jpg',
    ],
    thumbnail: '/images/products/bedroom/wardrobe-sliding-thumb.jpg',
  },
  features: [
    '3 sliding doors with soft-close mechanism',
    '1 mirror panel for dressing',
    'Hanging rods for long and short garments',
    '5 internal drawers with soft-close',
    'Multiple shelves for folded clothes',
    'Dedicated shoe rack section',
    'Internal LED lighting',
    'Anti-dust bottom sealing',
  ],
  specifications: {
    'Carcass Material': 'BWP Marine Plywood - 18mm',
    'Shutter Material': 'MDF with laminate - 18mm',
    'Mirror': '5mm silver mirror',
    'Sliding Track': 'Aluminum premium track',
    'Internal Fittings': 'Chromium-plated rods and organizers',
    'Drawers': '5 soft-close drawers',
    'Shelves': '8 adjustable shelves',
    'Hardware': 'Hettich premium',
  },
  tags: ['wardrobe', 'sliding-door', 'bedroom', 'mirror', 'storage'],
  seoMetadata: {
    metaTitle: '3 Door Sliding Wardrobe with Mirror | Lomash Wood',
    metaDescription: 'Premium sliding door wardrobe with mirror panel. Spacious storage with drawers and shelves. Perfect for modern bedrooms.',
    metaKeywords: ['sliding wardrobe', 'bedroom wardrobe', 'mirror wardrobe'],
  },
  isPublished: true,
  isFeatured: true,
  isNew: false,
  isBestseller: true,
  rating: {
    average: 4.9,
    count: 203,
  },
  customizable: true,
  customizationOptions: {
    colours: true,
    dimensions: true,
    material: false,
    finish: true,
  },
  leadTime: {
    min: 25,
    max: 35,
    unit: 'days',
  },
  warranty: {
    duration: 7,
    unit: 'years',
    terms: 'Comprehensive warranty on all parts',
  },
  manufacturer: 'Lomash Wood Industries',
  brandName: 'Lomash Wood',
  countryOfOrigin: 'India',
  assemblyRequired: true,
  installationIncluded: true,
  createdAt: new Date('2024-01-05T10:30:00.000Z'),
  updatedAt: new Date('2024-02-12T09:15:00.000Z'),
  deletedAt: null,
};


export const bedroomDresser: ProductFixture = {
  id: 'prod_bedroom_002',
  sku: 'LW-BED-DRESS-002',
  name: 'Contemporary Bedroom Dresser with Mirror',
  slug: 'contemporary-bedroom-dresser-mirror',
  description: 'Elegant bedroom dresser with large mirror and ample storage. Features multiple drawers with soft-close mechanism and dedicated jewelry compartment.',
  shortDescription: 'Modern dresser with mirror and soft-close drawers',
  categoryId: 'cat_bedroom_001',
  categoryName: 'Bedroom',
  subCategoryId: 'subcat_dresser_001',
  subCategoryName: 'Dressers',
  type: 'READY_MADE',
  material: 'Engineered Wood',
  finish: 'Veneer',
  dimensions: {
    length: 1200,
    width: 450,
    height: 750,
    unit: 'mm',
  },
  weight: {
    value: 65,
    unit: 'kg',
  },
  colours: ['colour_walnut_001', 'colour_mahogany_001'],
  sizes: ['size_standard_001'],
  price: {
    basePrice: 32800,
    salePrice: 29520,
    currency: 'INR',
    taxRate: 18,
  },
  inventory: {
    stockQuantity: 8,
    lowStockThreshold: 3,
    inStock: true,
    backorderable: false,
  },
  images: {
    main: '/images/products/bedroom/dresser-main.jpg',
    gallery: [
      '/images/products/bedroom/dresser-1.jpg',
      '/images/products/bedroom/dresser-2.jpg',
    ],
    thumbnail: '/images/products/bedroom/dresser-thumb.jpg',
  },
  features: [
    '6 spacious drawers',
    'Soft-close drawer mechanism',
    'Large oval mirror (60cm x 90cm)',
    'Dedicated jewelry tray',
    'Cable management for hair dryer',
    'Anti-tarnish lining',
  ],
  specifications: {
    'Body Material': 'Engineered wood',
    'Finish': 'Natural wood veneer',
    'Mirror Size': '600mm x 900mm',
    'Drawer Slides': 'Telescopic soft-close',
    'Hardware': 'Blum premium',
    'Drawer Count': '6',
  },
  tags: ['dresser', 'bedroom', 'mirror', 'storage', 'contemporary'],
  seoMetadata: {
    metaTitle: 'Bedroom Dresser with Mirror | Contemporary Design | Lomash Wood',
    metaDescription: 'Buy contemporary bedroom dresser with large mirror. Soft-close drawers and elegant veneer finish.',
    metaKeywords: ['bedroom dresser', 'dresser with mirror', 'bedroom furniture'],
  },
  isPublished: true,
  isFeatured: false,
  isNew: true,
  isBestseller: false,
  rating: {
    average: 4.5,
    count: 67,
  },
  customizable: false,
  leadTime: {
    min: 10,
    max: 15,
    unit: 'days',
  },
  warranty: {
    duration: 3,
    unit: 'years',
  },
  manufacturer: 'Lomash Wood Industries',
  brandName: 'Lomash Wood',
  countryOfOrigin: 'India',
  assemblyRequired: true,
  installationIncluded: false,
  createdAt: new Date('2024-02-01T11:00:00.000Z'),
  updatedAt: new Date('2024-02-10T15:30:00.000Z'),
  deletedAt: null,
};

export const bedsideTable: ProductFixture = {
  id: 'prod_bedroom_003',
  sku: 'LW-BED-SIDE-003',
  name: 'Minimalist Bedside Table - Night Stand',
  slug: 'minimalist-bedside-table-night-stand',
  description: 'Compact and elegant bedside table with drawer and open shelf. Perfect companion for modern bedrooms with minimalist aesthetics.',
  shortDescription: 'Compact bedside table with drawer',
  categoryId: 'cat_bedroom_001',
  categoryName: 'Bedroom',
  subCategoryId: 'subcat_bedside_001',
  subCategoryName: 'Bedside Tables',
  type: 'READY_MADE',
  material: 'Engineered Wood',
  finish: 'Melamine',
  dimensions: {
    length: 450,
    width: 400,
    height: 550,
    unit: 'mm',
  },
  weight: {
    value: 12,
    unit: 'kg',
  },
  colours: ['colour_white_001', 'colour_grey_001', 'colour_oak_001'],
  sizes: ['size_standard_001'],
  price: {
    basePrice: 4500,
    salePrice: 3825,
    currency: 'INR',
    taxRate: 18,
  },
  inventory: {
    stockQuantity: 45,
    lowStockThreshold: 20,
    inStock: true,
    backorderable: true,
  },
  images: {
    main: '/images/products/bedroom/bedside-main.jpg',
    gallery: [
      '/images/products/bedroom/bedside-1.jpg',
      '/images/products/bedroom/bedside-2.jpg',
    ],
    thumbnail: '/images/products/bedroom/bedside-thumb.jpg',
  },
  features: [
    'Single drawer with metal slides',
    'Open shelf for books/magazines',
    'Cable management hole',
    'Scratch-resistant top',
    'Easy assembly',
  ],
  specifications: {
    'Material': 'High-grade MDF',
    'Finish': 'Melamine coating',
    'Drawer': '1 with metal slides',
    'Shelf': '1 open shelf',
    'Top Load Capacity': '15 kg',
  },
  tags: ['bedside', 'nightstand', 'bedroom', 'minimalist', 'compact'],
  seoMetadata: {
    metaTitle: 'Bedside Table Night Stand | Minimalist Design | Lomash Wood',
    metaDescription: 'Compact bedside table with drawer and shelf. Perfect for modern bedrooms. Affordable and elegant.',
    metaKeywords: ['bedside table', 'night stand', 'bedroom furniture'],
  },
  isPublished: true,
  isFeatured: false,
  isNew: false,
  isBestseller: true,
  rating: {
    average: 4.4,
    count: 312,
  },
  customizable: false,
  leadTime: {
    min: 3,
    max: 7,
    unit: 'days',
  },
  warranty: {
    duration: 1,
    unit: 'years',
  },
  manufacturer: 'Lomash Wood Industries',
  brandName: 'Lomash Wood',
  countryOfOrigin: 'India',
  assemblyRequired: true,
  installationIncluded: false,
  createdAt: new Date('2023-11-20T09:00:00.000Z'),
  updatedAt: new Date('2024-02-08T12:00:00.000Z'),
  deletedAt: null,
};

export const kitchenPulloutBasket: ProductFixture = {
  id: 'prod_access_001',
  sku: 'LW-ACC-BASKET-001',
  name: 'Stainless Steel Pull-out Kitchen Basket',
  slug: 'stainless-steel-pullout-kitchen-basket',
  description: 'Premium quality stainless steel pull-out basket for modular kitchens. Smooth telescopic slides with soft-close mechanism.',
  shortDescription: 'SS pull-out basket with soft-close',
  categoryId: 'cat_accessories_001',
  categoryName: 'Accessories',
  subCategoryId: 'subcat_kitchen_acc_001',
  subCategoryName: 'Kitchen Accessories',
  type: 'ACCESSORY',
  material: 'Stainless Steel',
  finish: 'Chrome',
  dimensions: {
    length: 500,
    width: 450,
    height: 150,
    unit: 'mm',
  },
  weight: {
    value: 3.5,
    unit: 'kg',
  },
  colours: ['colour_chrome_001'],
  sizes: ['size_500mm_001', 'size_600mm_001'],
  price: {
    basePrice: 2850,
    salePrice: 2565,
    currency: 'INR',
    taxRate: 18,
  },
  inventory: {
    stockQuantity: 125,
    lowStockThreshold: 30,
    inStock: true,
    backorderable: true,
  },
  images: {
    main: '/images/products/accessories/basket-main.jpg',
    gallery: [
      '/images/products/accessories/basket-1.jpg',
    ],
    thumbnail: '/images/products/accessories/basket-thumb.jpg',
  },
  features: [
    'Corrosion-resistant SS304 grade',
    'Soft-close telescopic slides',
    'Easy to clean mesh design',
    'Load capacity 25 kg',
    'Universal fit',
  ],
  specifications: {
    'Material': 'Stainless Steel 304',
    'Slide Type': 'Telescopic soft-close',
    'Load Capacity': '25 kg',
    'Mounting': 'Bottom mount',
  },
  tags: ['accessory', 'basket', 'pull-out', 'kitchen', 'stainless-steel'],
  seoMetadata: {
    metaTitle: 'Kitchen Pull-out Basket | SS304 | Lomash Wood',
    metaDescription: 'Premium stainless steel pull-out basket for modular kitchens. Soft-close mechanism.',
    metaKeywords: ['pull-out basket', 'kitchen basket', 'modular kitchen accessories'],
  },
  isPublished: true,
  isFeatured: false,
  isNew: false,
  isBestseller: true,
  rating: {
    average: 4.6,
    count: 245,
  },
  customizable: false,
  leadTime: {
    min: 2,
    max: 5,
    unit: 'days',
  },
  warranty: {
    duration: 2,
    unit: 'years',
  },
  manufacturer: 'Premium Hardware Co.',
  brandName: 'Lomash Wood',
  countryOfOrigin: 'India',
  assemblyRequired: false,
  installationIncluded: false,
  createdAt: new Date('2023-10-15T10:00:00.000Z'),
  updatedAt: new Date('2024-02-05T11:30:00.000Z'),
  deletedAt: null,
};


export const outOfStockProduct: ProductFixture = {
  id: 'prod_oos_001',
  sku: 'LW-KIT-CORNER-999',
  name: 'L-Shaped Kitchen Corner Unit',
  slug: 'l-shaped-kitchen-corner-unit',
  description: 'Space-saving L-shaped corner unit for modular kitchens. Currently out of stock.',
  shortDescription: 'L-shaped corner unit',
  categoryId: 'cat_kitchen_001',
  categoryName: 'Kitchen',
  type: 'MODULAR',
  material: 'Marine Plywood',
  finish: 'Laminate',
  dimensions: {
    length: 900,
    width: 900,
    height: 850,
    unit: 'mm',
  },
  colours: ['colour_white_001'],
  sizes: ['size_standard_001'],
  price: {
    basePrice: 22500,
    currency: 'INR',
    taxRate: 18,
  },
  inventory: {
    stockQuantity: 0,
    lowStockThreshold: 5,
    inStock: false,
    backorderable: true,
  },
  images: {
    main: '/images/products/kitchen/corner-unit-main.jpg',
    gallery: [],
    thumbnail: '/images/products/kitchen/corner-unit-thumb.jpg',
  },
  features: ['Corner space utilization', 'Rotating carousel mechanism'],
  specifications: {
    'Material': 'Marine Plywood',
  },
  tags: ['corner', 'kitchen', 'modular'],
  seoMetadata: {},
  isPublished: true,
  isFeatured: false,
  isNew: false,
  isBestseller: false,
  customizable: false,
  leadTime: {
    min: 30,
    max: 40,
    unit: 'days',
  },
  warranty: {
    duration: 5,
    unit: 'years',
  },
  manufacturer: 'Lomash Wood Industries',
  brandName: 'Lomash Wood',
  countryOfOrigin: 'India',
  assemblyRequired: true,
  installationIncluded: true,
  createdAt: new Date('2023-12-01T10:00:00.000Z'),
  updatedAt: new Date('2024-02-01T09:00:00.000Z'),
  deletedAt: null,
};


export const unpublishedProduct: ProductFixture = {
  id: 'prod_draft_001',
  sku: 'LW-BED-PANEL-999',
  name: 'Wall Mounted Headboard Panel',
  slug: 'wall-mounted-headboard-panel',
  description: 'Draft product - not yet published',
  shortDescription: 'Headboard panel',
  categoryId: 'cat_bedroom_001',
  categoryName: 'Bedroom',
  type: 'CUSTOM',
  material: 'MDF',
  finish: 'Fabric',
  dimensions: {
    length: 1800,
    width: 100,
    height: 1200,
    unit: 'mm',
  },
  colours: [],
  sizes: [],
  price: {
    basePrice: 12000,
    currency: 'INR',
    taxRate: 18,
  },
  inventory: {
    stockQuantity: 0,
    lowStockThreshold: 0,
    inStock: false,
    backorderable: false,
  },
  images: {
    main: '/images/products/bedroom/headboard-draft.jpg',
    gallery: [],
    thumbnail: '/images/products/bedroom/headboard-thumb.jpg',
  },
  features: [],
  specifications: {},
  tags: ['headboard', 'bedroom'],
  seoMetadata: {},
  isPublished: false,
  isFeatured: false,
  isNew: false,
  isBestseller: false,
  customizable: true,
  manufacturer: 'Lomash Wood Industries',
  brandName: 'Lomash Wood',
  countryOfOrigin: 'India',
  assemblyRequired: true,
  installationIncluded: false,
  createdAt: new Date('2024-02-11T14:00:00.000Z'),
  updatedAt: new Date('2024-02-11T14:00:00.000Z'),
  deletedAt: null,
};


export const deletedProduct: ProductFixture = {
  id: 'prod_deleted_001',
  sku: 'LW-OLD-DISC-001',
  name: 'Discontinued Kitchen Unit',
  slug: 'discontinued-kitchen-unit',
  description: 'This product has been discontinued',
  shortDescription: 'Discontinued',
  categoryId: 'cat_kitchen_001',
  categoryName: 'Kitchen',
  type: 'MODULAR',
  material: 'Plywood',
  finish: 'Laminate',
  dimensions: {
    length: 600,
    width: 600,
    height: 800,
    unit: 'mm',
  },
  colours: [],
  sizes: [],
  price: {
    basePrice: 15000,
    currency: 'INR',
    taxRate: 18,
  },
  inventory: {
    stockQuantity: 0,
    lowStockThreshold: 0,
    inStock: false,
    backorderable: false,
  },
  images: {
    main: '/images/products/deleted/placeholder.jpg',
    gallery: [],
    thumbnail: '/images/products/deleted/placeholder-thumb.jpg',
  },
  features: [],
  specifications: {},
  tags: ['discontinued'],
  seoMetadata: {},
  isPublished: false,
  isFeatured: false,
  isNew: false,
  isBestseller: false,
  customizable: false,
  manufacturer: 'Lomash Wood Industries',
  brandName: 'Lomash Wood',
  countryOfOrigin: 'India',
  assemblyRequired: true,
  installationIncluded: false,
  createdAt: new Date('2023-06-01T10:00:00.000Z'),
  updatedAt: new Date('2023-12-31T23:59:59.000Z'),
  deletedAt: new Date('2023-12-31T23:59:59.000Z'),
};


export const allProducts: ProductFixture[] = [
  modularKitchenBaseUnit,
  modularKitchenWallUnit,
  kitchenTallUnit,
  slidingDoorWardrobe,
  bedroomDresser,
  bedsideTable,
  kitchenPulloutBasket,
  outOfStockProduct,
  unpublishedProduct,
  deletedProduct,
];


export const activeProducts: ProductFixture[] = allProducts.filter(
  (p) => p.isPublished && !p.deletedAt
);


export const kitchenProducts: ProductFixture[] = allProducts.filter(
  (p) => p.categoryId === 'cat_kitchen_001'
);


export const bedroomProducts: ProductFixture[] = allProducts.filter(
  (p) => p.categoryId === 'cat_bedroom_001'
);


export const featuredProducts: ProductFixture[] = activeProducts.filter(
  (p) => p.isFeatured
);


export const bestsellerProducts: ProductFixture[] = activeProducts.filter(
  (p) => p.isBestseller
);


export const newProducts: ProductFixture[] = activeProducts.filter(
  (p) => p.isNew
);


export const inStockProducts: ProductFixture[] = activeProducts.filter(
  (p) => p.inventory.inStock
);


export const onSaleProducts: ProductFixture[] = activeProducts.filter(
  (p) => p.price.salePrice !== undefined
);


export const baseUnitVariants: ProductVariantFixture[] = [
  {
    id: 'variant_001',
    productId: 'prod_kitchen_001',
    sku: 'LW-KIT-BASE-001-WHT-STD',
    colourId: 'colour_white_001',
    sizeId: 'size_standard_001',
    price: 18500,
    stockQuantity: 20,
    images: ['/images/variants/base-white-standard.jpg'],
    isActive: true,
  },
  {
    id: 'variant_002',
    productId: 'prod_kitchen_001',
    sku: 'LW-KIT-BASE-001-GRY-STD',
    colourId: 'colour_grey_001',
    sizeId: 'size_standard_001',
    price: 18500,
    stockQuantity: 10,
    images: ['/images/variants/base-grey-standard.jpg'],
    isActive: true,
  },
  {
    id: 'variant_003',
    productId: 'prod_kitchen_001',
    sku: 'LW-KIT-BASE-001-WAL-LRG',
    colourId: 'colour_walnut_001',
    sizeId: 'size_large_001',
    price: 20350,
    stockQuantity: 5,
    images: ['/images/variants/base-walnut-large.jpg'],
    isActive: true,
  },
];


export const getProductById = (id: string): ProductFixture | undefined => {
  return allProducts.find((p) => p.id === id);
};


export const getProductBySku = (sku: string): ProductFixture | undefined => {
  return allProducts.find((p) => p.sku === sku);
};


export const getProductBySlug = (slug: string): ProductFixture | undefined => {
  return allProducts.find((p) => p.slug === slug);
};

export const getProductsByCategory = (categoryId: string): ProductFixture[] => {
  return activeProducts.filter((p) => p.categoryId === categoryId);
};


export const getProductsByType = (
  type: ProductFixture['type']
): ProductFixture[] => {
  return activeProducts.filter((p) => p.type === type);
};


export const getProductsByPriceRange = (
  min: number,
  max: number
): ProductFixture[] => {
  return activeProducts.filter((p) => {
    const price = p.price.salePrice || p.price.basePrice;
    return price >= min && price <= max;
  });
};


export const searchProducts = (query: string): ProductFixture[] => {
  const lowerQuery = query.toLowerCase();
  return activeProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
};


export const getLowStockProducts = (): ProductFixture[] => {
  return activeProducts.filter(
    (p) =>
      p.inventory.inStock &&
      p.inventory.stockQuantity <= p.inventory.lowStockThreshold
  );
};

export const mockProduct = (
  overrides?: Partial<ProductFixture>
): ProductFixture => ({
  id: `prod_mock_${Date.now()}`,
  sku: `LW-MOCK-${Date.now()}`,
  name: 'Mock Product',
  slug: 'mock-product',
  description: 'This is a mock product for testing',
  categoryId: 'cat_test_001',
  categoryName: 'Test Category',
  type: 'MODULAR',
  material: 'Wood',
  finish: 'Laminate',
  dimensions: {
    length: 600,
    width: 400,
    height: 800,
    unit: 'mm',
  },
  colours: [],
  sizes: [],
  price: {
    basePrice: 10000,
    currency: 'INR',
    taxRate: 18,
  },
  inventory: {
    stockQuantity: 50,
    lowStockThreshold: 10,
    inStock: true,
    backorderable: true,
  },
  images: {
    main: '/images/mock/main.jpg',
    gallery: [],
    thumbnail: '/images/mock/thumb.jpg',
  },
  features: [],
  specifications: {},
  tags: [],
  seoMetadata: {},
  isPublished: true,
  isFeatured: false,
  isNew: false,
  isBestseller: false,
  customizable: false,
  manufacturer: 'Test Manufacturer',
  brandName: 'Test Brand',
  countryOfOrigin: 'India',
  assemblyRequired: false,
  installationIncluded: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});


export const createProductPayload = (
  overrides?: Partial<Omit<ProductFixture, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>
) => ({
  sku: 'LW-TEST-001',
  name: 'Test Product',
  slug: 'test-product',
  description: 'Test product description',
  categoryId: 'cat_test_001',
  categoryName: 'Test',
  type: 'MODULAR' as const,
  material: 'Wood',
  finish: 'Laminate',
  dimensions: {
    length: 600,
    width: 400,
    height: 800,
    unit: 'mm' as const,
  },
  colours: [],
  sizes: [],
  price: {
    basePrice: 10000,
    currency: 'INR' as const,
    taxRate: 18,
  },
  inventory: {
    stockQuantity: 100,
    lowStockThreshold: 10,
    inStock: true,
    backorderable: true,
  },
  images: {
    main: '/test/main.jpg',
    gallery: [],
    thumbnail: '/test/thumb.jpg',
  },
  features: [],
  specifications: {},
  tags: [],
  seoMetadata: {},
  isPublished: true,
  isFeatured: false,
  isNew: false,
  isBestseller: false,
  customizable: false,
  manufacturer: 'Test',
  brandName: 'Test',
  countryOfOrigin: 'India',
  assemblyRequired: false,
  installationIncluded: false,
  ...overrides,
});


export const updateProductPayload = (
  overrides?: Partial<Pick<ProductFixture, 'name' | 'description' | 'price' | 'inventory' | 'isPublished'>>
) => ({
  name: 'Updated Product Name',
  description: 'Updated product description',
  isPublished: true,
  ...overrides,
});


export default {
  allProducts,
  activeProducts,
  kitchenProducts,
  bedroomProducts,
  featuredProducts,
  bestsellerProducts,
  newProducts,
  inStockProducts,
  onSaleProducts,
  
  modularKitchenBaseUnit,
  modularKitchenWallUnit,
  kitchenTallUnit,
  slidingDoorWardrobe,
  bedroomDresser,
  bedsideTable,
  kitchenPulloutBasket,
  outOfStockProduct,
  unpublishedProduct,
  deletedProduct,
  
  
  baseUnitVariants,
  

  getProductById,
  getProductBySku,
  getProductBySlug,
  getProductsByCategory,
  getProductsByType,
  getProductsByPriceRange,
  searchProducts,
  getLowStockProducts,
  mockProduct,
  createProductPayload,
  updateProductPayload,
};