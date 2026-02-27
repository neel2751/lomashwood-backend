import { generateId, mockAuditFields, mockCreatedByFields } from './common.fixture';
import { mockMediaIds } from './media.fixture';

export type MockPageStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type MockPageTemplate =
  | 'DEFAULT'
  | 'HOME'
  | 'LANDING'
  | 'CONTACT'
  | 'FINANCE'
  | 'ABOUT'
  | 'PROCESS'
  | 'MEDIA_WALL'
  | 'CAREERS'
  | 'TERMS'
  | 'PRIVACY'
  | 'COOKIES';

export interface MockPageSection {
  id: string;
  type: string;
  order: number;
  data: Record<string, unknown>;
}

export interface MockPage {
  id: string;
  title: string;
  slug: string;
  template: MockPageTemplate;
  status: MockPageStatus;
  sections: MockPageSection[];
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageId: string | null;
  isSystem: boolean;
  publishedAt: Date | null;
  createdById: string;
  updatedById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export const mockPageIds = {
  home: generateId(),
  aboutUs: generateId(),
  finance: generateId(),
  ourProcess: generateId(),
  whyChooseUs: generateId(),
  mediaWall: generateId(),
  contactUs: generateId(),
  careers: generateId(),
  termsAndConditions: generateId(),
  privacyPolicy: generateId(),
  cookiePolicy: generateId(),
};

export const mockPageHome: MockPage = {
  id: mockPageIds.home,
  title: 'Home',
  slug: '/',
  template: 'HOME',
  status: 'PUBLISHED',
  sections: [
    {
      id: generateId(),
      type: 'HERO_SLIDER',
      order: 1,
      data: {
        slides: [
          {
            imageId: mockMediaIds.heroImage1,
            title: 'Dream Kitchens Crafted for You',
            description: 'Bespoke kitchen designs that transform your home into the heart of your family',
            buttonText: 'Explore Kitchens',
            buttonLink: '/kitchens',
          },
          {
            imageId: mockMediaIds.heroImage2,
            title: 'Luxury Bedrooms, Beautifully Fitted',
            description: 'Custom bedroom furniture designed to maximise space and style',
            buttonText: 'Explore Bedrooms',
            buttonLink: '/bedrooms',
          },
        ],
      },
    },
    {
      id: generateId(),
      type: 'WHY_CHOOSE_US',
      order: 2,
      data: {
        heading: 'Why Choose Lomash Wood?',
        items: [
          { icon: 'award', title: '20 Years Experience', description: 'Two decades of crafting beautiful kitchens and bedrooms' },
          { icon: 'users', title: 'Expert Design Team', description: 'Our in-house designers bring your vision to life' },
          { icon: 'star', title: '5-Star Reviews', description: 'Thousands of happy customers across the UK' },
          { icon: 'shield', title: 'Quality Guaranteed', description: 'All products come with our comprehensive warranty' },
        ],
      },
    },
    {
      id: generateId(),
      type: 'MAIN_CTA',
      order: 3,
      data: {
        imageId: mockMediaIds.heroImage1,
        heading: 'Ready to Transform Your Home?',
        description: 'Book a free design consultation with one of our experts today.',
        buttonText: 'Book a Free Consultation',
        buttonLink: '/book-appointment',
      },
    },
  ],
  metaTitle: 'Lomash Wood | Bespoke Kitchens & Bedrooms',
  metaDescription: 'Discover Lomash Wood\'s range of bespoke fitted kitchens and bedrooms. Book a free design consultation with our experts today.',
  ogImageId: mockMediaIds.heroImage1,
  isSystem: true,
  publishedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockPageAboutUs: MockPage = {
  id: mockPageIds.aboutUs,
  title: 'About Us',
  slug: 'about-us',
  template: 'ABOUT',
  status: 'PUBLISHED',
  sections: [
    {
      id: generateId(),
      type: 'HERO',
      order: 1,
      data: {
        heading: 'About Lomash Wood',
        subheading: 'Crafting Beautiful Kitchens and Bedrooms Since 2005',
        imageId: mockMediaIds.heroImage1,
      },
    },
    {
      id: generateId(),
      type: 'TEXT_CONTENT',
      order: 2,
      data: {
        heading: 'Our Story',
        content: '<p>Founded in 2005, Lomash Wood has grown from a small local carpenter workshop to one of the UK\'s most trusted bespoke kitchen and bedroom specialists. Our commitment to quality craftsmanship and exceptional customer service has never wavered.</p><p>Today, we operate showrooms across the UK and have helped thousands of families transform their homes with beautiful, functional spaces designed around their lives.</p>',
      },
    },
    {
      id: generateId(),
      type: 'STATS',
      order: 3,
      data: {
        items: [
          { value: '20+', label: 'Years in Business' },
          { value: '5000+', label: 'Happy Customers' },
          { value: '12', label: 'Showrooms Nationwide' },
          { value: '4.9/5', label: 'Average Rating' },
        ],
      },
    },
  ],
  metaTitle: 'About Lomash Wood | Our Story & Values',
  metaDescription: 'Learn about Lomash Wood\'s story, values, and commitment to crafting beautiful bespoke kitchens and bedrooms across the UK.',
  ogImageId: mockMediaIds.heroImage1,
  isSystem: true,
  publishedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockPageFinance: MockPage = {
  id: mockPageIds.finance,
  title: 'Finance',
  slug: 'finance',
  template: 'FINANCE',
  status: 'PUBLISHED',
  sections: [
    {
      id: generateId(),
      type: 'HERO',
      order: 1,
      data: {
        heading: 'Flexible Finance Options',
        subheading: 'Make your dream kitchen or bedroom a reality with our range of finance plans',
      },
    },
    {
      id: generateId(),
      type: 'FINANCE_CONTENT',
      order: 2,
      data: {
        title: 'Buy Now, Pay Later',
        description: 'Spread the cost of your new kitchen or bedroom with our flexible finance options.',
        content: '<p>We offer a range of finance options to suit your budget. Our finance plans are provided by our trusted finance partner and are subject to credit checks and eligibility criteria.</p><h3>Available Finance Options</h3><ul><li>0% APR for 12 months</li><li>Buy Now Pay Later for 12 months</li><li>Long-term finance up to 120 months</li></ul>',
        disclaimer: 'Finance is subject to status. Terms and conditions apply. Lomash Wood Ltd is a credit broker, not a lender.',
      },
    },
  ],
  metaTitle: 'Kitchen & Bedroom Finance Options | Lomash Wood',
  metaDescription: 'Flexible finance options available for your new kitchen or bedroom. 0% APR available. Subject to status.',
  ogImageId: null,
  isSystem: true,
  publishedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockPageOurProcess: MockPage = {
  id: mockPageIds.ourProcess,
  title: 'Our Process',
  slug: 'our-process',
  template: 'PROCESS',
  status: 'PUBLISHED',
  sections: [
    {
      id: generateId(),
      type: 'PROCESS_STEPS',
      order: 1,
      data: {
        heading: 'How It Works',
        subheading: 'From initial consultation to final installation, we\'re with you every step of the way',
        steps: [
          {
            step: 1,
            icon: 'calendar',
            title: 'Free Consultation',
            description: 'Book a free design consultation at your home, in our showroom, or online. Our expert designers will listen to your needs and discuss the possibilities.',
          },
          {
            step: 2,
            icon: 'pencil',
            title: 'Design & Planning',
            description: 'Our team creates a detailed 3D design of your new kitchen or bedroom, incorporating your feedback until you\'re completely happy.',
          },
          {
            step: 3,
            icon: 'truck',
            title: 'Manufacturing',
            description: 'Your bespoke furniture is manufactured to exacting standards in our UK workshop using premium materials.',
          },
          {
            step: 4,
            icon: 'home',
            title: 'Installation',
            description: 'Our expert installation team fits your new kitchen or bedroom to the highest standard, leaving your home clean and tidy.',
          },
        ],
        ctaText: 'Start Your Journey',
        ctaLink: '/book-appointment',
      },
    },
  ],
  metaTitle: 'Our Process | How Lomash Wood Works',
  metaDescription: 'Learn about the Lomash Wood process - from free consultation and bespoke design to expert installation. Four simple steps to your dream space.',
  ogImageId: null,
  isSystem: true,
  publishedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockPageWhyChooseUs: MockPage = {
  id: mockPageIds.whyChooseUs,
  title: 'Why Choose Us',
  slug: 'why-choose-us',
  template: 'LANDING',
  status: 'PUBLISHED',
  sections: [
    {
      id: generateId(),
      type: 'WHY_CHOOSE_US_HERO',
      order: 1,
      data: {
        heading: 'Why Choose Lomash Wood?',
        description: 'We believe everyone deserves a beautifully designed home. Here\'s why thousands of families trust us with theirs.',
      },
    },
    {
      id: generateId(),
      type: 'FEATURES_GRID',
      order: 2,
      data: {
        items: [
          {
            icon: 'shield-check',
            title: 'Quality Guaranteed',
            description: 'All our products are backed by a comprehensive manufacturer\'s warranty for complete peace of mind.',
          },
          {
            icon: 'award',
            title: 'Award-Winning Design',
            description: 'Our design team has won multiple industry awards for innovation and excellence in kitchen and bedroom design.',
          },
          {
            icon: 'clock',
            title: 'On-Time Delivery',
            description: 'We pride ourselves on meeting our installation dates. Your project will be completed on time, every time.',
          },
          {
            icon: 'pound-sign',
            title: 'Competitive Pricing',
            description: 'Premium quality doesn\'t have to mean premium prices. We offer exceptional value with flexible finance options.',
          },
        ],
      },
    },
  ],
  metaTitle: 'Why Choose Lomash Wood for Your Kitchen or Bedroom?',
  metaDescription: 'Discover why thousands of UK homeowners choose Lomash Wood. Quality, design, value, and service — all under one roof.',
  ogImageId: null,
  isSystem: true,
  publishedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockPageMediaWall: MockPage = {
  id: mockPageIds.mediaWall,
  title: 'Media Wall',
  slug: 'media-wall',
  template: 'MEDIA_WALL',
  status: 'PUBLISHED',
  sections: [
    {
      id: generateId(),
      type: 'MEDIA_WALL_HERO',
      order: 1,
      data: {
        title: 'Bespoke Media Walls',
        description: 'Transform your living space with a custom-designed media wall featuring integrated TV units, shelving, and fireplace options.',
        backgroundImageId: mockMediaIds.mediaWallImage1,
      },
    },
    {
      id: generateId(),
      type: 'MEDIA_GALLERY',
      order: 2,
      data: {
        heading: 'Our Work',
        items: [
          { mediaId: mockMediaIds.mediaWallImage1, caption: 'Media wall with integrated fireplace' },
          { mediaId: mockMediaIds.mediaWallVideo1, caption: 'Showroom tour video' },
        ],
      },
    },
  ],
  metaTitle: 'Bespoke Media Walls | Lomash Wood',
  metaDescription: 'Custom-designed media walls with integrated TV units, shelving, and fireplaces. View our portfolio of stunning media wall projects.',
  ogImageId: mockMediaIds.mediaWallImage1,
  isSystem: true,
  publishedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockPageContactUs: MockPage = {
  id: mockPageIds.contactUs,
  title: 'Contact Us',
  slug: 'contact-us',
  template: 'CONTACT',
  status: 'PUBLISHED',
  sections: [
    {
      id: generateId(),
      type: 'CONTACT_INFO',
      order: 1,
      data: {
        heading: 'Get in Touch',
        description: 'We\'d love to hear from you. Reach out using any of the methods below.',
        phone: '0800 123 4567',
        email: 'hello@lomashwood.com',
        address: 'Lomash Wood Ltd, 123 Design Street, London, SW1A 1AA',
        openingHours: [
          { day: 'Monday - Friday', hours: '9:00am - 6:00pm' },
          { day: 'Saturday', hours: '10:00am - 5:00pm' },
          { day: 'Sunday', hours: 'Closed' },
        ],
      },
    },
  ],
  metaTitle: 'Contact Lomash Wood | Get in Touch',
  metaDescription: 'Contact Lomash Wood by phone, email, or visit one of our showrooms. We\'re here to help with your kitchen or bedroom project.',
  ogImageId: null,
  isSystem: true,
  publishedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockPageTermsAndConditions: MockPage = {
  id: mockPageIds.termsAndConditions,
  title: 'Terms & Conditions',
  slug: 'terms-and-conditions',
  template: 'TERMS',
  status: 'PUBLISHED',
  sections: [
    {
      id: generateId(),
      type: 'TEXT_CONTENT',
      order: 1,
      data: {
        heading: 'Terms & Conditions',
        content: '<p>Last updated: 15 January 2025</p><p>These terms and conditions govern your use of the Lomash Wood website and services...</p>',
        lastUpdated: '2025-01-15',
      },
    },
  ],
  metaTitle: 'Terms & Conditions | Lomash Wood',
  metaDescription: 'Read the Lomash Wood terms and conditions for using our website and purchasing our products and services.',
  ogImageId: null,
  isSystem: true,
  publishedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockPagePrivacyPolicy: MockPage = {
  id: mockPageIds.privacyPolicy,
  title: 'Privacy Policy',
  slug: 'privacy-policy',
  template: 'PRIVACY',
  status: 'PUBLISHED',
  sections: [
    {
      id: generateId(),
      type: 'TEXT_CONTENT',
      order: 1,
      data: {
        heading: 'Privacy Policy',
        content: '<p>Last updated: 15 January 2025</p><p>At Lomash Wood, we are committed to protecting your personal data and respecting your privacy...</p>',
        lastUpdated: '2025-01-15',
      },
    },
  ],
  metaTitle: 'Privacy Policy | Lomash Wood',
  metaDescription: 'Read the Lomash Wood privacy policy to understand how we collect, use, and protect your personal data in accordance with GDPR.',
  ogImageId: null,
  isSystem: true,
  publishedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const mockPageCareers: MockPage = {
  id: mockPageIds.careers,
  title: 'Careers',
  slug: 'careers',
  template: 'LANDING',
  status: 'PUBLISHED',
  sections: [
    {
      id: generateId(),
      type: 'HERO',
      order: 1,
      data: {
        heading: 'Join Our Team',
        subheading: 'Help us create beautiful spaces for families across the UK',
      },
    },
    {
      id: generateId(),
      type: 'JOB_LISTINGS',
      order: 2,
      data: {
        heading: 'Current Opportunities',
        jobs: [],
      },
    },
  ],
  metaTitle: 'Careers at Lomash Wood | Join Our Team',
  metaDescription: 'Explore career opportunities at Lomash Wood. Join a passionate team dedicated to creating beautiful kitchens and bedrooms.',
  ogImageId: null,
  isSystem: true,
  publishedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...mockAuditFields,
  ...mockCreatedByFields,
};

export const allMockPages: MockPage[] = [
  mockPageHome,
  mockPageAboutUs,
  mockPageFinance,
  mockPageOurProcess,
  mockPageWhyChooseUs,
  mockPageMediaWall,
  mockPageContactUs,
  mockPageTermsAndConditions,
  mockPagePrivacyPolicy,
  mockPageCareers,
];

export const mockCreatePageDto = {
  title: 'New Test Page',
  slug: 'new-test-page',
  template: 'DEFAULT' as MockPageTemplate,
  status: 'DRAFT' as MockPageStatus,
  sections: [],
  metaTitle: 'New Test Page | Lomash Wood',
  metaDescription: 'Test page meta description.',
  isSystem: false,
};

export const mockUpdatePageDto = {
  title: 'Updated Page Title',
  metaTitle: 'Updated Page Title | Lomash Wood',
  status: 'PUBLISHED' as MockPageStatus,
};

export const buildMockPage = (overrides: Partial<MockPage> = {}): MockPage => ({
  id: generateId(),
  title: 'Test Page',
  slug: 'test-page',
  template: 'DEFAULT',
  status: 'DRAFT',
  sections: [],
  metaTitle: null,
  metaDescription: null,
  ogImageId: null,
  isSystem: false,
  publishedAt: null,
  ...mockAuditFields,
  ...mockCreatedByFields,
  ...overrides,
});