import bcrypt from 'bcryptjs';
import prisma from '../src/config/prisma';
import { UserRole } from '@prisma/client';

const ADMIN_EMAIL = 'balindamoris@gmail.com';
const ADMIN_PASSWORD = 'Balinda@123';

async function createAdmin() {
  try {
    console.log('🔍 Checking if admin user exists...');

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    if (existingUser) {
      console.log('✅ User found! Updating to admin...');
      
      // Update existing user to admin
      const updatedUser = await prisma.user.update({
        where: { email: ADMIN_EMAIL },
        data: {
          role: UserRole.ADMIN,
          password: hashedPassword,
          isVerified: true,
        },
      });

      console.log('✅ Admin user updated successfully!');
      console.log(`   ID: ${updatedUser.id}`);
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Role: ${updatedUser.role}`);
      console.log(`   Verified: ${updatedUser.isVerified}`);
    } else {
      console.log('📝 Creating new admin user...');
      
      // Create new admin user
      const newUser = await prisma.user.create({
        data: {
          email: ADMIN_EMAIL,
          password: hashedPassword,
          role: UserRole.ADMIN,
          isVerified: true,
        },
      });

      console.log('✅ Admin user created successfully!');
      console.log(`   ID: ${newUser.id}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Role: ${newUser.role}`);
      console.log(`   Verified: ${newUser.isVerified}`);
    }

    console.log('\n🎉 Admin credentials:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('\n✨ You can now login with these credentials!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdmin();

