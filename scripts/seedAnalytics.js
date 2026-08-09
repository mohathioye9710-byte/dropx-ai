const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.DROPX_DATABASE_URL || "postgresql://dropx_user:dropx_password@localhost:5433/dropx_db?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed...');

  // Find a user to attach the data to. Let's take the first user.
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found. Please login to the app first to create a user.');
    return;
  }

  console.log(`Seeding data for user: ${user.email}`);

  // Create a Store
  const store = await prisma.store.create({
    data: {
      userId: user.id,
      name: 'DropX Demo Store',
      url: 'dropx-demo.myshopify.com',
    },
  });

  console.log(`Created store: ${store.name}`);

  // Seed Orders (Last 30 days)
  const orders = [];
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    
    // Random orders per day (0 to 15)
    const ordersToday = Math.floor(Math.random() * 16);
    
    for (let j = 0; j < ordersToday; j++) {
      orders.push({
        storeId: store.id,
        totalAmount: 29.99 + Math.floor(Math.random() * 50),
        status: Math.random() > 0.1 ? 'COMPLETED' : 'CANCELLED',
        createdAt: d,
      });
    }
  }

  await prisma.order.createMany({
    data: orders,
  });
  console.log(`Created ${orders.length} orders`);

  // Seed Traffic (Last 30 days)
  const traffic = [];
  const sources = ['Facebook Ads', 'TikTok Ads', 'Google Ads', 'Organique', 'Direct'];
  const devices = ['Mobile', 'Mobile', 'Mobile', 'Desktop', 'Desktop', 'Tablet']; // weighted: 50% mobile, 33% desktop, 17% tablet
  const countries = ['France','France','France','France','Belgique','Belgique','Canada','Canada','Suisse','Côte d\'Ivoire','Maroc','Sénégal'];
  
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    
    // Random traffic per day
    const trafficToday = 50 + Math.floor(Math.random() * 200);
    
    for (let j = 0; j < trafficToday; j++) {
      traffic.push({
        storeId: store.id,
        source: sources[Math.floor(Math.random() * sources.length)],
        device: devices[Math.floor(Math.random() * devices.length)],
        country: countries[Math.floor(Math.random() * countries.length)],
        duration: 10 + Math.floor(Math.random() * 300),
        createdAt: d,
      });
    }
  }

  await prisma.trafficSession.createMany({
    data: traffic,
  });
  console.log(`Created ${traffic.length} traffic sessions`);

  // Seed Ad Campaigns
  const platforms = ['Facebook', 'TikTok', 'Google'];
  for (const p of platforms) {
    await prisma.adCampaign.create({
      data: {
        userId: user.id,
        platform: p,
        name: `${p} Conversion Campaign`,
        spend: 100 + Math.floor(Math.random() * 900),
        impressions: 10000 + Math.floor(Math.random() * 50000),
        clicks: 500 + Math.floor(Math.random() * 2000),
        conversions: 10 + Math.floor(Math.random() * 100),
        status: 'ACTIVE',
      },
    });
  }
  console.log('Created Ad Campaigns');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
