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
     const indexJson = JSON.parse(idx.asset.value);
     const branding = {
       storeName: "Test Store",
       aboutText: "Test About",
       colors: { primary: "#000", buttonText: "#fff", background: "#fff" }
     };

     const marqueeId = 'ai_marquee_' + Math.random().toString(36).substr(2, 9);
     const mediaId = 'ai_media_' + Math.random().toString(36).substr(2, 9);
            
     indexJson.sections[marqueeId] = {
       type: "marquee",
       settings: {
          text: `Test Marquee`,
          speed: 15,
          background_color: branding.colors.primary,
          text_color: branding.colors.buttonText
       }
     };
            
     indexJson.sections[mediaId] = {
        type: "media-with-content",
        settings: {
           layout: "image_first",
           background_color: branding.colors.background
        },
        blocks: {
           "heading": {
             type: "heading",
             settings: { text: `<p>À Propos de ${branding.storeName}</p>` }
           },
           "text": {
             type: "text",
             settings: { text: `<p>${branding.aboutText}</p>` }
           }
        },
        block_order: ["heading", "text"]
     };

     indexJson.order.push(marqueeId, mediaId);

     console.log('Sending PUT to Shopify...');
     const putRes = await fetch(`https://${shopUrl}/admin/api/2024-04/themes/${theme.id}/assets.json`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ asset: { key: 'templates/index.json', value: JSON.stringify(indexJson) } })
     });
         
     console.log('PUT status:', putRes.status);
     console.log('PUT response:', await putRes.text());
  }

  await client.end();
}
run().catch(console.error);
