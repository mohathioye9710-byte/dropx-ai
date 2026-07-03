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

  // Fetch all assets
  const assetsRes = await fetch('https://' + shopUrl + '/admin/api/2024-04/themes/' + theme.id + '/assets.json', { headers }).then(r=>r.json());
  const assetKeys = assetsRes.assets.map(a => a.key);
  
  // Look for index.json or header-group.json or similar
  const indexKey = assetKeys.find(k => k === 'templates/index.json');
  if (indexKey) {
     const idxRes = await fetch('https://' + shopUrl + '/admin/api/2024-04/themes/' + theme.id + '/assets.json?asset[key]=templates/index.json', { headers }).then(r=>r.json());
     console.log('--- INDEX.JSON ---');
     console.log(idxRes.asset.value);
  }

  const headerKey = assetKeys.find(k => k.includes('header-group.json') || k.includes('announcement-bar.json') || k.includes('settings_data.json')===false && k.includes('header'));
  if (headerKey) {
     const hRes = await fetch('https://' + shopUrl + '/admin/api/2024-04/themes/' + theme.id + '/assets.json?asset[key]=' + headerKey, { headers }).then(r=>r.json());
     console.log('--- ' + headerKey + ' ---');
     console.log(hRes.asset.value);
  }

  await client.end();
}
run().catch(console.error);
