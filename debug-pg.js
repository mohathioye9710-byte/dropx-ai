const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://dropx_user:dropx_password@localhost:5433/dropx_db?schema=public' });
  await client.connect();
  const res = await client.query('SELECT "keyData" FROM "Integration" WHERE platform=$1 LIMIT 1', ['shopify']);
  if (!res.rows.length) { console.log('No integration found'); return; }
  const creds = JSON.parse(res.rows[0].keyData);
  const shopUrl = creds.shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const token = creds.accessToken || creds.clientSecret;
  
  const headers = { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };
  const th = await fetch('https://' + shopUrl + '/admin/api/2024-04/themes.json', { headers }).then(r=>r.json());
  const theme = th.themes.find(t => t.role === 'main');
  console.log('Theme:', theme.name);

  const setRes = await fetch('https://' + shopUrl + '/admin/api/2024-04/themes/' + theme.id + '/assets.json?asset[key]=config/settings_data.json', { headers }).then(r=>r.json());
  const raw = JSON.parse(setRes.asset.value);
  console.log('ROOT KEYS:', Object.keys(raw));
  console.log('CURRENT KEYS:', raw.current ? Object.keys(raw.current) : 'none');
  
  if (raw.current && raw.current.blocks) {
    console.log('BLOCKS:', Object.keys(raw.current.blocks));
  }

  // Also check if templates exist in asset value or somewhere else
  // Actually, sections might be in templates/index.json in modern themes!
  await client.end();
}
run().catch(console.error);
