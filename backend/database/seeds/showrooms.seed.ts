import { DataSource } from 'typeorm';

export class ShowroomsSeed {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const showroomRepository = this.dataSource.getRepository('Showroom');

    const showrooms = [
      {
        name: 'Downtown Showroom',
        slug: 'downtown-showroom',
        address: '123 Main St, Downtown',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        phone: '+1-212-555-0123',
        email: 'downtown@lomashwood.com',
        isActive: true,
        coordinates: { lat: 40.7128, lng: -74.0060 },
        hours: {
          monday: '9:00-18:00',
          tuesday: '9:00-18:00',
          wednesday: '9:00-18:00',
          thursday: '9:00-18:00',
          friday: '9:00-18:00',
          saturday: '10:00-16:00',
          sunday: 'closed',
        },
      },
      {
        name: 'Westside Gallery',
        slug: 'westside-gallery',
        address: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        phone: '+1-310-555-0456',
        email: 'westside@lomashwood.com',
        isActive: true,
        coordinates: { lat: 34.0522, lng: -118.2437 },
        hours: {
          monday: '10:00-19:00',
          tuesday: '10:00-19:00',
          wednesday: '10:00-19:00',
          thursday: '10:00-19:00',
          friday: '10:00-19:00',
          saturday: '11:00-17:00',
          sunday: 'closed',
        },
      },
    ];

    for (const showroomData of showrooms) {
      const existingShowroom = await showroomRepository.findOne({ where: { slug: showroomData.slug } });
      if (!existingShowroom) {
        await showroomRepository.save(showroomRepository.create(showroomData));
      }
    }

    console.log('Showrooms seed completed');
  }
}
