import { prisma } from '../src/utils/database';

const userId = 'cmhvgg0w40000xl70wg9j61um';

async function checkTokens() {
  const tokens = await prisma.fcmToken.findMany({
    where: { userId },
  });

  console.log(`\n📱 All FCM tokens for user ${userId}:`);
  console.log(JSON.stringify(tokens, null, 2));

  const activeTokens = await prisma.fcmToken.findMany({
    where: { userId, isActive: true },
  });

  console.log(`\n✅ Active FCM tokens: ${activeTokens.length}`);
  console.log(JSON.stringify(activeTokens, null, 2));

  await prisma.$disconnect();
  process.exit(0);
}

checkTokens();
