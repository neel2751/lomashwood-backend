import { AvailabilityEntity } from '../../src/shared/types';
import { FIXED_DATE_NOW, FIXED_IDS } from './common.fixture';



export const availabilityMondayFixture: AvailabilityEntity = {
  id: FIXED_IDS.availabilityId,
  consultantId: FIXED_IDS.consultantId,
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '17:00',
  isActive: true,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const availabilityTuesdayFixture: AvailabilityEntity = {
  id: '40404040-4040-4040-a040-404040404040',
  consultantId: FIXED_IDS.consultantId,
  dayOfWeek: 2,
  startTime: '09:00',
  endTime: '17:00',
  isActive: true,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const availabilityWednesdayFixture: AvailabilityEntity = {
  id: '50505050-5050-4050-a050-505050505050',
  consultantId: FIXED_IDS.consultantId,
  dayOfWeek: 3,
  startTime: '10:00',
  endTime: '16:00',
  isActive: true,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const availabilityThursdayFixture: AvailabilityEntity = {
  id: '60606060-6060-4060-a060-606060606060',
  consultantId: FIXED_IDS.secondConsultantId,
  dayOfWeek: 4,
  startTime: '09:00',
  endTime: '17:00',
  isActive: true,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const availabilityInactiveFixture: AvailabilityEntity = {
  id: '70707070-7070-4070-a070-707070707070',
  consultantId: FIXED_IDS.consultantId,
  dayOfWeek: 5,
  startTime: '09:00',
  endTime: '13:00',
  isActive: false,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const consultantAvailabilityListFixture: AvailabilityEntity[] = [
  availabilityMondayFixture,
  availabilityTuesdayFixture,
  availabilityWednesdayFixture,
];

export const createAvailabilityPayload = {
  consultantId: FIXED_IDS.consultantId,
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '17:00',
};



interface AvailabilityOverrides {
  consultantId: string;
  dayOfWeek?: number;
}

export const availabilityFixtures = {
  
  createWeekday: (overrides: AvailabilityOverrides) => ({
    consultantId: overrides.consultantId,
    dayOfWeek:    overrides.dayOfWeek ?? 1,
    startTime:    '09:00',
    endTime:      '17:00',
  }),

  
  createInvalid: (overrides: AvailabilityOverrides) => ({
    consultantId: overrides.consultantId,
    dayOfWeek:    overrides.dayOfWeek ?? 2,
    startTime:    '17:00',
    endTime:      '09:00',
  }),

  
  raw: (overrides: AvailabilityOverrides) => ({
    consultantId: overrides.consultantId,
    dayOfWeek:    overrides.dayOfWeek ?? 6,
    startTime:    '09:00',
    endTime:      '17:00',
    isActive:     true,
  }),
};