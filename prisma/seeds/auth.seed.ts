import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class AuthSeed {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const userRepository = this.dataSource.getRepository('User');
    const roleRepository = this.dataSource.getRepository('Role');

    // Create roles
    const roles = [
      { name: 'admin', description: 'System administrator' },
      { name: 'user', description: 'Regular user' },
      { name: 'moderator', description: 'Content moderator' },
    ];

    for (const roleData of roles) {
      const existingRole = await roleRepository.findOne({ where: { name: roleData.name } });
      if (!existingRole) {
        await roleRepository.save(roleRepository.create(roleData));
      }
    }

    // Create admin user
    const adminRole = await roleRepository.findOne({ where: { name: 'admin' } });
    const existingAdmin = await userRepository.findOne({ where: { email: 'admin@lomashwood.com' } });
    
    if (!existingAdmin && adminRole) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await userRepository.save(userRepository.create({
        email: 'admin@lomashwood.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        roles: [adminRole],
      }));
    }

    console.log('Auth seed completed');
  }
}