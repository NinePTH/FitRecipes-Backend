/* eslint-disable no-console */
import { prisma } from '../src/utils/database';
import { hashPassword } from '../src/utils/auth';

async function createTestUsers() {
  try {
    console.log('Creating test users...');
    console.log(
      'ℹ️  Password Requirements: Min 8 chars + uppercase + lowercase + number + special char'
    );
    console.log('');

    // Test user 1: Standard User (matches README2.md)
    const hashedPassword1 = await hashPassword('User123!');
    await prisma.user.upsert({
      where: { email: 'user@fitrecipes.com' },
      update: {},
      create: {
        email: 'user@fitrecipes.com',
        password: hashedPassword1,
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        termsAccepted: true,
        isEmailVerified: true,
      },
    });

    // Test user 2: Chef user (matches README2.md)
    const hashedPassword2 = await hashPassword('Chef123!');
    await prisma.user.upsert({
      where: { email: 'chef@fitrecipes.com' },
      update: {},
      create: {
        email: 'chef@fitrecipes.com',
        password: hashedPassword2,
        firstName: 'Chef',
        lastName: 'Gordon',
        role: 'CHEF',
        termsAccepted: true,
        isEmailVerified: true,
      },
    });

    // Test user 3: Admin user (matches README2.md)
    const hashedPassword3 = await hashPassword('Admin123!');
    await prisma.user.upsert({
      where: { email: 'admin@fitrecipes.com' },
      update: {},
      create: {
        email: 'admin@fitrecipes.com',
        password: hashedPassword3,
        firstName: 'Admin',
        lastName: 'Administrator',
        role: 'ADMIN',
        termsAccepted: true,
        isEmailVerified: true,
      },
    });

    // Test user 4: Valid user for general testing
    const hashedPassword4 = await hashPassword('Test123!');
    await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        password: hashedPassword4,
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        termsAccepted: true,
        isEmailVerified: true,
      },
    });

    // Test user 5: Blocked user (simulate 5+ failed attempts)
    const hashedPassword5 = await hashPassword('Blocked123!');
    await prisma.user.upsert({
      where: { email: 'blocked@example.com' },
      update: {
        failedLoginAttempts: 5,
        blockedUntil: new Date(Date.now() + 15 * 60 * 1000), // Blocked for 15 minutes
      },
      create: {
        email: 'blocked@example.com',
        password: hashedPassword5,
        firstName: 'Blocked',
        lastName: 'User',
        role: 'USER',
        termsAccepted: true,
        isEmailVerified: true,
        failedLoginAttempts: 5,
        blockedUntil: new Date(Date.now() + 15 * 60 * 1000), // Blocked for 15 minutes
      },
    });

    console.log('✅ Test users created successfully!');
    console.log('');
    console.log('📋 Primary Test Credentials (for README2.md):');
    console.log('┌──────────────────────────────────────────────────────────┐');
    console.log('│ 1. Standard User                                         │');
    console.log('│    Email:    user@fitrecipes.com                         │');
    console.log('│    Password: User123!                                    │');
    console.log('│    Role:     USER                                        │');
    console.log('├──────────────────────────────────────────────────────────┤');
    console.log('│ 2. Chef Account                                          │');
    console.log('│    Email:    chef@fitrecipes.com                         │');
    console.log('│    Password: Chef123!                                    │');
    console.log('│    Role:     CHEF                                        │');
    console.log('├──────────────────────────────────────────────────────────┤');
    console.log('│ 3. Admin Account                                         │');
    console.log('│    Email:    admin@fitrecipes.com                        │');
    console.log('│    Password: Admin123!                                   │');
    console.log('│    Role:     ADMIN                                       │');
    console.log('└──────────────────────────────────────────────────────────┘');
    console.log('');
    console.log('🧪 Additional Test Accounts:');
    console.log('4. General Testing:    test@example.com / Test123!');
    console.log(
      '5. Blocked Account:    blocked@example.com / Blocked123! (locked for 15min)'
    );
    console.log('');
    console.log('✅ All passwords meet validation requirements:');
    console.log('   • Min 8 characters');
    console.log('   • At least one uppercase letter');
    console.log('   • At least one lowercase letter');
    console.log('   • At least one number');
    console.log('   • At least one special character (!@#$%^&*)');
    console.log('');
    console.log('⚠️  Test Cases for Authentication:');
    console.log('   • Invalid email: nonexistent@example.com (should fail)');
    console.log(
      '   • Wrong password: Use any valid email with wrong password (should fail)'
    );
    console.log(
      '   • Weak password: Try registering with "pass" (validation error)'
    );
    console.log(
      '   • Missing terms: Register with agreeToTerms: false (validation error)'
    );
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
