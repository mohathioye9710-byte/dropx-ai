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
  
  const idx = await fetch('https://' + shopUrl + '/admin/api/2024-04/themes/' + theme.id + '/assets.json?asset[key]=templates/index.json', { headers }).then(r=>r.json());
  
  if(idx.asset) {
     const data = JSON.parse(idx.asset.value);
     const hero = data.sections['hero_jVaWmY'];
     
     if (hero && hero.blocks['text_YLPk4p']) {
         hero.blocks['text_YLPk4p'].settings.text = "<p>Laser Fun Gadgets - TEST</p>";
         console.log('Sending update to Shopify...');
         
         const putRes = await fetch('https://' + shopUrl + '/admin/api/2024-04/themes/' + theme.id + '/assets.json', {
              method: 'PUT',
              headers,
              body: JSON.stringify({ asset: { key: 'templates/index.json', value: JSON.stringify(data) } })
         });
         
         console.log('PUT status:', putRes.status);
         console.log('PUT response:', await putRes.text());
     } else {
         console.log('Hero block not found', Object.keys(data.sections));
     }
  }

  await client.end();
}
run().catch(console.error);
