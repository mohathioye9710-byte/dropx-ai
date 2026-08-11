const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const activity = await prisma.activity.findFirst({
    where: { type: 'PRODUCT_GENERATE' },
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(activity.metadata, null, 2));
}
run();
