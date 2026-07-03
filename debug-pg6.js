const { Client } = require('pg');

function updateTemplateBlocks(obj, branding, isAnnouncement = false) {
  if (!obj || typeof obj !== 'object') return;
  
  if (obj.type === 'heading' && obj.settings && typeof obj.settings.heading === 'string') {
    obj.settings.heading = branding.heroTitle;
  }
  if (obj.type === 'text' && obj.settings && typeof obj.settings.text === 'string' && !isAnnouncement) {
    if (obj.settings.text.length < 100) {
      obj.settings.text = branding.heroSubtitle;
    }
  }
  if ((obj.type === 'announcement' || obj.type === '_announcement' || obj.type === 'announcement-bar') && obj.settings && typeof obj.settings.text === 'string') {
    obj.settings.text = branding.announcementText;
  }
  if (obj.type === 'button' && obj.settings && typeof obj.settings.label === 'string') {
    // optional
  }

  for (const key of Object.keys(obj)) {
    if (key === 'announcement' || key.includes('announcement')) {
      updateTemplateBlocks(obj[key], branding, true);
    } else {
      updateTemplateBlocks(obj[key], branding, isAnnouncement);
    }
  }
}

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
     const branding = { heroTitle: "New Title", heroSubtitle: "<p>New Sub</p>" };
     
     console.log('BEFORE:', data.sections['hero_jVaWmY'].blocks['text_YLPk4p'].settings.text);
     updateTemplateBlocks(data, branding);
     console.log('AFTER:', data.sections['hero_jVaWmY'].blocks['text_YLPk4p'].settings.text);
  }

  await client.end();
}
run().catch(console.error);
