const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
  const integration = await prisma.integration.findFirst({ where: { platform: 'shopify' }});
  const creds = JSON.parse(integration.keyData);
  const shopUrl = creds.shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const adminToken = creds.accessToken || creds.clientSecret;

  const headers = { 'X-Shopify-Access-Token': adminToken, 'Content-Type': 'application/json' };

  // 1. Get Active Theme
  const themesRes = await fetch(`https://${shopUrl}/admin/api/2024-04/themes.json`, { headers });
  const themesData = await themesRes.json();
  const activeTheme = themesData.themes.find(t => t.role === 'main');
  console.log('Active Theme:', activeTheme.name, activeTheme.id);

  // 2. Get settings_data.json
  const settingsRes = await fetch(`https://${shopUrl}/admin/api/2024-04/themes/${activeTheme.id}/assets.json?asset[key]=config/settings_data.json`, { headers });
  const settingsData = await settingsRes.json();
  const settings = JSON.parse(settingsData.asset.value);
  
  // 3. Print keys
  console.log('--- SECTIONS ---');
  console.log(Object.keys(settings.current.sections || {}));
  
  if (settings.current.sections) {
    console.log('\n--- FIRST FEW SECTIONS DEEP DIVE ---');
    const firstFew = Object.keys(settings.current.sections).slice(0, 3);
    for (const k of firstFew) {
       console.log(`[${k}]:`, JSON.stringify(settings.current.sections[k], null, 2));
    }
  }

  // Check color settings
  console.log('\n--- SETTINGS SCHEMA KEYS ---');
  const s = settings.current.settings || {};
  console.log(Object.keys(s).filter(k => k.includes('color')).join(', '));
}
debug().catch(console.error).finally(() => prisma.$disconnect());
