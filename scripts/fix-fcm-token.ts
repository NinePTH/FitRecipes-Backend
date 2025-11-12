import { prisma } from '../src/utils/database';

const userId = 'cmhvgg0w40000xl70wg9j61um';

async function fixToken() {
  // Update token to active
  const result = await prisma.fcmToken.updateMany({
    where: { userId },
    data: { isActive: true },
  });

  console.log(`✅ Updated ${result.count} FCM token(s) to active`);

  // Verify
  const tokens = await prisma.fcmToken.findMany({
    where: { userId, isActive: true },
  });

  console.log(`\n📱 Active tokens now: ${tokens.length}`);
  tokens.forEach(t => {
    console.log(`  - ${t.fcmToken.substring(0, 30)}...`);
  });

  await prisma.$disconnect();
  process.exit(0);
}

fixToken();
