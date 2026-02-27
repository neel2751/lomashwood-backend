import { ShowroomEntity } from '../../src/shared/types';
import { FIXED_DATE_NOW, FIXED_IDS } from './common.fixture';



export const showroomClaphamFixture: ShowroomEntity = {
  id: FIXED_IDS.showroomId,
  name: 'Lomash Wood Clapham',
  address: '12 High Street, Clapham, London, SW4 7UR',
  imageUrl: 'https:',
  email: 'clapham@lomashwood.co.uk',
  phone: '02012345678',
  openingHours: 'Mon-Sat 9am-6pm, Sun 10am-4pm',
  mapLink: 'https:',
  isActive: true,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const showroomBrightonFixture: ShowroomEntity = {
  id: FIXED_IDS.secondShowroomId,
  name: 'Lomash Wood Brighton',
  address: '45 Western Road, Brighton, BN1 2EB',
  imageUrl: 'https:',
  email: 'brighton@lomashwood.co.uk',
  phone: '01273456789',
  openingHours: 'Mon-Sat 9am-5:30pm, Sun 11am-4pm',
  mapLink: 'https:',
  isActive: true,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const showroomInactiveFixture: ShowroomEntity = {
  id: '30303030-3030-4030-a030-303030303030',
  name: 'Lomash Wood Manchester',
  address: '8 Deansgate, Manchester, M3 2FF',
  imageUrl: null,
  email: 'manchester@lomashwood.co.uk',
  phone: '01612345678',
  openingHours: 'Mon-Fri 9am-5pm',
  mapLink: 'https:',
  isActive: false,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const showroomsListFixture: ShowroomEntity[] = [
  showroomClaphamFixture,
  showroomBrightonFixture,
];



interface LocationOverrides {
  name?: string;
  postcode?: string;
  phone?: string;
  email?: string;
}

export const locationsFixture = {
  
  createPayload: (overrides: LocationOverrides = {}) => ({
    name:     overrides.name     ?? `Test Showroom ${Date.now()}`,
    address:  '1 Test Street, London',
    postcode: overrides.postcode ?? 'SW1A 1AA',
    city:     'London',
    phone:    overrides.phone    ?? '02071234567',
    email:    overrides.email    ?? `showroom-${Date.now()}@lomashwood.co.uk`,
    openingHours: { monday: '09:00-18:00', saturday: '10:00-16:00' },
    mapLink:  'https:',
    isActive: true,
  }),

  
  raw: (overrides: LocationOverrides = {}) => ({
    name:     overrides.name     ?? `Test Showroom ${Date.now()}`,
    address:  '1 Test Street, London',
    postcode: 'SW1A 1AA',
    city:     'London',
    phone:    '02071234567',
    email:    `showroom-${Date.now()}@lomashwood.co.uk`,
    openingHours: { monday: '09:00-18:00' },
    mapLink:  'https:',
    isActive: true,
  }),
};