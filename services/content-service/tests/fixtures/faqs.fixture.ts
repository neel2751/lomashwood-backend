import { generateId, mockAuditFields, mockCreatedByFields } from './common.fixture';

export type MockFaqStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
export type MockFaqCategory =
  | 'GENERAL'
  | 'KITCHENS'
  | 'BEDROOMS'
  | 'FINANCE'
  | 'APPOINTMENTS'
  | 'DELIVERY_INSTALLATION'
  | 'AFTERCARE'
  | 'BUSINESS';

export interface MockFaq {
  id: string;
  question: string;
  answer: string;
  category: MockFaqCategory;
  status: MockFaqStatus;
  sortOrder: number;
  isFeatured: boolean;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  relatedFaqIds: string[];
  tags: string[];
  createdById: string;
  updatedById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export const mockFaqIds = {
  howLongKitchen: generateId(),
  howMuchKitchen: generateId(),
  canWeChooseColours: generateId(),
  doYouInstall: generateId(),
  whatFinanceOptions: generateId(),
  howToBook: generateId(),
  whatIsIncluded: generateId(),
  howLongBedroom: generateId(),
  doYouOfferWarranty: generateId(),
  canYouWorkAroundExisting: generateId(),
};

export const mockFaqHowLongKitchen: MockFaq = {
  id: mockFaqIds.howLongKitchen,
  question: 'How long does a kitchen installation take?',
  answer: '<p>The time to install a new kitchen depends on the size and complexity of the project. As a general guide:</p><ul><li><strong>Small kitchen</strong> (up to 10 units): 3–5 days</li><li><strong>Medium kitchen</strong> (10–20 units): 5–8 days</li><li><strong>Large kitchen</strong> (20+ units or complex layout): 8–14 days</li></ul><p>This includes fitting the units, worktops, appliances, plumbing, and electrical work. Your project manager will give you a precise timeline during the design stage.</p>',
  category: 'KITCHENS',
  status: 'PUBLISHED',
  sortOrder: 1,
  isFeatured: true,
  viewCount: 3241,
  helpfulCount: 287,
  notHelpfulCount: 12,
  relatedFaqIds: [mockFaqIds.doYouInstall, mockFaqIds.whatIsIncluded],
  tags: ['installation', 'timeline', 'kitchen'],
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockFaqHowMuchKitchen: MockFaq = {
  id: mockFaqIds.howMuchKitchen,
  question: 'How much does a new kitchen cost?',
  answer: '<p>The cost of a new kitchen varies widely depending on size, materials, appliances, and the complexity of the work required. At Lomash Wood, our kitchens typically range from:</p><ul><li><strong>Budget range:</strong> £5,000 – £10,000</li><li><strong>Mid-range:</strong> £10,000 – £20,000</li><li><strong>Premium:</strong> £20,000 – £50,000+</li></ul><p>The best way to get an accurate price is to book a free design consultation. Our designers will work within your budget to create the perfect kitchen for your home.</p>',
  category: 'KITCHENS',
  status: 'PUBLISHED',
  sortOrder: 2,
  isFeatured: true,
  viewCount: 5678,
  helpfulCount: 412,
  notHelpfulCount: 23,
  relatedFaqIds: [mockFaqIds.whatFinanceOptions],
  tags: ['pricing', 'cost', 'kitchen'],
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockFaqCanWeChooseColours: MockFaq = {
  id: mockFaqIds.canWeChooseColours,
  question: 'Can I choose any colour for my kitchen or bedroom?',
  answer: '<p>Yes! We offer a wide range of colours and finishes for both our kitchen and bedroom ranges. Our colour options include:</p><ul><li>Classic whites and creams</li><li>Contemporary greys and charcoals</li><li>Bold navies and greens</li><li>Warm neutrals and beiges</li><li>Natural wood effects and oak finishes</li></ul><p>We also offer bespoke colour matching for premium orders. Visit your nearest showroom to see our full colour range in person, or order free colour samples through our website.</p>',
  category: 'GENERAL',
  status: 'PUBLISHED',
  sortOrder: 3,
  isFeatured: true,
  viewCount: 2134,
  helpfulCount: 198,
  notHelpfulCount: 8,
  relatedFaqIds: [],
  tags: ['colours', 'finishes', 'customisation'],
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockFaqDoYouInstall: MockFaq = {
  id: mockFaqIds.doYouInstall,
  question: 'Do you offer a full installation service?',
  answer: '<p>Yes, we offer a complete supply and installation service for all our kitchens and bedrooms. Our professional installation teams are fully trained and accredited, and will handle:</p><ul><li>Removal and disposal of your old kitchen or bedroom furniture</li><li>Supply and fitting of all new units and furniture</li><li>Worktop cutting and fitting</li><li>Appliance installation</li><li>Plumbing and electrical work (by qualified tradespeople)</li><li>Tiling (optional add-on)</li></ul><p>All our installation teams are directly employed by Lomash Wood, ensuring consistent quality and accountability.</p>',
  category: 'DELIVERY_INSTALLATION',
  status: 'PUBLISHED',
  sortOrder: 1,
  isFeatured: true,
  viewCount: 4321,
  helpfulCount: 356,
  notHelpfulCount: 14,
  relatedFaqIds: [mockFaqIds.howLongKitchen, mockFaqIds.whatIsIncluded],
  tags: ['installation', 'fitting', 'service'],
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockFaqWhatFinanceOptions: MockFaq = {
  id: mockFaqIds.whatFinanceOptions,
  question: 'What finance options do you offer?',
  answer: '<p>We offer a range of flexible finance options to help you spread the cost of your new kitchen or bedroom:</p><ul><li><strong>0% APR Finance:</strong> Spread payments over 12 months with no interest</li><li><strong>Buy Now, Pay Later:</strong> Delay your first payment for up to 12 months</li><li><strong>Long-term finance:</strong> Spread payments over up to 10 years</li></ul><p>Finance is available on orders over £2,000. All finance is provided by our trusted finance partner and is subject to status and credit checks. Representative APR and terms vary by plan.</p>',
  category: 'FINANCE',
  status: 'PUBLISHED',
  sortOrder: 1,
  isFeatured: true,
  viewCount: 3987,
  helpfulCount: 321,
  notHelpfulCount: 19,
  relatedFaqIds: [mockFaqIds.howMuchKitchen],
  tags: ['finance', 'payment', 'apr', 'buy-now-pay-later'],
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockFaqHowToBook: MockFaq = {
  id: mockFaqIds.howToBook,
  question: 'How do I book a design consultation?',
  answer: '<p>Booking a free design consultation with Lomash Wood is easy. You can choose from three convenient options:</p><ol><li><strong>Online booking:</strong> Use our online booking tool to select your preferred date and time</li><li><strong>Showroom visit:</strong> Walk into any of our showrooms and speak to a designer directly</li><li><strong>Home visit:</strong> Book a home measurement visit where one of our designers comes to you</li></ol><p>Consultations are completely free and carry no obligation to purchase. Our designers will take the time to understand your requirements, measure your space, and create a design concept for you.</p>',
  category: 'APPOINTMENTS',
  status: 'PUBLISHED',
  sortOrder: 1,
  isFeatured: false,
  viewCount: 2876,
  helpfulCount: 245,
  notHelpfulCount: 7,
  relatedFaqIds: [],
  tags: ['booking', 'consultation', 'appointment'],
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockFaqWhatIsIncluded: MockFaq = {
  id: mockFaqIds.whatIsIncluded,
  question: 'What is included in the kitchen installation price?',
  answer: '<p>Our standard kitchen installation price includes:</p><ul><li>Delivery of all furniture and appliances</li><li>Removal and disposal of your existing kitchen (if applicable)</li><li>Assembly and installation of all units</li><li>Worktop templating, cutting, and fitting</li><li>Connection of appliances</li><li>Installation of sinks and taps</li><li>Final clean-up and quality inspection</li></ul><p>Additional costs may apply for plumbing, electrical work, and tiling if these are required. Your designer will provide a full itemised quote.</p>',
  category: 'DELIVERY_INSTALLATION',
  status: 'PUBLISHED',
  sortOrder: 2,
  isFeatured: false,
  viewCount: 1932,
  helpfulCount: 178,
  notHelpfulCount: 9,
  relatedFaqIds: [mockFaqIds.doYouInstall, mockFaqIds.howLongKitchen],
  tags: ['installation', 'included', 'price'],
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockFaqHowLongBedroom: MockFaq = {
  id: mockFaqIds.howLongBedroom,
  question: 'How long does a fitted bedroom take to install?',
  answer: '<p>Fitted bedroom installations are typically quicker than kitchens. As a general guide:</p><ul><li><strong>Single wardrobe run:</strong> 1–2 days</li><li><strong>Full bedroom with multiple elements:</strong> 2–4 days</li><li><strong>Large or complex bedroom:</strong> 4–7 days</li></ul><p>Our installation teams work efficiently to minimise disruption to your home. You\'ll receive a precise timeline from your project manager before work begins.</p>',
  category: 'BEDROOMS',
  status: 'PUBLISHED',
  sortOrder: 1,
  isFeatured: false,
  viewCount: 1654,
  helpfulCount: 143,
  notHelpfulCount: 5,
  relatedFaqIds: [mockFaqIds.doYouInstall],
  tags: ['bedroom', 'installation', 'timeline'],
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockFaqDoYouOfferWarranty: MockFaq = {
  id: mockFaqIds.doYouOfferWarranty,
  question: 'Do you offer a warranty on your products?',
  answer: '<p>Yes, all Lomash Wood products come with a comprehensive warranty:</p><ul><li><strong>Cabinet carcase:</strong> 10-year structural warranty</li><li><strong>Door hinges and drawer runners:</strong> 5-year functional warranty</li><li><strong>Worktops:</strong> 5-year warranty (subject to care guidelines)</li><li><strong>Appliances:</strong> Manufacturer\'s warranty applies (typically 1–2 years)</li></ul><p>Our warranty covers manufacturing defects and failures under normal domestic use. Full warranty terms are provided at the point of purchase.</p>',
  category: 'AFTERCARE',
  status: 'PUBLISHED',
  sortOrder: 1,
  isFeatured: false,
  viewCount: 2341,
  helpfulCount: 211,
  notHelpfulCount: 6,
  relatedFaqIds: [],
  tags: ['warranty', 'guarantee', 'aftercare'],
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockFaqCanYouWorkAroundExisting: MockFaq = {
  id: mockFaqIds.canYouWorkAroundExisting,
  question: 'Can you work around my existing appliances?',
  answer: '<p>Absolutely. Our designers are experienced in working with existing appliances to create a cohesive look. We can design your new kitchen to accommodate your current appliances, or we can advise on compatible new appliances that will complement your chosen design.</p><p>During your initial consultation, simply let your designer know which appliances you plan to keep, and they will incorporate them seamlessly into your new kitchen layout.</p>',
  category: 'KITCHENS',
  status: 'DRAFT',
  sortOrder: 10,
  isFeatured: false,
  viewCount: 0,
  helpfulCount: 0,
  notHelpfulCount: 0,
  relatedFaqIds: [],
  tags: ['appliances', 'design', 'customisation'],
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const allMockFaqs: MockFaq[] = [
  mockFaqHowLongKitchen,
  mockFaqHowMuchKitchen,
  mockFaqCanWeChooseColours,
  mockFaqDoYouInstall,
  mockFaqWhatFinanceOptions,
  mockFaqHowToBook,
  mockFaqWhatIsIncluded,
  mockFaqHowLongBedroom,
  mockFaqDoYouOfferWarranty,
  mockFaqCanYouWorkAroundExisting,
];

export const publishedMockFaqs: MockFaq[] = allMockFaqs.filter((f) => f.status === 'PUBLISHED');
export const featuredMockFaqs: MockFaq[] = publishedMockFaqs.filter((f) => f.isFeatured);

export const mockCreateFaqDto = {
  question: 'What is the lead time for a new kitchen?',
  answer: '<p>Lead times vary depending on the range selected. Standard ranges typically have a 6–10 week lead time.</p>',
  category: 'KITCHENS' as MockFaqCategory,
  status: 'DRAFT' as MockFaqStatus,
  sortOrder: 99,
  isFeatured: false,
  tags: ['lead-time', 'delivery'],
};

export const mockUpdateFaqDto = {
  question: 'Updated FAQ Question?',
  answer: '<p>Updated FAQ answer content.</p>',
  status: 'PUBLISHED' as MockFaqStatus,
  isFeatured: true,
};

export const buildMockFaq = (overrides: Partial<MockFaq> = {}): MockFaq => ({
  id: generateId(),
  question: 'Test FAQ Question?',
  answer: '<p>Test FAQ answer.</p>',
  category: 'GENERAL',
  status: 'DRAFT',
  sortOrder: 99,
  isFeatured: false,
  viewCount: 0,
  helpfulCount: 0,
  notHelpfulCount: 0,
  relatedFaqIds: [],
  tags: [],
  ...mockAuditFields,
  ...mockCreatedByFields,
  ...overrides,
});