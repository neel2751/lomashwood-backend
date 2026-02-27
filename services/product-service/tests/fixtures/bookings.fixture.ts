import { AppointmentType, AppointmentStatus, ServiceType } from '@prisma/client';

export interface BookingFixture {
  id: string;
  bookingNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  appointmentType: AppointmentType;
  serviceType: ServiceType;
  isKitchen: boolean;
  isBedroom: boolean;
  status: AppointmentStatus;
  scheduledDate: Date;
  scheduledTime: string;
  duration: number;
  showroomId?: string;
  showroomName?: string;
  consultantId?: string;
  consultantName?: string;
  customerDetails: {
    fullName: string;
    email: string;
    phone: string;
    postcode: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    preferredContactMethod?: string;
  };
  notes?: string;
  reminderSent: boolean;
  confirmationSent: boolean;
  cancellationReason?: string;
  rescheduleCount: number;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  completedAt?: Date;
}

export const homeMeasurementKitchen: BookingFixture = {
  id: 'bkg_home_001',
  bookingNumber: 'BKG-2026-001001',
  userId: 'usr_001',
  userEmail: 'john.doe@example.com',
  userName: 'John Doe',
  userPhone: '+44 7700 900123',
  appointmentType: AppointmentType.HOME_MEASUREMENT,
  serviceType: ServiceType.DESIGN_CONSULTATION,
  isKitchen: true,
  isBedroom: false,
  status: AppointmentStatus.CONFIRMED,
  scheduledDate: new Date('2026-02-15T00:00:00Z'),
  scheduledTime: '10:00',
  duration: 120,
  consultantId: 'cons_001',
  consultantName: 'Sarah Mitchell',
  customerDetails: {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+44 7700 900123',
    postcode: 'SW1A 1AA',
    addressLine1: '123 High Street',
    addressLine2: 'Flat 4B',
    city: 'London',
    preferredContactMethod: 'phone',
  },
  notes: 'Customer interested in modern kitchen design',
  reminderSent: true,
  confirmationSent: true,
  rescheduleCount: 0,
  createdAt: new Date('2026-02-10T10:00:00Z'),
  updatedAt: new Date('2026-02-10T10:30:00Z'),
};

export const homeMeasurementBedroom: BookingFixture = {
  id: 'bkg_home_002',
  bookingNumber: 'BKG-2026-001002',
  userId: 'usr_002',
  userEmail: 'jane.smith@example.com',
  userName: 'Jane Smith',
  userPhone: '+44 7700 900456',
  appointmentType: AppointmentType.HOME_MEASUREMENT,
  serviceType: ServiceType.DESIGN_CONSULTATION,
  isKitchen: false,
  isBedroom: true,
  status: AppointmentStatus.CONFIRMED,
  scheduledDate: new Date('2026-02-16T00:00:00Z'),
  scheduledTime: '14:00',
  duration: 90,
  consultantId: 'cons_002',
  consultantName: 'Michael Roberts',
  customerDetails: {
    fullName: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+44 7700 900456',
    postcode: 'M1 1AA',
    addressLine1: '456 Oak Avenue',
    city: 'Manchester',
    preferredContactMethod: 'email',
  },
  notes: 'Fitted wardrobes for master bedroom',
  reminderSent: false,
  confirmationSent: true,
  rescheduleCount: 0,
  createdAt: new Date('2026-02-09T14:30:00Z'),
  updatedAt: new Date('2026-02-09T14:30:00Z'),
};

export const homeMeasurementBoth: BookingFixture = {
  id: 'bkg_home_003',
  bookingNumber: 'BKG-2026-001003',
  userId: 'usr_003',
  userEmail: 'robert.jones@example.com',
  userName: 'Robert Jones',
  userPhone: '+44 7700 900789',
  appointmentType: AppointmentType.HOME_MEASUREMENT,
  serviceType: ServiceType.DESIGN_CONSULTATION,
  isKitchen: true,
  isBedroom: true,
  status: AppointmentStatus.PENDING,
  scheduledDate: new Date('2026-02-17T00:00:00Z'),
  scheduledTime: '11:00',
  duration: 180,
  consultantId: 'cons_003',
  consultantName: 'Emma Wilson',
  customerDetails: {
    fullName: 'Robert Jones',
    email: 'robert.jones@example.com',
    phone: '+44 7700 900789',
    postcode: 'B1 1AA',
    addressLine1: '789 Park Lane',
    city: 'Birmingham',
    preferredContactMethod: 'phone',
  },
  notes: 'Full home renovation - kitchen and bedroom. Notify both teams.',
  reminderSent: false,
  confirmationSent: false,
  rescheduleCount: 0,
  createdAt: new Date('2026-02-11T09:15:00Z'),
  updatedAt: new Date('2026-02-11T09:15:00Z'),
};

export const onlineConsultationKitchen: BookingFixture = {
  id: 'bkg_online_001',
  bookingNumber: 'BKG-2026-001004',
  userId: 'usr_004',
  userEmail: 'sarah.williams@example.com',
  userName: 'Sarah Williams',
  userPhone: '+44 7700 900321',
  appointmentType: AppointmentType.ONLINE,
  serviceType: ServiceType.DESIGN_CONSULTATION,
  isKitchen: true,
  isBedroom: false,
  status: AppointmentStatus.CONFIRMED,
  scheduledDate: new Date('2026-02-14T00:00:00Z'),
  scheduledTime: '15:00',
  duration: 60,
  consultantId: 'cons_004',
  consultantName: 'David Thompson',
  customerDetails: {
    fullName: 'Sarah Williams',
    email: 'sarah.williams@example.com',
    phone: '+44 7700 900321',
    postcode: 'EH1 1AA',
    addressLine1: '321 Queen Street',
    city: 'Edinburgh',
    preferredContactMethod: 'email',
  },
  notes: 'Initial consultation via video call',
  reminderSent: true,
  confirmationSent: true,
  rescheduleCount: 0,
  createdAt: new Date('2026-02-08T16:20:00Z'),
  updatedAt: new Date('2026-02-08T16:45:00Z'),
};

export const onlineConsultationBedroom: BookingFixture = {
  id: 'bkg_online_002',
  bookingNumber: 'BKG-2026-001005',
  userId: 'usr_005',
  userEmail: 'michael.brown@example.com',
  userName: 'Michael Brown',
  userPhone: '+44 7700 900555',
  appointmentType: AppointmentType.ONLINE,
  serviceType: ServiceType.DESIGN_CONSULTATION,
  isKitchen: false,
  isBedroom: true,
  status: AppointmentStatus.COMPLETED,
  scheduledDate: new Date('2026-02-08T00:00:00Z'),
  scheduledTime: '16:00',
  duration: 45,
  consultantId: 'cons_005',
  consultantName: 'Lisa Anderson',
  customerDetails: {
    fullName: 'Michael Brown',
    email: 'michael.brown@example.com',
    phone: '+44 7700 900555',
    postcode: 'LS1 1AA',
    addressLine1: '555 Victoria Road',
    city: 'Leeds',
    preferredContactMethod: 'phone',
  },
  notes: 'Discussed bedroom storage solutions',
  reminderSent: true,
  confirmationSent: true,
  rescheduleCount: 0,
  createdAt: new Date('2026-02-05T11:00:00Z'),
  updatedAt: new Date('2026-02-08T17:00:00Z'),
  completedAt: new Date('2026-02-08T16:45:00Z'),
};

export const showroomVisitKitchen: BookingFixture = {
  id: 'bkg_showroom_001',
  bookingNumber: 'BKG-2026-001006',
  userId: 'usr_006',
  userEmail: 'emily.davis@example.com',
  userName: 'Emily Davis',
  userPhone: '+44 7700 900888',
  appointmentType: AppointmentType.SHOWROOM,
  serviceType: ServiceType.SHOWROOM_VISIT,
  isKitchen: true,
  isBedroom: false,
  status: AppointmentStatus.CONFIRMED,
  scheduledDate: new Date('2026-02-18T00:00:00Z'),
  scheduledTime: '13:00',
  duration: 90,
  showroomId: 'show_london_001',
  showroomName: 'Lomash Wood London Showroom',
  consultantId: 'cons_006',
  consultantName: 'James Clarke',
  customerDetails: {
    fullName: 'Emily Davis',
    email: 'emily.davis@example.com',
    phone: '+44 7700 900888',
    postcode: 'BS1 1AA',
    addressLine1: '888 Elm Street',
    city: 'Bristol',
    preferredContactMethod: 'email',
  },
  notes: 'Customer wants to see Luna White kitchen display',
  reminderSent: false,
  confirmationSent: true,
  rescheduleCount: 0,
  createdAt: new Date('2026-02-11T13:00:00Z'),
  updatedAt: new Date('2026-02-11T13:15:00Z'),
};

export const showroomVisitBedroom: BookingFixture = {
  id: 'bkg_showroom_002',
  bookingNumber: 'BKG-2026-001007',
  userId: 'usr_007',
  userEmail: 'david.wilson@example.com',
  userName: 'David Wilson',
  userPhone: '+44 7700 900999',
  appointmentType: AppointmentType.SHOWROOM,
  serviceType: ServiceType.SHOWROOM_VISIT,
  isKitchen: false,
  isBedroom: true,
  status: AppointmentStatus.CONFIRMED,
  scheduledDate: new Date('2026-02-19T00:00:00Z'),
  scheduledTime: '10:30',
  duration: 60,
  showroomId: 'show_manchester_001',
  showroomName: 'Lomash Wood Manchester Showroom',
  consultantId: 'cons_007',
  consultantName: 'Rachel Green',
  customerDetails: {
    fullName: 'David Wilson',
    email: 'david.wilson@example.com',
    phone: '+44 7700 900999',
    postcode: 'NE1 1AA',
    addressLine1: '999 Castle Road',
    city: 'Newcastle',
    preferredContactMethod: 'phone',
  },
  notes: 'Interested in sliding wardrobe systems',
  reminderSent: false,
  confirmationSent: true,
  rescheduleCount: 0,
  createdAt: new Date('2026-02-10T08:00:00Z'),
  updatedAt: new Date('2026-02-10T08:30:00Z'),
};

export const showroomVisitBoth: BookingFixture = {
  id: 'bkg_showroom_003',
  bookingNumber: 'BKG-2026-001008',
  userId: 'usr_008',
  userEmail: 'laura.taylor@example.com',
  userName: 'Laura Taylor',
  userPhone: '+44 7700 900222',
  appointmentType: AppointmentType.SHOWROOM,
  serviceType: ServiceType.SHOWROOM_VISIT,
  isKitchen: true,
  isBedroom: true,
  status: AppointmentStatus.RESCHEDULED,
  scheduledDate: new Date('2026-02-20T00:00:00Z'),
  scheduledTime: '14:00',
  duration: 120,
  showroomId: 'show_birmingham_001',
  showroomName: 'Lomash Wood Birmingham Showroom',
  consultantId: 'cons_008',
  consultantName: 'Tom Harris',
  customerDetails: {
    fullName: 'Laura Taylor',
    email: 'laura.taylor@example.com',
    phone: '+44 7700 900222',
    postcode: 'L1 1AA',
    addressLine1: '222 Maple Drive',
    city: 'Liverpool',
    preferredContactMethod: 'email',
  },
  notes: 'Complete home package consultation. Rescheduled from Feb 13.',
  reminderSent: false,
  confirmationSent: true,
  rescheduleCount: 1,
  createdAt: new Date('2026-02-07T10:00:00Z'),
  updatedAt: new Date('2026-02-11T15:00:00Z'),
};

export const cancelledBooking: BookingFixture = {
  id: 'bkg_cancelled_001',
  bookingNumber: 'BKG-2026-001009',
  userId: 'usr_009',
  userEmail: 'chris.martin@example.com',
  userName: 'Chris Martin',
  userPhone: '+44 7700 900333',
  appointmentType: AppointmentType.HOME_MEASUREMENT,
  serviceType: ServiceType.DESIGN_CONSULTATION,
  isKitchen: true,
  isBedroom: false,
  status: AppointmentStatus.CANCELLED,
  scheduledDate: new Date('2026-02-13T00:00:00Z'),
  scheduledTime: '09:00',
  duration: 120,
  consultantId: 'cons_009',
  consultantName: 'Sophie Brown',
  customerDetails: {
    fullName: 'Chris Martin',
    email: 'chris.martin@example.com',
    phone: '+44 7700 900333',
    postcode: 'CF1 1AA',
    addressLine1: '333 Bay Street',
    city: 'Cardiff',
    preferredContactMethod: 'phone',
  },
  notes: 'Customer cancelled due to budget constraints',
  reminderSent: false,
  confirmationSent: true,
  cancellationReason: 'Customer postponed project',
  rescheduleCount: 0,
  createdAt: new Date('2026-02-06T12:00:00Z'),
  updatedAt: new Date('2026-02-10T16:00:00Z'),
  cancelledAt: new Date('2026-02-10T16:00:00Z'),
};

export const noShowBooking: BookingFixture = {
  id: 'bkg_noshow_001',
  bookingNumber: 'BKG-2026-001010',
  userId: 'usr_010',
  userEmail: 'oliver.white@example.com',
  userName: 'Oliver White',
  userPhone: '+44 7700 900444',
  appointmentType: AppointmentType.ONLINE,
  serviceType: ServiceType.DESIGN_CONSULTATION,
  isKitchen: false,
  isBedroom: true,
  status: AppointmentStatus.NO_SHOW,
  scheduledDate: new Date('2026-02-09T00:00:00Z'),
  scheduledTime: '11:00',
  duration: 60,
  consultantId: 'cons_010',
  consultantName: 'Anna Lewis',
  customerDetails: {
    fullName: 'Oliver White',
    email: 'oliver.white@example.com',
    phone: '+44 7700 900444',
    postcode: 'GL1 1AA',
    addressLine1: '444 River Road',
    city: 'Gloucester',
    preferredContactMethod: 'email',
  },
  notes: 'Customer did not attend scheduled online consultation',
  reminderSent: true,
  confirmationSent: true,
  rescheduleCount: 0,
  createdAt: new Date('2026-02-05T14:00:00Z'),
  updatedAt: new Date('2026-02-09T11:30:00Z'),
};

export const walkInBooking: BookingFixture = {
  id: 'bkg_walkin_001',
  bookingNumber: 'BKG-2026-001011',
  userId: 'usr_011',
  userEmail: 'sophia.jackson@example.com',
  userName: 'Sophia Jackson',
  userPhone: '+44 7700 900666',
  appointmentType: AppointmentType.SHOWROOM,
  serviceType: ServiceType.WALK_IN,
  isKitchen: true,
  isBedroom: true,
  status: AppointmentStatus.COMPLETED,
  scheduledDate: new Date('2026-02-11T00:00:00Z'),
  scheduledTime: '15:30',
  duration: 45,
  showroomId: 'show_london_001',
  showroomName: 'Lomash Wood London Showroom',
  consultantId: 'cons_001',
  consultantName: 'Sarah Mitchell',
  customerDetails: {
    fullName: 'Sophia Jackson',
    email: 'sophia.jackson@example.com',
    phone: '+44 7700 900666',
    postcode: 'W1A 1AA',
    addressLine1: '666 Oxford Street',
    city: 'London',
    preferredContactMethod: 'phone',
  },
  notes: 'Walk-in customer, no prior booking',
  reminderSent: false,
  confirmationSent: false,
  rescheduleCount: 0,
  createdAt: new Date('2026-02-11T15:30:00Z'),
  updatedAt: new Date('2026-02-11T16:30:00Z'),
  completedAt: new Date('2026-02-11T16:15:00Z'),
};

export const urgentBooking: BookingFixture = {
  id: 'bkg_urgent_001',
  bookingNumber: 'BKG-2026-001012',
  userId: 'usr_012',
  userEmail: 'harry.evans@example.com',
  userName: 'Harry Evans',
  userPhone: '+44 7700 900777',
  appointmentType: AppointmentType.HOME_MEASUREMENT,
  serviceType: ServiceType.URGENT_CONSULTATION,
  isKitchen: true,
  isBedroom: false,
  status: AppointmentStatus.CONFIRMED,
  scheduledDate: new Date('2026-02-13T00:00:00Z'),
  scheduledTime: '08:00',
  duration: 90,
  consultantId: 'cons_002',
  consultantName: 'Michael Roberts',
  customerDetails: {
    fullName: 'Harry Evans',
    email: 'harry.evans@example.com',
    phone: '+44 7700 900777',
    postcode: 'OX1 1AA',
    addressLine1: '777 High Street',
    city: 'Oxford',
    preferredContactMethod: 'phone',
  },
  notes: 'Urgent - Property completion in 3 weeks',
  reminderSent: true,
  confirmationSent: true,
  rescheduleCount: 0,
  createdAt: new Date('2026-02-12T09:00:00Z'),
  updatedAt: new Date('2026-02-12T09:30:00Z'),
};

export const bookingFixtures: BookingFixture[] = [
  homeMeasurementKitchen,
  homeMeasurementBedroom,
  homeMeasurementBoth,
  onlineConsultationKitchen,
  onlineConsultationBedroom,
  showroomVisitKitchen,
  showroomVisitBedroom,
  showroomVisitBoth,
  cancelledBooking,
  noShowBooking,
  walkInBooking,
  urgentBooking,
];

export const getBookingById = (id: string): BookingFixture | undefined => {
  return bookingFixtures.find(booking => booking.id === id);
};

export const getBookingsByStatus = (status: AppointmentStatus): BookingFixture[] => {
  return bookingFixtures.filter(booking => booking.status === status);
};

export const getBookingsByUserId = (userId: string): BookingFixture[] => {
  return bookingFixtures.filter(booking => booking.userId === userId);
};

export const getBookingsByType = (type: AppointmentType): BookingFixture[] => {
  return bookingFixtures.filter(booking => booking.appointmentType === type);
};

export const getKitchenBookings = (): BookingFixture[] => {
  return bookingFixtures.filter(booking => booking.isKitchen);
};

export const getBedroomBookings = (): BookingFixture[] => {
  return bookingFixtures.filter(booking => booking.isBedroom);
};

export const getCombinedBookings = (): BookingFixture[] => {
  return bookingFixtures.filter(booking => booking.isKitchen && booking.isBedroom);
};

export const getShowroomBookings = (showroomId: string): BookingFixture[] => {
  return bookingFixtures.filter(booking => booking.showroomId === showroomId);
};

export const getConsultantBookings = (consultantId: string): BookingFixture[] => {
  return bookingFixtures.filter(booking => booking.consultantId === consultantId);
};

export const getUpcomingBookings = (): BookingFixture[] => {
  const now = new Date();
  return bookingFixtures.filter(
    booking => booking.scheduledDate > now && 
    (booking.status === AppointmentStatus.CONFIRMED || booking.status === AppointmentStatus.PENDING)
  );
};

export const getPastBookings = (): BookingFixture[] => {
  const now = new Date();
  return bookingFixtures.filter(booking => booking.scheduledDate < now);
};

export const createBookingFixture = (overrides: Partial<BookingFixture> = {}): BookingFixture => {
  const timestamp = new Date();
  const defaultBooking: BookingFixture = {
    id: `bkg_${Date.now()}`,
    bookingNumber: `BKG-2026-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`,
    userId: 'usr_default',
    userEmail: 'customer@example.com',
    userName: 'Test Customer',
    userPhone: '+44 7700 900000',
    appointmentType: AppointmentType.HOME_MEASUREMENT,
    serviceType: ServiceType.DESIGN_CONSULTATION,
    isKitchen: true,
    isBedroom: false,
    status: AppointmentStatus.PENDING,
    scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    scheduledTime: '10:00',
    duration: 120,
    customerDetails: {
      fullName: 'Test Customer',
      email: 'customer@example.com',
      phone: '+44 7700 900000',
      postcode: 'SW1A 1AA',
      addressLine1: '123 Test Street',
      city: 'London',
    },
    reminderSent: false,
    confirmationSent: false,
    rescheduleCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };

  return defaultBooking;
};

export default {
  bookingFixtures,
  homeMeasurementKitchen,
  homeMeasurementBedroom,
  homeMeasurementBoth,
  onlineConsultationKitchen,
  onlineConsultationBedroom,
  showroomVisitKitchen,
  showroomVisitBedroom,
  showroomVisitBoth,
  cancelledBooking,
  noShowBooking,
  walkInBooking,
  urgentBooking,
  getBookingById,
  getBookingsByStatus,
  getBookingsByUserId,
  getBookingsByType,
  getKitchenBookings,
  getBedroomBookings,
  getCombinedBookings,
  getShowroomBookings,
  getConsultantBookings,
  getUpcomingBookings,
  getPastBookings,
  createBookingFixture,
};