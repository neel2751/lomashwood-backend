import { PrismaClient, AppointmentType, AppointmentStatus, BookingCategory, DayOfWeek } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const DAYS_OF_WEEK: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
];

const SPECIALIZATIONS = [
  'Kitchen Design',
  'Bedroom Design',
  'Interior Consultation',
  'Space Planning',
  'Custom Furniture',
  'Modern Design',
  'Traditional Design'
];

async function seedConsultants() {
  console.log('Seeding consultants...');

  const consultants = await Promise.all(
    Array.from({ length: 10 }, async () => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName }).toLowerCase();

      return prisma.consultant.create({
        data: {
          name: `${firstName} ${lastName}`,
          email,
          phone: faker.phone.number('+44##########'),
          specialization: faker.helpers.arrayElements(SPECIALIZATIONS, { min: 1, max: 3 }),
          bio: faker.lorem.paragraph(),
          profileImage: faker.image.avatar(),
          isActive: true,
          isAvailable: faker.datatype.boolean(0.9)
        }
      });
    })
  );

  console.log(`Created ${consultants.length} consultants`);
  return consultants;
}

async function seedAvailability(consultants: any[]) {
  console.log('Seeding consultant availability...');

  const availabilities = [];

  for (const consultant of consultants) {
    const workingDays = faker.helpers.arrayElements(DAYS_OF_WEEK.slice(0, 5), { min: 3, max: 5 });

    for (const day of workingDays) {
      availabilities.push(
        prisma.availability.create({
          data: {
            consultantId: consultant.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '17:00',
            isRecurring: true,
            isBlocked: false
          }
        })
      );
    }

    const randomBlockedDay = faker.helpers.arrayElement(workingDays);
    const futureDate = faker.date.future({ years: 0.1 });
    
    availabilities.push(
      prisma.availability.create({
        data: {
          consultantId: consultant.id,
          dayOfWeek: randomBlockedDay,
          startTime: '09:00',
          endTime: '17:00',
          isRecurring: false,
          specificDate: futureDate,
          isBlocked: true,
          blockReason: 'Personal leave'
        }
      })
    );
  }

  await Promise.all(availabilities);
  console.log(`Created ${availabilities.length} availability records`);
}

async function seedShowrooms() {
  console.log('Seeding showrooms...');

  const cities = [
    { name: 'London', postcode: 'SW1A 1AA', lat: 51.5074, lng: -0.1278 },
    { name: 'Manchester', postcode: 'M1 1AD', lat: 53.4808, lng: -2.2426 },
    { name: 'Birmingham', postcode: 'B1 1AA', lat: 52.4862, lng: -1.8904 },
    { name: 'Leeds', postcode: 'LS1 1AA', lat: 53.8008, lng: -1.5491 },
    { name: 'Glasgow', postcode: 'G1 1AA', lat: 55.8642, lng: -4.2518 }
  ];

  const showrooms = await Promise.all(
    cities.map((city) =>
      prisma.showroom.create({
        data: {
          name: `Lomash Wood ${city.name}`,
          address: faker.location.streetAddress(),
          city: city.name,
          postcode: city.postcode,
          country: 'United Kingdom',
          email: `${city.name.toLowerCase()}@lomashwood.com`,
          phone: faker.phone.number('+44##########'),
          latitude: city.lat,
          longitude: city.lng,
          mapLink: `https://maps.google.com/?q=${city.lat},${city.lng}`,
          image: faker.image.urlLoremFlickr({ category: 'building' }),
          images: Array.from({ length: 3 }, () => faker.image.urlLoremFlickr({ category: 'interior' })),
          openingHours: {
            monday: { open: '09:00', close: '18:00' },
            tuesday: { open: '09:00', close: '18:00' },
            wednesday: { open: '09:00', close: '18:00' },
            thursday: { open: '09:00', close: '18:00' },
            friday: { open: '09:00', close: '18:00' },
            saturday: { open: '10:00', close: '16:00' },
            sunday: { closed: true }
          },
          timezone: 'Europe/London',
          capacity: faker.number.int({ min: 3, max: 10 }),
          isActive: true
        }
      })
    )
  );

  console.log(`Created ${showrooms.length} showrooms`);
  return showrooms;
}

async function seedBookings(consultants: any[], showrooms: any[]) {
  console.log('Seeding bookings...');

  const statuses: AppointmentStatus[] = [
    'PENDING',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW'
  ];

  const appointmentTypes: AppointmentType[] = [
    'HOME_MEASUREMENT',
    'ONLINE',
    'SHOWROOM'
  ];

  const categories: BookingCategory[] = ['KITCHEN', 'BEDROOM', 'BOTH'];

  const bookings = await Promise.all(
    Array.from({ length: 50 }, async () => {
      const appointmentType = faker.helpers.arrayElement(appointmentTypes);
      const status = faker.helpers.arrayElement(statuses);
      const scheduledDate = faker.date.between({
        from: new Date(),
        to: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      });

      const hour = faker.number.int({ min: 9, max: 16 });
      const scheduledTime = `${hour.toString().padStart(2, '0')}:00`;
      const duration = faker.helpers.arrayElement([30, 60, 90, 120]);

      return prisma.booking.create({
        data: {
          appointmentType,
          status,
          category: faker.helpers.arrayElement(categories),
          customerName: faker.person.fullName(),
          customerEmail: faker.internet.email().toLowerCase(),
          customerPhone: faker.phone.number('+44##########'),
          customerPostcode: faker.location.zipCode('??# #??'),
          customerAddress: faker.location.streetAddress(true),
          consultantId:
            appointmentType !== 'SHOWROOM'
              ? faker.helpers.arrayElement(consultants).id
              : null,
          showroomId:
            appointmentType === 'SHOWROOM'
              ? faker.helpers.arrayElement(showrooms).id
              : null,
          scheduledDate,
          scheduledTime,
          duration,
          notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.5 }),
          internalNotes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
          confirmedAt: status === 'CONFIRMED' || status === 'COMPLETED' ? faker.date.past() : null,
          cancelledAt: status === 'CANCELLED' ? faker.date.past() : null,
          completedAt: status === 'COMPLETED' ? faker.date.past() : null,
          cancellationReason: status === 'CANCELLED' ? 'Customer request' : null
        }
      });
    })
  );

  console.log(`Created ${bookings.length} bookings`);
  return bookings;
}

async function seedReminders(bookings: any[]) {
  console.log('Seeding reminders...');

  const confirmedBookings = bookings.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'PENDING'
  );

  const reminders = [];

  for (const booking of confirmedBookings) {
    const reminderDate = new Date(booking.scheduledDate);
    reminderDate.setHours(reminderDate.getHours() - 24);

    reminders.push(
      prisma.reminder.create({
        data: {
          bookingId: booking.id,
          type: 'EMAIL',
          status: new Date() > reminderDate ? 'SENT' : 'PENDING',
          scheduledFor: reminderDate,
          sentAt: new Date() > reminderDate ? reminderDate : null,
          recipientEmail: booking.customerEmail,
          subject: 'Appointment Reminder - Lomash Wood',
          message: `Your appointment is scheduled for ${booking.scheduledDate.toDateString()} at ${booking.scheduledTime}`
        }
      })
    );

    if (booking.customerPhone) {
      const smsReminderDate = new Date(booking.scheduledDate);
      smsReminderDate.setHours(smsReminderDate.getHours() - 2);

      reminders.push(
        prisma.reminder.create({
          data: {
            bookingId: booking.id,
            type: 'SMS',
            status: new Date() > smsReminderDate ? 'SENT' : 'PENDING',
            scheduledFor: smsReminderDate,
            sentAt: new Date() > smsReminderDate ? smsReminderDate : null,
            recipientPhone: booking.customerPhone,
            message: `Reminder: Your appointment with Lomash Wood is today at ${booking.scheduledTime}`
          }
        })
      );
    }
  }

  await Promise.all(reminders);
  console.log(`Created ${reminders.length} reminders`);
}

async function main() {
  console.log('Starting seed...');

  await prisma.$transaction(async (tx) => {
    await tx.reminder.deleteMany();
    await tx.booking.deleteMany();
    await tx.availability.deleteMany();
    await tx.showroom.deleteMany();
    await tx.consultant.deleteMany();
    await tx.timeSlot.deleteMany();
    await tx.calendarIntegration.deleteMany();
  });

  const consultants = await seedConsultants();
  await seedAvailability(consultants);
  const showrooms = await seedShowrooms();
  const bookings = await seedBookings(consultants, showrooms);
  await seedReminders(bookings);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });