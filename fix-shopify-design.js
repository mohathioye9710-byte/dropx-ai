// Script direct pour corriger le design Shopify — sans Prisma, sans app web
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const OpenAI = require('openai');

const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.DROPX_DATABASE_URL;
const pool = new Pool({ connectionString: dbUrl });

async function main() {
  // 1. Récupérer les credentials Shopify depuis la DB
  console.log('🔍 Recherche des credentials Shopify...');
  const { rows } = await pool.query("SELECT * FROM \"Integration\" WHERE platform = 'shopify' AND status = 'connected' LIMIT 1");
  
  if (rows.length === 0) {
    console.error('❌ Aucune intégration Shopify trouvée.');
    process.exit(1);
  }

  const creds = JSON.parse(rows[0].keyData);
  let shopUrl = (creds.domain || creds.shopUrl || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const adminToken = creds.token || creds.accessToken || creds.clientSecret;
  
  console.log(`✅ Shopify trouvé: ${shopUrl}`);
  
  const headers = { 'X-Shopify-Access-Token': adminToken, 'Content-Type': 'application/json' };

  // 2. Récupérer le thème actif
  console.log('🎨 Recherche du thème actif...');
  const themeRes = await fetch(`https://${shopUrl}/admin/api/2024-04/themes.json`, { headers });
  const themeData = await themeRes.json();
  const activeTheme = (themeData.themes || []).find(t => t.role === 'main');
  if (!activeTheme) { console.error('❌ Aucun thème actif.'); process.exit(1); }
  const themeId = activeTheme.id;
  console.log(`✅ Thème actif: ${activeTheme.name} (ID: ${themeId})`);

  // 3. Récupérer les produits
  const prodRes = await fetch(`https://${shopUrl}/admin/api/2024-04/products.json?limit=10`, { headers });
  const prodData = await prodRes.json();
  const products = (prodData.products || []).map(p => p.title);
  console.log(`📦 Produits: ${products.join(', ')}`);

  // 4. Shop name
  let shopName = 'My Store';
  try {
    const shopRes = await fetch(`https://${shopUrl}/admin/api/2024-04/shop.json`, { headers });
    const shopData = await shopRes.json();
    shopName = shopData.shop?.name || shopName;
  } catch(e) {}
  console.log(`🏪 Boutique: ${shopName}`);

  // 5. Générer le branding via OpenAI
  console.log('🤖 Génération du branding via OpenAI...');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: `You are an expert Shopify store designer.
Store: "${shopName}". Products: ${products.join(', ')}. Niche: cleaning/tech.
Generate a PREMIUM brand redesign with clean white backgrounds, dark readable text, modern green accent.
Return ONLY valid JSON:
{
  "storeName": "Catchy store name (max 25 chars)",
  "announcementText": "Short announcement in French with emoji",
  "heroTitle": "Punchy hero headline in French (max 6 words)",
  "heroSubtitle": "Subtitle in French (1 sentence, max 12 words)",
  "aboutText": "Premium About paragraph in French (2-3 sentences)",
  "colors": { "primary": "#27ae60", "secondary": "#f3d0db", "background": "#FFFFFF", "text": "#111111", "buttonBg": "#000000", "buttonText": "#FFFFFF", "announcementBg": "#76a374", "announcementText": "#FFFFFF" },
  "font": "Inter", "vibe": "Clean & Trustworthy"
}
KEEP THE EXACT COLORS. Be creative only with the text. Seed: ${Math.random()}` }],
    model: "gpt-4o",
    temperature: 0.9,
    response_format: { type: "json_object" }
  });

  const branding = JSON.parse(completion.choices[0].message.content);
  console.log(`✅ Branding: ${branding.storeName} | Hero: ${branding.heroTitle}`);

  // 6. Lire index.json
  console.log('📄 Lecture de templates/index.json...');
  const indexRes = await fetch(`https://${shopUrl}/admin/api/2024-04/themes/${themeId}/assets.json?asset[key]=templates/index.json`, { headers });
  const indexData = await indexRes.json();
  if (!indexData.asset?.value) { console.error('❌ index.json introuvable.'); process.exit(1); }
  const indexJson = JSON.parse(indexData.asset.value);

  // 7. Supprimer anciennes sections AI
  Object.keys(indexJson.sections).filter(k => k.startsWith('ai_')).forEach(k => delete indexJson.sections[k]);
  if (Array.isArray(indexJson.order)) {
    indexJson.order = indexJson.order.filter(id => !id.startsWith('ai_'));
  }

  // 8. Créer les sections — DESIGN IDENTIQUE À LA MAQUETTE
  const sid = () => 'ai_' + Math.random().toString(36).substr(2, 9);
  const [stylesId, heroId, marqueeId, aboutId] = [sid(), sid(), sid(), sid()];

  indexJson.sections[stylesId] = { type: "custom-liquid", settings: { custom_liquid: `
    <style>
      :root { --color-background: #FFFFFF !important; --color-foreground: #111111 !important; }
      #shopify-section-header,.header-wrapper,.header,sticky-header,
      .shopify-section-group-header-group,.shopify-section-group-footer-group {
        background: #FFFFFF !important; color: #111111 !important; border: none !important;
      }
      html,body,.gradient,.color-background-1,.color-background-2,
      .footer,.shopify-section,#MainContent,[id^="shopify-section-"]>* {
        background: #FFFFFF !important; color: #111111 !important;
      }
      h1,h2,h3,h4,h5,h6,p,span,li,.price,[class*="price"],[class*="title"],
      .card__heading,.card__information,.header__menu-item,.header__heading-link {
        color: #111111 !important;
      }
      .header__icon svg,.icon { fill: #111111 !important; }
      @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    </style>
  `}};

  indexJson.sections[heroId] = { type: "custom-liquid", settings: { custom_liquid: `
    <div style="width:100%;display:flex;flex-direction:column;align-items:center;text-align:center;background:#FFFFFF;padding:60px 24px;">
      <div style="display:inline-block;padding:4px 12px;border-radius:4px;border:1px solid ${branding.colors.primary}50;color:${branding.colors.primary};font-size:0.75rem;font-weight:bold;letter-spacing:1px;text-transform:uppercase;margin-bottom:24px;">${branding.vibe}</div>
      <h1 style="font-size:clamp(2rem,5vw,3.5rem);font-weight:800;margin:0 0 16px;color:#111;letter-spacing:-1px;line-height:1.15;">${branding.heroTitle}</h1>
      <p style="font-size:1.1rem;margin:0 0 30px;color:#111;opacity:0.8;max-width:550px;line-height:1.6;">${branding.heroSubtitle}</p>
      <a href="/collections/all" style="display:inline-block;padding:14px 40px;background:#000;color:#fff !important;text-decoration:none;font-weight:700;border-radius:4px;font-size:1rem;">Catalogue</a>
    </div>
  `}};

  indexJson.sections[marqueeId] = { type: "custom-liquid", settings: { custom_liquid: `
    <div style="background:${branding.colors.primary};color:#fff;padding:12px 0;overflow:hidden;white-space:nowrap;">
      <div style="display:inline-block;animation:marquee 20s linear infinite;font-weight:bold;font-size:0.85rem;letter-spacing:2px;text-transform:uppercase;">
        ✦ ${branding.storeName} ✦ Qualité Premium ✦ Satisfaction Garantie ✦ Livraison Express ✦ Service 24/7 ✦ ${branding.storeName} ✦ Qualité Premium ✦ Satisfaction Garantie ✦ Livraison Express ✦
      </div>
    </div>
  `}};

  indexJson.sections[aboutId] = { type: "custom-liquid", settings: { custom_liquid: `
    <div style="padding:60px 20px;text-align:center;background:#FFFFFF;">
      <div style="max-width:700px;margin:0 auto;">
        <h2 style="font-size:2rem;margin-bottom:24px;font-weight:800;color:#111;">À Propos de ${branding.storeName}</h2>
        <p style="font-size:1.1rem;line-height:1.7;color:#111;opacity:0.8;">${branding.aboutText}</p>
        <div style="margin-top:30px;">
          <a href="/collections/all" style="display:inline-block;padding:12px 30px;background:#000;color:#fff !important;text-decoration:none;font-weight:bold;border-radius:4px;font-size:1rem;">Explorer nos produits</a>
        </div>
      </div>
    </div>
  `}};

  // Supprimer ancien hero natif
  if (Array.isArray(indexJson.order)) {
    const heroTypes = ['hero','image_banner','slideshow','image-banner','banner'];
    const oldHero = indexJson.order.find(id => indexJson.sections[id] && heroTypes.includes(indexJson.sections[id].type));
    if (oldHero) { delete indexJson.sections[oldHero]; indexJson.order = indexJson.order.filter(id => id !== oldHero); }
  }

  // Réorganiser
  if (Array.isArray(indexJson.order)) {
    const newOrder = [stylesId, heroId, marqueeId];
    indexJson.order.forEach(id => { if (![stylesId,heroId,marqueeId,aboutId].includes(id)) newOrder.push(id); });
    newOrder.push(aboutId);
    indexJson.order = newOrder;
  }

  // 9. Écrire !
  console.log('🚀 Envoi vers Shopify...');
  const writeRes = await fetch(`https://${shopUrl}/admin/api/2024-04/themes/${themeId}/assets.json`, {
    method: 'PUT', headers,
    body: JSON.stringify({ asset: { key: 'templates/index.json', value: JSON.stringify(indexJson) } })
  });

  if (writeRes.ok) {
    console.log('');
    console.log('✅✅✅ DESIGN CORRIGÉ APPLIQUÉ AVEC SUCCÈS !');
    console.log(`🏪 Nom: ${branding.storeName}`);
    console.log(`📝 Hero: ${branding.heroTitle}`);
    console.log(`🎨 Style: fond blanc, bouton noir "Catalogue", marquee verte`);
    console.log('');
    console.log('👉 Va sur ton Shopify et fais Ctrl+F5 !');
  } else {
    console.error('❌ Erreur:', await writeRes.text());
  }

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
