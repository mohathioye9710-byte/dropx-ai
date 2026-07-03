const { Client } = require('pg');
const OpenAI = require('openai');
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
  
  const openai = new OpenAI();
  console.log('Generating image...');
  const imageRes = await openai.images.generate({
     model: "gpt-image-2",
     prompt: "A premium lifestyle photo for an ecommerce store. Gadgets.",
     n: 1,
     size: "1024x1024"
  });
  
  const imageUrl = imageRes.data[0].url;
  console.log('Downloading image...');
  const dlRes = await fetch(imageUrl);
  const arrayBuffer = await dlRes.arrayBuffer();
  const base64Image = Buffer.from(arrayBuffer).toString('base64');
            
  console.log('Uploading to Shopify...');
  const assetPayload = { asset: { key: 'assets/hero-ai.jpg', attachment: base64Image } };
  const uploadRes = await fetch(`https://${shopUrl}/admin/api/2024-04/themes/${themeId}/assets.json`, {
     method: 'PUT',
     headers,
     body: JSON.stringify(assetPayload)
  });
  
  console.log('Upload status:', uploadRes.status);
  console.log('Upload ok?', uploadRes.ok);
  if (!uploadRes.ok) console.log(await uploadRes.text());
  
  await client.end();
}
run().catch(console.error);
