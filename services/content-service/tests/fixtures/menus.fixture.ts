import { generateId, mockAuditFields, mockCreatedByFields } from './common.fixture';

export type MockMenuLocation = 'PRIMARY_NAV' | 'HAMBURGER_NAV' | 'FOOTER_NAV' | 'FOOTER_LEGAL' | 'MOBILE_NAV';
export type MockMenuItemType = 'LINK' | 'PAGE' | 'CATEGORY' | 'EXTERNAL' | 'SEPARATOR';

export interface MockMenuItem {
  id: string;
  label: string;
  type: MockMenuItemType;
  url: string | null;
  pageId: string | null;
  categoryId: string | null;
  target: '_self' | '_blank';
  icon: string | null;
  order: number;
  parentId: string | null;
  isHighlighted: boolean;
  children: MockMenuItem[];
}

export interface MockMenu {
  id: string;
  name: string;
  location: MockMenuLocation;
  isActive: boolean;
  items: MockMenuItem[];
  createdById: string;
  updatedById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export const mockMenuIds = {
  primaryNav: generateId(),
  hamburgerNav: generateId(),
  footerNav: generateId(),
  footerLegal: generateId(),
};

const buildMenuItem = (overrides: Partial<MockMenuItem> = {}): MockMenuItem => ({
  id: generateId(),
  label: 'Menu Item',
  type: 'LINK',
  url: '/',
  pageId: null,
  categoryId: null,
  target: '_self',
  icon: null,
  order: 1,
  parentId: null,
  isHighlighted: false,
  children: [],
  ...overrides,
});

export const mockMenuPrimaryNav: MockMenu = {
  id: mockMenuIds.primaryNav,
  name: 'Primary Navigation',
  location: 'PRIMARY_NAV',
  isActive: true,
  items: [
    buildMenuItem({
      label: 'Bedroom',
      url: '/bedrooms',
      order: 1,
    }),
    buildMenuItem({
      label: 'Kitchen',
      url: '/kitchens',
      order: 2,
    }),
    buildMenuItem({
      label: 'Offer a Free Consultation',
      url: '/book-appointment',
      order: 3,
      isHighlighted: true,
    }),
    buildMenuItem({
      label: 'Find a Showroom',
      url: '/showrooms',
      order: 4,
    }),
    buildMenuItem({
      label: 'My Account',
      url: '/account',
      order: 5,
    }),
    buildMenuItem({
      label: 'Finance',
      url: '/finance',
      order: 6,
    }),
  ],
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockMenuHamburgerNav: MockMenu = {
  id: mockMenuIds.hamburgerNav,
  name: 'Hamburger Menu',
  location: 'HAMBURGER_NAV',
  isActive: true,
  items: [
    buildMenuItem({
      label: 'Inspiration',
      url: '/inspiration',
      order: 1,
    }),
    buildMenuItem({
      label: 'Our Blog',
      url: '/blog',
      order: 2,
    }),
    buildMenuItem({
      label: 'Download Brochure',
      url: '/brochure-request',
      order: 3,
    }),
    buildMenuItem({
      label: 'About Us',
      url: '/about-us',
      order: 4,
    }),
    buildMenuItem({
      label: 'Our Process',
      url: '/our-process',
      order: 5,
    }),
    buildMenuItem({
      label: 'Why Choose Us',
      url: '/why-choose-us',
      order: 6,
    }),
    buildMenuItem({
      label: 'Contact Us',
      url: '/contact-us',
      order: 7,
    }),
    buildMenuItem({
      label: 'Careers',
      url: '/careers',
      order: 8,
    }),
    buildMenuItem({
      label: 'Business With Us',
      url: '/business',
      order: 9,
    }),
  ],
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockMenuFooterNav: MockMenu = {
  id: mockMenuIds.footerNav,
  name: 'Footer Navigation',
  location: 'FOOTER_NAV',
  isActive: true,
  items: [
    buildMenuItem({ label: 'Kitchens', url: '/kitchens', order: 1 }),
    buildMenuItem({ label: 'Bedrooms', url: '/bedrooms', order: 2 }),
    buildMenuItem({ label: 'Book a Consultation', url: '/book-appointment', order: 3 }),
    buildMenuItem({ label: 'Find a Showroom', url: '/showrooms', order: 4 }),
    buildMenuItem({ label: 'Finance', url: '/finance', order: 5 }),
    buildMenuItem({ label: 'About Us', url: '/about-us', order: 6 }),
    buildMenuItem({ label: 'Our Process', url: '/our-process', order: 7 }),
    buildMenuItem({ label: 'Why Choose Us', url: '/why-choose-us', order: 8 }),
    buildMenuItem({ label: 'Blog', url: '/blog', order: 9 }),
    buildMenuItem({ label: 'Contact Us', url: '/contact-us', order: 10 }),
    buildMenuItem({ label: 'Careers', url: '/careers', order: 11 }),
  ],
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockMenuFooterLegal: MockMenu = {
  id: mockMenuIds.footerLegal,
  name: 'Footer Legal Links',
  location: 'FOOTER_LEGAL',
  isActive: true,
  items: [
    buildMenuItem({ label: 'Terms & Conditions', url: '/terms-and-conditions', order: 1 }),
    buildMenuItem({ label: 'Privacy Policy', url: '/privacy-policy', order: 2 }),
    buildMenuItem({ label: 'Cookie Policy', url: '/cookie-policy', order: 3 }),
    buildMenuItem({ label: 'Sitemap', url: '/sitemap.xml', order: 4, target: '_blank' }),
  ],
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const allMockMenus: MockMenu[] = [
  mockMenuPrimaryNav,
  mockMenuHamburgerNav,
  mockMenuFooterNav,
  mockMenuFooterLegal,
];

export const mockCreateMenuDto = {
  name: 'Test Menu',
  location: 'PRIMARY_NAV' as MockMenuLocation,
  isActive: true,
  items: [
    {
      label: 'Test Item',
      type: 'LINK' as MockMenuItemType,
      url: '/test',
      target: '_self' as const,
      order: 1,
      isHighlighted: false,
    },
  ],
};

export const mockUpdateMenuDto = {
  name: 'Updated Menu Name',
  isActive: false,
};

export const mockAddMenuItemDto = {
  label: 'New Item',
  type: 'LINK' as MockMenuItemType,
  url: '/new-item',
  target: '_self' as const,
  order: 99,
  isHighlighted: false,
  parentId: null,
};

export const buildMockMenu = (overrides: Partial<MockMenu> = {}): MockMenu => ({
  id: generateId(),
  name: 'Test Menu',
  location: 'PRIMARY_NAV',
  isActive: true,
  items: [],
  ...mockAuditFields,
  ...mockCreatedByFields,
  ...overrides,
});