/* eslint-disable no-console */
import { prisma } from '../src/utils/database';
import { hashPassword } from '../src/utils/auth';

async function createTestUsers() {
  try {
    console.log('Creating test users...');

    // Test user 1: Valid credentials for successful login
    const hashedPassword1 = await hashPassword('password123');
    await prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {},
      create: {
        email: 'user@example.com',
        password: hashedPassword1,
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        termsAccepted: true,
        isEmailVerified: true,
      },
    });

    // Test user 2: User for testing existing email
    const hashedPassword2 = await hashPassword('password123');
    await prisma.user.upsert({
      where: { email: 'existing@example.com' },
      update: {},
      create: {
        email: 'existing@example.com',
        password: hashedPassword2,
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'USER',
        termsAccepted: true,
        isEmailVerified: true,
      },
    });

    // Test user 3: Blocked user (simulate 5+ failed attempts)
    const hashedPassword3 = await hashPassword('password123');
    await prisma.user.upsert({
      where: { email: 'blocked@example.com' },
      update: {
        failedLoginAttempts: 5,
        blockedUntil: new Date(Date.now() + 15 * 60 * 1000), // Blocked for 15 minutes
      },
      create: {
        email: 'blocked@example.com',
        password: hashedPassword3,
        firstName: 'Blocked',
        lastName: 'User',
        role: 'USER',
        termsAccepted: true,
        isEmailVerified: true,
        failedLoginAttempts: 5,
        blockedUntil: new Date(Date.now() + 15 * 60 * 1000), // Blocked for 15 minutes
      },
    });

    // Test user 4: Chef user
    const hashedPassword4 = await hashPassword('chefpass123');
    await prisma.user.upsert({
      where: { email: 'chef@example.com' },
      update: {},
      create: {
        email: 'chef@example.com',
        password: hashedPassword4,
        firstName: 'Chef',
        lastName: 'Gordon',
        role: 'CHEF',
        termsAccepted: true,
        isEmailVerified: true,
      },
    });

    // Test user 5: Admin user
    const hashedPassword5 = await hashPassword('adminpass123');
    await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        password: hashedPassword5,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        termsAccepted: true,
        isEmailVerified: true,
      },
    });

    console.log('✅ Test users created successfully!');
    console.log('');
    console.log('📋 Test Credentials:');
    console.log('1. Valid Login: user@example.com / password123');
    console.log(
      '2. Existing Email: existing@example.com (for registration tests)'
    );
    console.log('3. Blocked Account: blocked@example.com / password123');
    console.log('4. Chef Account: chef@example.com / chefpass123');
    console.log('5. Admin Account: admin@example.com / adminpass123');
    console.log('');
    console.log('⚠️  Test Cases:');
    console.log('- Invalid email: invalid@example.com (should fail)');
    console.log(
      '- Wrong password: Use any email with wrong password (should fail)'
    );
    console.log('- Password < 6 chars: Will be caught by validation');
    console.log('- agreeToTerms: false: Will be caught by validation');
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
