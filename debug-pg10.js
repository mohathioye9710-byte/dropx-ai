const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://dropx_user:dropx_password@localhost:5433/dropx_db?schema=public' });
  await client.connect();
  const res = await client.query('SELECT "keyData" FROM "Integration" WHERE platform=$1 LIMIT 1', ['shopify']);
  const creds = JSON.parse(res.rows[0].keyData);
  const shopUrl = creds.shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const token = creds.accessToken || creds.clientSecret;
  const headers = { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };
  
  const th = await fetch('https://' + shopUrl + '/admin/api/2024-04/themes.json', { headers }).then(r=>r.json());
  const theme = th.themes.find(t => t.role === 'main');
  
  const idx = await fetch('https://' + shopUrl + '/admin/api/2024-04/themes/' + theme.id + '/assets.json?asset[key]=sections/hero.liquid', { headers }).then(r=>r.json());
  if(idx.asset) {
     const text = idx.asset.value;
     // extract schema
     const match = text.match(/{% schema %}([\s\S]*?){% endschema %}/);
     if (match) {
        const schema = JSON.parse(match[1]);
        const imgSetting = schema.settings.find(s => s.type === 'image_picker');
        console.log('Image Setting ID:', imgSetting ? imgSetting.id : 'Not found');
     } else {
        console.log('No schema found');
     }
  }

  await client.end();
}
run().catch(console.error);
