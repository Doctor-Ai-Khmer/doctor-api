import { DataSource } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

export class AdminSeeder {
  constructor(private dataSource: DataSource) {}

  async seed() {
    const userRepository = this.dataSource.getRepository(User);

    // Use environment variables or fallback to defaults
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@doctorai.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminName = process.env.ADMIN_NAME || 'System Administrator';

    // Check if admin already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log(`Admin user ${adminEmail} already exists, skipping...`);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const adminUser = userRepository.create({
      email: adminEmail,
      password: hashedPassword,
      fullName: adminName,
      role: UserRole.ADMIN,
      isActive: true,
      isPremium: true,
      uploadCount: 0,
      isBlocked: false
    });

    await userRepository.save(adminUser);
    console.log(`Admin user ${adminEmail} created successfully`);
  }
}
