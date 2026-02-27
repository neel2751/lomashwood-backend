import { CategoryType } from '../../src/shared/types';
import {
  makeId,
  FIXED_DATE,
  PRODUCT_ID_KITCHEN_1,
  PRODUCT_ID_KITCHEN_2,
  PRODUCT_ID_BEDROOM_1,
  PRODUCT_ID_BEDROOM_2,
  COLOUR_ID_WHITE,
  COLOUR_ID_GREY,
  COLOUR_ID_OAK,
  SIZE_ID_1000MM,
  SIZE_ID_1200MM,
  SIZE_ID_2000MM,
  CURRENCY_GBP,
} from './common.fixture';

export const ORDER_ITEM_KITCHEN_1 = {
  id: makeId(),
  orderId: '',
  productId: PRODUCT_ID_KITCHEN_1,
  productTitle: 'Luna White Kitchen',
  categoryType: CategoryType.KITCHEN,
  rangeId: makeId(),
  rangeName: 'Luna',
  colourId: COLOUR_ID_WHITE,
  colourName: 'White',
  colourHex: '#FFFFFF',
  sizeId: SIZE_ID_1000MM,
  sizeLabel: '1000mm',
  quantity: 1,
  unitPrice: 2499.00,
  lineTotal: 2499.00,
  currency: CURRENCY_GBP,
  imageUrl: 'https://cdn.lomashwood.co.uk/products/luna-white-1000.jpg',
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

export const ORDER_ITEM_KITCHEN_2 = {
  id: makeId(),
  orderId: '',
  productId: PRODUCT_ID_KITCHEN_2,
  productTitle: 'Aldridge Grey Kitchen',
  categoryType: CategoryType.KITCHEN,
  rangeId: makeId(),
  rangeName: 'Aldridge',
  colourId: COLOUR_ID_GREY,
  colourName: 'Grey',
  colourHex: '#808080',
  sizeId: SIZE_ID_1200MM,
  sizeLabel: '1200mm',
  quantity: 2,
  unitPrice: 1899.00,
  lineTotal: 3798.00,
  currency: CURRENCY_GBP,
  imageUrl: 'https://cdn.lomashwood.co.uk/products/aldridge-grey-1200.jpg',
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

export const ORDER_ITEM_BEDROOM_1 = {
  id: makeId(),
  orderId: '',
  productId: PRODUCT_ID_BEDROOM_1,
  productTitle: 'Oxford Fitted Bedroom',
  categoryType: CategoryType.BEDROOM,
  rangeId: makeId(),
  rangeName: 'Oxford',
  colourId: COLOUR_ID_OAK,
  colourName: 'Oak',
  colourHex: '#8B6914',
  sizeId: SIZE_ID_2000MM,
  sizeLabel: '2000mm',
  quantity: 1,
  unitPrice: 3199.00,
  lineTotal: 3199.00,
  currency: CURRENCY_GBP,
  imageUrl: 'https://cdn.lomashwood.co.uk/products/oxford-oak-2000.jpg',
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

export const ORDER_ITEM_BEDROOM_2 = {
  id: makeId(),
  orderId: '',
  productId: PRODUCT_ID_BEDROOM_2,
  productTitle: 'Fitment Bedroom Suite',
  categoryType: CategoryType.BEDROOM,
  rangeId: makeId(),
  rangeName: 'Fitment',
  colourId: COLOUR_ID_WHITE,
  colourName: 'White',
  colourHex: '#FFFFFF',
  sizeId: SIZE_ID_1200MM,
  sizeLabel: '1200mm',
  quantity: 1,
  unitPrice: 2799.00,
  lineTotal: 2799.00,
  currency: CURRENCY_GBP,
  imageUrl: 'https://cdn.lomashwood.co.uk/products/fitment-white-1200.jpg',
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

export const ORDER_ITEMS_KITCHEN_ONLY = [ORDER_ITEM_KITCHEN_1];
export const ORDER_ITEMS_BEDROOM_ONLY = [ORDER_ITEM_BEDROOM_1];
export const ORDER_ITEMS_MIXED = [ORDER_ITEM_KITCHEN_1, ORDER_ITEM_BEDROOM_1];
export const ORDER_ITEMS_MULTI_KITCHEN = [ORDER_ITEM_KITCHEN_1, ORDER_ITEM_KITCHEN_2];
export const ORDER_ITEMS_MULTI_BEDROOM = [ORDER_ITEM_BEDROOM_1, ORDER_ITEM_BEDROOM_2];
export const ORDER_ITEMS_ALL = [
  ORDER_ITEM_KITCHEN_1,
  ORDER_ITEM_KITCHEN_2,
  ORDER_ITEM_BEDROOM_1,
  ORDER_ITEM_BEDROOM_2,
];