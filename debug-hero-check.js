const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new Client({ connectionString: 'postgresql://dropx_user:dropx_password@localhost:5433/dropx_db?schema=public' });
  await client.connect();
  const res = await client.query('SELECT "keyData" FROM "Integration" WHERE platform=$1 LIMIT 1', ['shopify']);
  const creds = JSON.parse(res.rows[0].keyData);
  const shopUrl = creds.shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const token = creds.accessToken || creds.clientSecret;
  const headers = { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };

  const th = await fetch('https://' + shopUrl + '/admin/api/2024-04/themes.json', { headers }).then(r=>r.json());
  const themeId = th.themes.find(t => t.role === 'main').id;

  // Check if hero-ai.jpg exists as asset
  const assetRes = await fetch(`https://${shopUrl}/admin/api/2024-04/themes/${themeId}/assets.json?asset[key]=assets/hero-ai.jpg`, { headers });
  console.log('Asset exists?', assetRes.ok, assetRes.status);

  // Read index.json
  const idxRes = await fetch(`https://${shopUrl}/admin/api/2024-04/themes/${themeId}/assets.json?asset[key]=templates/index.json`, { headers });
  const idxData = await idxRes.json();
  const indexJson = JSON.parse(idxData.asset.value);
  
  console.log('\nSECTION KEYS:', Object.keys(indexJson.sections));
  console.log('ORDER:', indexJson.order);
  
  // Check each section type
  for (const [key, section] of Object.entries(indexJson.sections)) {
    console.log(`  ${key}: type=${section.type}`);
    if (key.startsWith('ai_hero')) {
      console.log('    HERO HTML (first 200 chars):', JSON.stringify(section.settings?.custom_liquid).substring(0, 200));
    }
  }

  await client.end();
}
run().catch(console.error);
