import { OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

export interface OrderItemFixture {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  colourId?: string;
  colourName?: string;
  sizeId?: string;
  sizeName?: string;
  customizations?: Record<string, any>;
}

export interface OrderFixture {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  items: OrderItemFixture[];
  shippingAddress?: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postcode: string;
    phone: string;
  };
  billingAddress?: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postcode: string;
    phone: string;
  };
  appointmentId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}


export const kitchenOrderPending: OrderFixture = {
  id: 'ord_kitchen_001',
  orderNumber: 'ORD-2026-001234',
  userId: 'usr_001',
  userEmail: 'john.doe@example.com',
  userName: 'John Doe',
  status: OrderStatus.PENDING,
  paymentStatus: PaymentStatus.PENDING,
  paymentMethod: PaymentMethod.STRIPE,
  subtotal: 8500.00,
  taxAmount: 1700.00,
  shippingAmount: 0.00,
  discountAmount: 500.00,
  totalAmount: 9700.00,
  currency: 'GBP',
  items: [
    {
      id: 'item_001',
      productId: 'prod_kitchen_001',
      productTitle: 'Luna White Kitchen',
      productImage: '/images/kitchens/luna-white.jpg',
      quantity: 1,
      unitPrice: 8500.00,
      totalPrice: 8500.00,
      colourId: 'col_white_001',
      colourName: 'Pure White',
      customizations: {
        cabinetCount: 12,
        worktopMaterial: 'Quartz',
        handleStyle: 'J-Pull',
      },
    },
  ],
  shippingAddress: {
    fullName: 'John Doe',
    addressLine1: '123 High Street',
    addressLine2: 'Flat 4B',
    city: 'London',
    postcode: 'SW1A 1AA',
    phone: '+44 7700 900123',
  },
  billingAddress: {
    fullName: 'John Doe',
    addressLine1: '123 High Street',
    addressLine2: 'Flat 4B',
    city: 'London',
    postcode: 'SW1A 1AA',
    phone: '+44 7700 900123',
  },
  appointmentId: 'apt_001',
  notes: 'Please call before delivery',
  createdAt: new Date('2026-02-10T10:00:00Z'),
  updatedAt: new Date('2026-02-10T10:00:00Z'),
};

export const kitchenOrderConfirmed: OrderFixture = {
  id: 'ord_kitchen_002',
  orderNumber: 'ORD-2026-001235',
  userId: 'usr_002',
  userEmail: 'jane.smith@example.com',
  userName: 'Jane Smith',
  status: OrderStatus.CONFIRMED,
  paymentStatus: PaymentStatus.PAID,
  paymentMethod: PaymentMethod.STRIPE,
  subtotal: 12000.00,
  taxAmount: 2400.00,
  shippingAmount: 150.00,
  discountAmount: 0.00,
  totalAmount: 14550.00,
  currency: 'GBP',
  items: [
    {
      id: 'item_002',
      productId: 'prod_kitchen_002',
      productTitle: 'J-Pull Pebble Grey Gloss Kitchen',
      productImage: '/images/kitchens/j-pull-grey.jpg',
      quantity: 1,
      unitPrice: 12000.00,
      totalPrice: 12000.00,
      colourId: 'col_grey_001',
      colourName: 'Pebble Grey',
      customizations: {
        cabinetCount: 15,
        worktopMaterial: 'Granite',
        handleStyle: 'Handleless',
        includesAppliances: true,
      },
    },
  ],
  shippingAddress: {
    fullName: 'Jane Smith',
    addressLine1: '456 Oak Avenue',
    city: 'Manchester',
    postcode: 'M1 1AA',
    phone: '+44 7700 900456',
  },
  billingAddress: {
    fullName: 'Jane Smith',
    addressLine1: '456 Oak Avenue',
    city: 'Manchester',
    postcode: 'M1 1AA',
    phone: '+44 7700 900456',
  },
  appointmentId: 'apt_002',
  createdAt: new Date('2026-02-09T14:30:00Z'),
  updatedAt: new Date('2026-02-09T15:00:00Z'),
};


export const bedroomOrderProcessing: OrderFixture = {
  id: 'ord_bedroom_001',
  orderNumber: 'ORD-2026-001236',
  userId: 'usr_003',
  userEmail: 'robert.jones@example.com',
  userName: 'Robert Jones',
  status: OrderStatus.PROCESSING,
  paymentStatus: PaymentStatus.PAID,
  paymentMethod: PaymentMethod.STRIPE,
  subtotal: 6500.00,
  taxAmount: 1300.00,
  shippingAmount: 100.00,
  discountAmount: 250.00,
  totalAmount: 7650.00,
  currency: 'GBP',
  items: [
    {
      id: 'item_003',
      productId: 'prod_bedroom_001',
      productTitle: 'Classic Wardrobes Set',
      productImage: '/images/bedrooms/classic-wardrobe.jpg',
      quantity: 2,
      unitPrice: 3250.00,
      totalPrice: 6500.00,
      colourId: 'col_oak_001',
      colourName: 'Natural Oak',
      sizeId: 'size_large',
      sizeName: 'Large (2.4m)',
      customizations: {
        internalDrawers: 6,
        mirrorDoors: true,
        lighting: 'LED Strip',
      },
    },
  ],
  shippingAddress: {
    fullName: 'Robert Jones',
    addressLine1: '789 Park Lane',
    city: 'Birmingham',
    postcode: 'B1 1AA',
    phone: '+44 7700 900789',
  },
  billingAddress: {
    fullName: 'Robert Jones',
    addressLine1: '789 Park Lane',
    city: 'Birmingham',
    postcode: 'B1 1AA',
    phone: '+44 7700 900789',
  },
  notes: 'Assembly service required',
  createdAt: new Date('2026-02-08T09:15:00Z'),
  updatedAt: new Date('2026-02-10T11:00:00Z'),
};

export const bedroomOrderShipped: OrderFixture = {
  id: 'ord_bedroom_002',
  orderNumber: 'ORD-2026-001237',
  userId: 'usr_004',
  userEmail: 'sarah.williams@example.com',
  userName: 'Sarah Williams',
  status: OrderStatus.SHIPPED,
  paymentStatus: PaymentStatus.PAID,
  paymentMethod: PaymentMethod.STRIPE,
  subtotal: 4200.00,
  taxAmount: 840.00,
  shippingAmount: 75.00,
  discountAmount: 200.00,
  totalAmount: 4915.00,
  currency: 'GBP',
  items: [
    {
      id: 'item_004',
      productId: 'prod_bedroom_002',
      productTitle: 'Modern Sliding Wardrobe',
      productImage: '/images/bedrooms/modern-sliding.jpg',
      quantity: 1,
      unitPrice: 4200.00,
      totalPrice: 4200.00,
      colourId: 'col_white_gloss',
      colourName: 'White Gloss',
      sizeId: 'size_medium',
      sizeName: 'Medium (2.0m)',
      customizations: {
        internalDrawers: 4,
        mirrorDoors: false,
        softClose: true,
      },
    },
  ],
  shippingAddress: {
    fullName: 'Sarah Williams',
    addressLine1: '321 Queen Street',
    city: 'Edinburgh',
    postcode: 'EH1 1AA',
    phone: '+44 7700 900321',
  },
  billingAddress: {
    fullName: 'Sarah Williams',
    addressLine1: '321 Queen Street',
    city: 'Edinburgh',
    postcode: 'EH1 1AA',
    phone: '+44 7700 900321',
  },
  appointmentId: 'apt_004',
  createdAt: new Date('2026-02-05T16:20:00Z'),
  updatedAt: new Date('2026-02-09T10:30:00Z'),
};

export const combinedOrderCompleted: OrderFixture = {
  id: 'ord_combined_001',
  orderNumber: 'ORD-2026-001238',
  userId: 'usr_005',
  userEmail: 'michael.brown@example.com',
  userName: 'Michael Brown',
  status: OrderStatus.DELIVERED,
  paymentStatus: PaymentStatus.PAID,
  paymentMethod: PaymentMethod.STRIPE,
  subtotal: 18500.00,
  taxAmount: 3700.00,
  shippingAmount: 200.00,
  discountAmount: 1500.00,
  totalAmount: 20900.00,
  currency: 'GBP',
  items: [
    {
      id: 'item_005',
      productId: 'prod_kitchen_003',
      productTitle: 'Shaker Style Kitchen',
      productImage: '/images/kitchens/shaker-cream.jpg',
      quantity: 1,
      unitPrice: 11000.00,
      totalPrice: 11000.00,
      colourId: 'col_cream_001',
      colourName: 'Cream',
      customizations: {
        cabinetCount: 14,
        worktopMaterial: 'Solid Wood',
        handleStyle: 'Traditional',
      },
    },
    {
      id: 'item_006',
      productId: 'prod_bedroom_003',
      productTitle: 'Fitted Bedroom Suite',
      productImage: '/images/bedrooms/fitted-suite.jpg',
      quantity: 1,
      unitPrice: 7500.00,
      totalPrice: 7500.00,
      colourId: 'col_walnut_001',
      colourName: 'Walnut',
      sizeId: 'size_custom',
      sizeName: 'Custom (3.5m)',
      customizations: {
        internalDrawers: 8,
        mirrorDoors: true,
        dressingSectionIncluded: true,
      },
    },
  ],
  shippingAddress: {
    fullName: 'Michael Brown',
    addressLine1: '555 Victoria Road',
    city: 'Leeds',
    postcode: 'LS1 1AA',
    phone: '+44 7700 900555',
  },
  billingAddress: {
    fullName: 'Michael Brown',
    addressLine1: '555 Victoria Road',
    city: 'Leeds',
    postcode: 'LS1 1AA',
    phone: '+44 7700 900555',
  },
  appointmentId: 'apt_005',
  notes: 'Both kitchen and bedroom installations - notify both teams',
  createdAt: new Date('2026-01-28T11:00:00Z'),
  updatedAt: new Date('2026-02-07T14:45:00Z'),
};

export const orderCancelled: OrderFixture = {
  id: 'ord_cancelled_001',
  orderNumber: 'ORD-2026-001239',
  userId: 'usr_006',
  userEmail: 'emily.davis@example.com',
  userName: 'Emily Davis',
  status: OrderStatus.CANCELLED,
  paymentStatus: PaymentStatus.REFUNDED,
  paymentMethod: PaymentMethod.STRIPE,
  subtotal: 5800.00,
  taxAmount: 1160.00,
  shippingAmount: 0.00,
  discountAmount: 0.00,
  totalAmount: 6960.00,
  currency: 'GBP',
  items: [
    {
      id: 'item_007',
      productId: 'prod_kitchen_004',
      productTitle: 'Contemporary Kitchen',
      productImage: '/images/kitchens/contemporary.jpg',
      quantity: 1,
      unitPrice: 5800.00,
      totalPrice: 5800.00,
      colourId: 'col_black_001',
      colourName: 'Matt Black',
    },
  ],
  shippingAddress: {
    fullName: 'Emily Davis',
    addressLine1: '888 Elm Street',
    city: 'Bristol',
    postcode: 'BS1 1AA',
    phone: '+44 7700 900888',
  },
  billingAddress: {
    fullName: 'Emily Davis',
    addressLine1: '888 Elm Street',
    city: 'Bristol',
    postcode: 'BS1 1AA',
    phone: '+44 7700 900888',
  },
  notes: 'Customer requested cancellation - measurements incorrect',
  createdAt: new Date('2026-02-06T13:00:00Z'),
  updatedAt: new Date('2026-02-07T09:30:00Z'),
};


export const packageDealOrder: OrderFixture = {
  id: 'ord_package_001',
  orderNumber: 'ORD-2026-001240',
  userId: 'usr_007',
  userEmail: 'david.wilson@example.com',
  userName: 'David Wilson',
  status: OrderStatus.CONFIRMED,
  paymentStatus: PaymentStatus.PAID,
  paymentMethod: PaymentMethod.STRIPE,
  subtotal: 15000.00,
  taxAmount: 3000.00,
  shippingAmount: 0.00,
  discountAmount: 3000.00,
  totalAmount: 15000.00,
  currency: 'GBP',
  items: [
    {
      id: 'item_008',
      productId: 'prod_package_001',
      productTitle: 'Complete Home Package - Kitchen + Bedroom',
      productImage: '/images/packages/home-complete.jpg',
      quantity: 1,
      unitPrice: 15000.00,
      totalPrice: 15000.00,
      customizations: {
        packageType: 'Complete Home',
        kitchenCabinets: 12,
        bedroomWardrobes: 2,
        includesInstallation: true,
        includesDesignConsultation: true,
      },
    },
  ],
  shippingAddress: {
    fullName: 'David Wilson',
    addressLine1: '999 Castle Road',
    city: 'Newcastle',
    postcode: 'NE1 1AA',
    phone: '+44 7700 900999',
  },
  billingAddress: {
    fullName: 'David Wilson',
    addressLine1: '999 Castle Road',
    city: 'Newcastle',
    postcode: 'NE1 1AA',
    phone: '+44 7700 900999',
  },
  appointmentId: 'apt_007',
  notes: 'Package deal - 20% discount applied',
  createdAt: new Date('2026-02-11T08:00:00Z'),
  updatedAt: new Date('2026-02-11T09:00:00Z'),
};


export const saleOrder: OrderFixture = {
  id: 'ord_sale_001',
  orderNumber: 'ORD-2026-001241',
  userId: 'usr_008',
  userEmail: 'laura.taylor@example.com',
  userName: 'Laura Taylor',
  status: OrderStatus.PENDING,
  paymentStatus: PaymentStatus.PENDING,
  paymentMethod: PaymentMethod.STRIPE,
  subtotal: 7000.00,
  taxAmount: 1400.00,
  shippingAmount: 100.00,
  discountAmount: 1750.00,
  totalAmount: 6750.00,
  currency: 'GBP',
  items: [
    {
      id: 'item_009',
      productId: 'prod_kitchen_005',
      productTitle: 'Spring Sale Kitchen - Modern Gloss',
      productImage: '/images/kitchens/modern-gloss.jpg',
      quantity: 1,
      unitPrice: 7000.00,
      totalPrice: 7000.00,
      colourId: 'col_blue_001',
      colourName: 'Ocean Blue',
      customizations: {
        cabinetCount: 10,
        saleDiscount: 25,
        worktopMaterial: 'Laminate',
      },
    },
  ],
  shippingAddress: {
    fullName: 'Laura Taylor',
    addressLine1: '222 Maple Drive',
    city: 'Liverpool',
    postcode: 'L1 1AA',
    phone: '+44 7700 900222',
  },
  billingAddress: {
    fullName: 'Laura Taylor',
    addressLine1: '222 Maple Drive',
    city: 'Liverpool',
    postcode: 'L1 1AA',
    phone: '+44 7700 900222',
  },
  notes: '25% Spring Sale discount applied',
  createdAt: new Date('2026-02-12T10:00:00Z'),
  updatedAt: new Date('2026-02-12T10:00:00Z'),
};


export const orderFixtures: OrderFixture[] = [
  kitchenOrderPending,
  kitchenOrderConfirmed,
  bedroomOrderProcessing,
  bedroomOrderShipped,
  combinedOrderCompleted,
  orderCancelled,
  packageDealOrder,
  saleOrder,
];


export const getOrderById = (id: string): OrderFixture | undefined => {
  return orderFixtures.find(order => order.id === id);
};

export const getOrdersByStatus = (status: OrderStatus): OrderFixture[] => {
  return orderFixtures.filter(order => order.status === status);
};

export const getOrdersByUserId = (userId: string): OrderFixture[] => {
  return orderFixtures.filter(order => order.userId === userId);
};

export const getOrdersByPaymentStatus = (paymentStatus: PaymentStatus): OrderFixture[] => {
  return orderFixtures.filter(order => order.paymentStatus === paymentStatus);
};

export const getKitchenOrders = (): OrderFixture[] => {
  return orderFixtures.filter(order => 
    order.items.some(item => item.productId.includes('kitchen'))
  );
};

export const getBedroomOrders = (): OrderFixture[] => {
  return orderFixtures.filter(order => 
    order.items.some(item => item.productId.includes('bedroom'))
  );
};

export const getCombinedOrders = (): OrderFixture[] => {
  return orderFixtures.filter(order => 
    order.items.some(item => item.productId.includes('kitchen')) &&
    order.items.some(item => item.productId.includes('bedroom'))
  );
};


export const createOrderFixture = (overrides: Partial<OrderFixture> = {}): OrderFixture => {
  const timestamp = new Date();
  const defaultOrder: OrderFixture = {
    id: `ord_${Date.now()}`,
    orderNumber: `ORD-2026-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`,
    userId: 'usr_default',
    userEmail: 'customer@example.com',
    userName: 'Test Customer',
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    paymentMethod: PaymentMethod.STRIPE,
    subtotal: 5000.00,
    taxAmount: 1000.00,
    shippingAmount: 100.00,
    discountAmount: 0.00,
    totalAmount: 6100.00,
    currency: 'GBP',
    items: [
      {
        id: `item_${Date.now()}`,
        productId: 'prod_default',
        productTitle: 'Test Product',
        productImage: '/images/test.jpg',
        quantity: 1,
        unitPrice: 5000.00,
        totalPrice: 5000.00,
      },
    ],
    shippingAddress: {
      fullName: 'Test Customer',
      addressLine1: '123 Test Street',
      city: 'London',
      postcode: 'SW1A 1AA',
      phone: '+44 7700 900000',
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };

  return defaultOrder;
};

export default {
  orderFixtures,
  kitchenOrderPending,
  kitchenOrderConfirmed,
  bedroomOrderProcessing,
  bedroomOrderShipped,
  combinedOrderCompleted,
  orderCancelled,
  packageDealOrder,
  saleOrder,
  getOrderById,
  getOrdersByStatus,
  getOrdersByUserId,
  getOrdersByPaymentStatus,
  getKitchenOrders,
  getBedroomOrders,
  getCombinedOrders,
  createOrderFixture,
};