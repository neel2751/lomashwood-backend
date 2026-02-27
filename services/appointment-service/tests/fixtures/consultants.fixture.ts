import { CONSULTANT_SPECIALISATION } from '../../src/shared/constants';
import { ConsultantEntity } from '../../src/shared/types';
import { FIXED_DATE_NOW, FIXED_IDS } from './common.fixture';

// ── Static entity fixtures ────────────────────────────────────

export const consultantKitchenFixture: ConsultantEntity = {
  id: FIXED_IDS.consultantId,
  name: 'Sarah Mitchell',
  email: 'sarah.mitchell@lomashwood.co.uk',
  phone: '07712345678',
  specialisation: CONSULTANT_SPECIALISATION.KITCHEN,
  showroomId: FIXED_IDS.showroomId,
  isActive: true,
  bio: 'Senior kitchen design consultant with 8 years experience.',
  avatarUrl: 'https://cdn.lomashwood.co.uk/consultants/sarah-mitchell.jpg',
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const consultantBedroomFixture: ConsultantEntity = {
  id: FIXED_IDS.secondConsultantId,
  name: 'David Okafor',
  email: 'david.okafor@lomashwood.co.uk',
  phone: '07823456789',
  specialisation: CONSULTANT_SPECIALISATION.BEDROOM,
  showroomId: FIXED_IDS.showroomId,
  isActive: true,
  bio: 'Bedroom design specialist with 5 years experience.',
  avatarUrl: 'https://cdn.lomashwood.co.uk/consultants/david-okafor.jpg',
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const consultantInactiveFixture: ConsultantEntity = {
  id: '20202020-2020-4020-a020-202020202020',
  name: 'Mark Reynolds',
  email: 'mark.reynolds@lomashwood.co.uk',
  phone: '07645678901',
  specialisation: CONSULTANT_SPECIALISATION.KITCHEN,
  showroomId: FIXED_IDS.showroomId,
  isActive: false,
  bio: null,
  avatarUrl: null,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const createConsultantPayload = {
  name: 'New Consultant',
  email: 'new.consultant@lomashwood.co.uk',
  phone: '07756789012',
  specialisation: CONSULTANT_SPECIALISATION.BOTH,
  showroomId: FIXED_IDS.showroomId,
  bio: 'Enthusiastic new design consultant.',
  avatarUrl: null,
};

export const updateConsultantPayload = {
  name: 'Sarah Mitchell Updated',
  phone: '07787654321',
  specialisation: CONSULTANT_SPECIALISATION.BOTH,
};

// ── Dynamic factory fixtures (used in integration/e2e tests) ──

export const consultantFixtures = {
  // Minimal active consultant — unique email via Date.now()
  active: () => ({
    name:           'Test Consultant',
    email:          `consultant-${Date.now()}@test.com`,
    phone:          '07800000000',
    specialisation: CONSULTANT_SPECIALISATION.KITCHEN,
    isActive:       true,
  }),

  // HTTP request payload for POST /v1/consultants — unique email each call
  createPayload: () => ({
    name:           'New Test Consultant',
    email:          `new-consultant-${Date.now()}@test.com`,
    phone:          '07800000001',
    specialisation: CONSULTANT_SPECIALISATION.BOTH,
    bio:            'Test consultant bio.',
  }),

  // Prisma-ready shape with a specific name — used for search tests
  withName: (name: string) => ({
    name,
    email:          `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}@test.com`,
    phone:          '07800000002',
    specialisation: CONSULTANT_SPECIALISATION.KITCHEN,
    isActive:       true,
  }),
};