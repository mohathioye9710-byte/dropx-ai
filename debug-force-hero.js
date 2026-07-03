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

  // Read current index.json
  const idxRes = await fetch(`https://${shopUrl}/admin/api/2024-04/themes/${themeId}/assets.json?asset[key]=templates/index.json`, { headers });
  const idxData = await idxRes.json();
  const indexJson = JSON.parse(idxData.asset.value);

  // Clean all old ai_ sections
  const aiKeys = Object.keys(indexJson.sections).filter(k => k.startsWith('ai_'));
  aiKeys.forEach(k => delete indexJson.sections[k]);
  if (Array.isArray(indexJson.order)) {
    indexJson.order = indexJson.order.filter(id => !id.startsWith('ai_'));
  }

  // Also DELETE the old hero section entirely (both from sections AND order)
  const oldHeroId = indexJson.order.find(id => indexJson.sections[id]?.type === 'hero' || indexJson.sections[id]?.type === 'image_banner');
  if (oldHeroId) {
    delete indexJson.sections[oldHeroId]; // DELETE from sections too!
    indexJson.order = indexJson.order.filter(id => id !== oldHeroId);
    console.log('Deleted old hero:', oldHeroId);
  }

  // Create the AI Hero section using the uploaded image
  const heroId = 'ai_hero_final';
  const marqueeId = 'ai_marquee_final';
  const aboutId = 'ai_about_final';

  indexJson.sections[heroId] = {
    type: "custom-liquid",
    settings: {
      custom_liquid: `
        <div style="position: relative; width: 100%; height: 60vh; min-height: 400px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; color: #ffffff; background-image: url('{{ 'hero-ai.jpg' | asset_url }}'); background-size: cover; background-position: center;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(0,0,0,0.55), rgba(0,0,0,0.3));"></div>
          <div style="position: relative; z-index: 1; padding: 20px; max-width: 800px;">
            <h1 style="font-size: 3rem; font-weight: bold; margin-bottom: 20px; color: #ffffff; text-shadow: 0 2px 8px rgba(0,0,0,0.5);">Amusez Vos Animaux avec Style !</h1>
            <p style="font-size: 1.2rem; margin-bottom: 30px; color: #ffffff; text-shadow: 0 1px 4px rgba(0,0,0,0.5);">Des gadgets laser premium pour des heures de fun</p>
            <a href="/collections/all" style="display: inline-block; padding: 15px 30px; background-color: #FF6B35; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 5px; font-size: 1.1rem; box-shadow: 0 4px 15px rgba(255,107,53,0.4); transition: transform 0.2s;">Découvrir la Collection</a>
          </div>
        </div>
      `
    }
  };

  indexJson.sections[marqueeId] = {
    type: "custom-liquid",
    settings: {
      custom_liquid: `
        <div style="background-color: #FF6B35; padding: 12px 0; overflow: hidden; white-space: nowrap;">
          <div style="display: inline-block; animation: marquee 20s linear infinite; color: #ffffff; font-weight: bold; font-size: 1rem; letter-spacing: 1px; text-transform: uppercase;">
            LazerLuxe Gadgets • Qualité Premium • Satisfaction Garantie • Livraison Express • Service 24/7 • LazerLuxe Gadgets • Qualité Premium • Satisfaction Garantie • Livraison Express • Service 24/7 • LazerLuxe Gadgets • Qualité Premium • Satisfaction Garantie • Livraison Express • Service 24/7
          </div>
          <style>
            @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          </style>
        </div>
      `
    }
  };

  indexJson.sections[aboutId] = {
    type: "custom-liquid",
    settings: {
      custom_liquid: `
        <div style="background-color: #ffffff; padding: 80px 20px; text-align: center; max-width: 800px; margin: 0 auto; color: #1a1a2e;">
          <h2 style="font-size: 2.2rem; margin-bottom: 24px; font-weight: bold;">À Propos de LazerLuxe Gadgets</h2>
          <p style="font-size: 1.1rem; line-height: 1.8; opacity: 0.9;">Chez LazerLuxe Gadgets, nous sélectionnons les meilleurs gadgets laser pour vos animaux de compagnie. Chaque produit est testé pour garantir des heures de divertissement et de bonheur pour vos compagnons à quatre pattes. Notre mission : rendre la vie de vos animaux plus fun, une lumière à la fois !</p>
        </div>
      `
    }
  };

  // Build order
  const restOfOrder = indexJson.order.filter(id => id !== heroId && id !== marqueeId && id !== aboutId);
  indexJson.order = [heroId, marqueeId, ...restOfOrder, aboutId];

  console.log('New sections:', Object.keys(indexJson.sections));
  console.log('New order:', indexJson.order);

  // Write back
  const writeRes = await fetch(`https://${shopUrl}/admin/api/2024-04/themes/${themeId}/assets.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ asset: { key: 'templates/index.json', value: JSON.stringify(indexJson) } })
  });
  console.log('Write status:', writeRes.status, writeRes.ok);
  if (!writeRes.ok) console.log(await writeRes.text());
  else console.log('SUCCESS! Go refresh your store!');

  await client.end();
}
run().catch(console.error);
