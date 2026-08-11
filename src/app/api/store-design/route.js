import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function getShopifyCredentials(userId) {
  const integration = await prisma.integration.findUnique({
    where: { userId_platform: { userId, platform: "shopify" } }
  });
  if (!integration || integration.status !== 'connected') return null;
  const creds = JSON.parse(integration.keyData);
  
  // Use either the new OAuth format (domain/token) or legacy format (shopUrl/accessToken)
  const rawShopUrl = creds.domain || creds.shopUrl || "";
  const shopUrl = rawShopUrl.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const adminToken = creds.token || creds.accessToken || creds.clientSecret;
  
  if (!shopUrl || !adminToken) return null;
  return { shopUrl, adminToken };
}

// Helper pour modifier récursivement les templates JSON (ex: index.json, header-group.json)
function updateTemplateBlocks(obj, branding, isAnnouncement = false) {
  if (!obj || typeof obj !== 'object') return;
  
  if (obj.type === 'heading' && obj.settings && typeof obj.settings.heading === 'string') {
    obj.settings.heading = branding.heroTitle;
  }
  // Horizon uses 'text' blocks with type_preset: 'h2' as headings
  if (obj.type === 'text' && obj.settings && typeof obj.settings.text === 'string' && !isAnnouncement) {
    if (obj.settings.type_preset === 'h1' || obj.settings.type_preset === 'h2' || obj.settings.type_preset === 'h3') {
      obj.settings.text = `<p>${branding.heroTitle}</p>`;
    } else if (obj.settings.text.length < 100) {
      obj.settings.text = `<p>${branding.heroSubtitle}</p>`;
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

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, niche, autoTheme } = body;

    const shopCreds = await getShopifyCredentials(session.user.id);
    if (!shopCreds) return NextResponse.json({ error: "Boutique Shopify non connectée ou identifiants incomplets." }, { status: 400 });

    const { shopUrl, adminToken } = shopCreds;
    const headers = { 'X-Shopify-Access-Token': adminToken, 'Content-Type': 'application/json' };

    // ========================
    //  ACTION: GENERATE
    // ========================
    if (action === 'generate') {
      const { niche } = body;
      if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "Clé OpenAI manquante." }, { status: 500 });

      let shopName = 'My Store';
      try {
        const res = await fetch(`https://${shopUrl}/admin/api/2024-04/shop.json`, { headers });
        const data = await res.json();
        shopName = data.shop?.name || shopName;
      } catch (e) { console.error('[Store Design] Shop info error:', e.message); }

      let rawProducts = [];
      let productsList = [];
      try {
        const res = await fetch(`https://${shopUrl}/admin/api/2024-04/products.json?limit=10`, { headers });
        const data = await res.json();
        rawProducts = (data.products || []).map(p => ({
          id: p.id,
          title: p.title,
          image: p.image?.src || null,
          price: p.variants?.[0]?.price || '0.00'
        }));
        productsList = rawProducts.map(p => p.title);
      } catch (e) { console.error('[Store Design] Products error:', e.message); }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const themeRules = autoTheme 
      ? `- You MUST generate a beautiful, premium color palette ("colors" object). \nCRITICAL: ONLY use pale, muted, and pastel colors (e.g. pale sage green, soft beige, dusty rose). ABSOLUTELY NO bright, neon, or flashy colors. The 'primary' color MUST be a soft, pale pastel shade.\n- YOU MUST deduce the overarching niche/theme of the store by analyzing the actual products listed (e.g. if you see toothbrushes, the niche is 'oral hygiene').\n- ALL copywriting (Hero text, About text, etc.) MUST be heavily tailored to this deduced niche.`
      : `- You MUST use the exact colors provided in the JSON template above (#27ae60 etc). Do not change them.`;

    const prompt = `You are an expert Shopify store designer, brand strategist, and elite UI/UX designer.

The user has a Shopify store:
- Current name: "${shopName}"
- ACTUAL PRODUCTS in the store: ${productsList.length > 0 ? productsList.join(', ') : 'No products yet'}
- Niche/style hint: "${niche}"

IMPORTANT: Base your branding on the ACTUAL PRODUCTS listed above.

Generate a complete, HIGH-CONVERTING, PREMIUM brand redesign. 
We want clean, professional, and elegant e-commerce aesthetics. NEVER output dark or neon futuristic "AI" styles. Use clean white or very light backgrounds, highly readable typography.

Return ONLY valid JSON:
{
  "announcementText": "Short announcement bar in French with an emoji (e.g. '✨ Nouvelle Collection | ⚡ Expédition 24h')",
  "heroTitle": "Extremely punchy, modern hero headline in French (max 6 words, Apple-style copywriting)",
  "heroSubtitle": "Hero subtitle in French (1 short sentence, max 12 words, very impactful)",
  "aboutText": "Premium 'About' paragraph in French (2-3 sentences, emotional brand story)",
  "colors": {
    "primary": "#27ae60",
    "secondary": "#f3d0db",
    "background": "#FFFFFF",
    "text": "#111111",
    "buttonBg": "#000000",
    "buttonText": "#FFFFFF",
    "announcementBg": "#76a374",
    "announcementText": "#FFFFFF"
  },
  "font": "Inter",
  "vibe": "Clean & Trustworthy"
}

CRITICAL RULES:
- The design must scream "Premium D2C E-commerce Brand".
- DO NOT generate or change the store name. The store name is already "${shopName}".
${themeRules}
- The background MUST be white or extremely light.
- All text must be dark and highly readable.
- IMPORTANT: Be extremely creative with the copy (heroTitle, subtitle, etc). Here is a unique seed to force variation in copy: ${Math.random()}`;

      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4o",
        temperature: 0.9,
        response_format: { type: "json_object" }
      });

      const branding = JSON.parse(completion.choices[0].message.content);
      branding.storeName = shopName; // Override with actual store name
      console.log('[Store Design] ✅ AI branding generated:', branding.storeName, '| Vibe:', branding.vibe);

      return NextResponse.json({
        branding: branding,
        currentShop: { url: shopUrl, name: shopName, products: rawProducts }
      });
    }

    // ========================
    //  ACTION: APPLY
    // ========================
    if (action === 'apply') {
      const { branding, niche } = body;
      if (!branding) return NextResponse.json({ error: "Branding data manquant." }, { status: 400 });

      const results = { shopName: false, theme: false, templates: false, image: false, errors: [] };
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // 0. Fetch products for DALL-E context
      let products = [];
      try {
        const prodRes = await fetch(`https://${shopUrl}/admin/api/2024-04/products.json?limit=10`, { headers });
        const prodData = await prodRes.json();
        products = (prodData.products || []).map(p => p.title);
      } catch (e) { console.error('[Store Design] Products error during apply:', e.message); }

      // 1. Update shop name
      try {
        const res = await fetch(`https://${shopUrl}/admin/api/2024-04/shop.json`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ shop: { name: branding.storeName } })
        });
        const resBody = await res.text();
        results.shopName = res.ok;
        if (!res.ok) {
          console.error('[Store Design] Shop name update failed:', res.status);
          // We intentionally do not push this to results.errors because it's a very common 
          // limitation on basic Shopify plans and confuses the user into thinking the design failed.
        }
      } catch (e) { 
        console.error('[Store Design] Shop name error:', e.message); 
      }

      // 2. Get the active theme
      let themeId = null;
      try {
        const res = await fetch(`https://${shopUrl}/admin/api/2024-04/themes.json`, { headers });
        const resText = await res.text();
        
        if (!res.ok) {
          if (res.status === 403 || res.status === 401) {
            results.errors.push("⚠️ Permission 'read_themes' manquante sur Shopify.");
          }
        } else {
          const data = JSON.parse(resText);
          const activeTheme = (data.themes || []).find(t => t.role === 'main');
          themeId = activeTheme?.id;
          console.log('[Store Design] Active theme:', activeTheme?.name, '| ID:', themeId);
        }
      } catch (e) { 
        console.error('[Store Design] Themes error:', e.message);
      }

      if (themeId) {
        // 3. GENERATE AND UPLOAD HERO IMAGE
        let uploadedImageKey = null;
        try {
          console.log('[Store Design] Generating Hero Image via DALL-E...');
          const imagePrompt = `An ultra-premium, breathtaking hero banner image for a luxury or futuristic e-commerce store. 
          Products: ${products.length > 0 ? products.join(', ') : (niche || branding.storeName)}. 
          Vibe: ${branding.vibe}. 
          Style: Cinematic lighting, hyper-realistic, 8k octane render, extremely sleek, glossy, modern aesthetic. Dark mood with striking neon or elegant rim lighting. NO TEXT anywhere in the image. High-end editorial product photography style.`;
          
          const imageRes = await openai.images.generate({
            model: "dall-e-3",
            prompt: imagePrompt,
            n: 1,
            size: "1024x1024"
          });
          
          let base64Image = null;
          if (imageRes.data && imageRes.data[0]) {
            if (imageRes.data[0].b64_json) {
              base64Image = imageRes.data[0].b64_json;
            } else if (imageRes.data[0].url) {
              const dlRes = await fetch(imageRes.data[0].url);
              const arrayBuffer = await dlRes.arrayBuffer();
              base64Image = Buffer.from(arrayBuffer).toString('base64');
            }
          }

          if (base64Image) {
            console.log('[Store Design] Uploading image to Shopify Theme Assets...');
            const assetPayload = {
              asset: {
                key: 'assets/hero-ai.jpg',
                attachment: base64Image
              }
            };
            const uploadRes = await fetch(`https://${shopUrl}/admin/api/2024-04/themes/${themeId}/assets.json`, {
              method: 'PUT',
              headers,
              body: JSON.stringify(assetPayload)
            });
            if (uploadRes.ok) {
              uploadedImageKey = 'hero-ai.jpg';
              results.image = true;
              console.log('[Store Design] Hero image successfully uploaded to Shopify!');
            } else {
              console.error('[Store Design] Image upload failed:', await uploadRes.text());
            }
          }
        } catch (e) {
          console.error('[Store Design] Image generation/upload error:', e.message);
        }

        // 4. Update settings_data.json
        try {
          const res = await fetch(`https://${shopUrl}/admin/api/2024-04/themes/${themeId}/assets.json?asset[key]=config/settings_data.json`, { headers });
          const data = await res.json();
          
          if (data.asset && data.asset.value) {
            const settings = JSON.parse(data.asset.value);
            const currentPreset = settings.current || {};

            // Compatibilité DAWN v12+ (color_schemes)
            if (currentPreset.color_schemes) {
              Object.keys(currentPreset.color_schemes).forEach(scheme => {
                if (currentPreset.color_schemes[scheme].settings) {
                  currentPreset.color_schemes[scheme].settings.background = branding.colors.background;
                  currentPreset.color_schemes[scheme].settings.text = branding.colors.text;
                } else {
                  currentPreset.color_schemes[scheme].background = branding.colors.background;
                  currentPreset.color_schemes[scheme].text = branding.colors.text;
                }
              });
            }

            // Compatibilité DAWN ancienne version
            if (currentPreset.settings && currentPreset.settings.colors_accent_1 !== undefined) {
              currentPreset.settings.colors_solid_button_labels = branding.colors.buttonText;
              currentPreset.settings.colors_accent_1 = branding.colors.primary;
              currentPreset.settings.colors_accent_2 = branding.colors.secondary;
              currentPreset.settings.colors_text = branding.colors.text;
              currentPreset.settings.colors_background_1 = branding.colors.background;
              currentPreset.settings.colors_background_2 = branding.colors.background;
              currentPreset.settings.type_header_font = `${branding.font}_n7`;
              currentPreset.settings.type_body_font = `${branding.font}_n4`;
            }

            // Compatibilité HORIZON / MODERN THEMES
            if (currentPreset.page_background_color !== undefined || currentPreset.palette_primary_button_background !== undefined) {
              currentPreset.page_background_color = branding.colors.background;
              currentPreset.palette_primary_button_background = branding.colors.primary;
              currentPreset.palette_primary_button_text = branding.colors.buttonText;
              currentPreset.type_body_font = `${branding.font}_n4`;
              currentPreset.type_heading_font = `${branding.font}_n7`;
            }

            // Si le thème utilise color_palette direct
            if (currentPreset.color_palette) {
              currentPreset.color_palette.background = branding.colors.background;
              currentPreset.color_palette.text = branding.colors.text;
            }

            settings.current = currentPreset;

            const writeRes = await fetch(`https://${shopUrl}/admin/api/2024-04/themes/${themeId}/assets.json`, {
              method: 'PUT',
              headers,
              body: JSON.stringify({ asset: { key: 'config/settings_data.json', value: JSON.stringify(settings) } })
            });
            results.theme = writeRes.ok;
          }
        } catch (e) {
          console.error('[Store Design] settings_data.json update error:', e.message);
        }

        // 5. Update templates/index.json (Hero, Textes, Injection de sections)
        try {
          const res = await fetch(`https://${shopUrl}/admin/api/2024-04/themes/${themeId}/assets.json?asset[key]=templates/index.json`, { headers });
          const data = await res.json();
          if (data.asset && data.asset.value) {
            const indexJson = JSON.parse(data.asset.value);
            updateTemplateBlocks(indexJson, branding);
            
            // --- NETTOYAGE DES ANCIENNES SECTIONS IA ---
            const aiSectionKeys = Object.keys(indexJson.sections).filter(k => k.startsWith('ai_'));
            aiSectionKeys.forEach(k => delete indexJson.sections[k]);
            if (Array.isArray(indexJson.order)) {
              indexJson.order = indexJson.order.filter(id => !id.startsWith('ai_'));
            }

            // --- INJECTION DES NOUVELLES SECTIONS VIA CUSTOM LIQUID ---
            const customStylesId = 'ai_styles_' + Math.random().toString(36).substr(2, 9);
            const customHeroId = 'ai_hero_' + Math.random().toString(36).substr(2, 9);
            const customMarqueeId = 'ai_marquee_' + Math.random().toString(36).substr(2, 9);
            const customAboutId = 'ai_about_' + Math.random().toString(36).substr(2, 9);
            
            // === SECTION 0: GLOBAL CSS — CLEAN DARK MODE ===
            const globalStylesHtml = `
              <style>
                /* === CLEAN SOLID DARK BACKGROUND === */
                :root {
                  --color-background: ${branding.colors.background} !important;
                  --color-base-background-1: ${branding.colors.background} !important;
                  --color-base-background-2: ${branding.colors.background} !important;
                  --color-foreground: ${branding.colors.text} !important;
                  --color-base-text: ${branding.colors.text} !important;
                  --color-base-solid-button-labels: ${branding.colors.text} !important;
                }

                /* FORCE HEADER SECTION TO DARK MODE */
                #shopify-section-header, #shopify-section-announcement-bar,
                .header-wrapper, .header, sticky-header,
                .header__inline-menu, .header__heading, .header__icons,
                .shopify-section-group-header-group, 
                .shopify-section-group-footer-group {
                  background-color: ${branding.colors.background} !important;
                  background: ${branding.colors.background} !important;
                  color: ${branding.colors.text} !important;
                  border: none !important;
                  box-shadow: none !important;
                }

                /* === SUBTLE WALLPAPER PATTERN (WhatsApp Style) === */
                html, body {
                  background-color: ${branding.colors.background} !important;
                  background-image: url("data:image/svg+xml,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23000000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.12'%3E%3Cpath d='M40 40l10 10m0-10l-10 10M120 80a15 15 0 1 0 0-30 15 15 0 0 0 0 30zM220 50h20v20h-20zM80 180c10-20 30-20 40 0M250 150l-15 25h30zM50 250a10 10 0 1 1-20 0 10 10 0 1 1 20 0M180 240l10-10 10 10-10 10zM150 130c0 10-10 10-10 20M20 120q15-15 30 0M260 260c-10-10-10-20 0-30M130 280h20M90 100l5-5'/%3E%3C/g%3E%3C/svg%3E") !important;
                  background-repeat: repeat !important;
                  color: ${branding.colors.text} !important;
                }

                .gradient, .color-background-1, .color-background-2,
                .footer, .shopify-section, #MainContent, .page-container, 
                [id^="shopify-section-"] > * {
                  background-color: transparent !important;
                  background: transparent !important;
                  color: ${branding.colors.text} !important;
                }

                /* Keep cards solid so products stand out against the wallpaper */
                .product-card, .card-wrapper, .card, .grid__item {
                  background-color: ${branding.colors.background} !important;
                  border-radius: 12px;
                  border: 1px solid rgba(0,0,0,0.05);
                }

                /* === FORCE ALL TEXT READABLE === */
                h1, h2, h3, h4, h5, h6, p, span, li, label, td, th, dt, dd,
                .price, [class*="price"], [class*="title"], [class*="product-title"],
                .card__heading, .card__information, .card-information,
                .product-card, [class*="product"] *, [class*="card"] *,
                .header__menu-item, .header__heading-link, .header__icon {
                  color: ${branding.colors.text} !important;
                }

                /* Fix Header Icons (Cart, Search, Menu) */
                .header__icon svg, .header__heading-link svg, .icon, 
                .icon-cart, .icon-search, .icon-account {
                  fill: ${branding.colors.text} !important;
                  color: ${branding.colors.text} !important;
                }

                /* Links slightly brighter */
                a:not([class*="button"]):not(.btn):not(.ai-btn):not(.header__menu-item):not(.header__icon) {
                  color: ${branding.colors.primary} !important;
                }

                /* === SUBTLE HOVER ON PRODUCTS === */
                .product-card, [class*="card"] {
                  transition: transform 0.3s ease, box-shadow 0.3s ease !important;
                }
                .product-card:hover, [class*="card"]:hover {
                  transform: translateY(-4px) !important;
                  box-shadow: 0 8px 30px rgba(0,0,0,0.3) !important;
                }

                /* === SUBTLE BUTTON HOVER === */
                a[href*="collection"], .btn, button[type="submit"], [class*="button"] {
                  transition: transform 0.2s ease, opacity 0.2s ease !important;
                }
                a[href*="collection"]:hover, .btn:hover, button[type="submit"]:hover {
                  transform: scale(1.03) !important;
                  opacity: 0.9 !important;
                }

                /* === MARQUEE ANIMATION === */
                @keyframes marquee {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }

                /* === FADE IN ON SCROLL === */
                .ai-fade-in {
                  opacity: 0;
                  transform: translateY(20px);
                  transition: opacity 0.6s ease, transform 0.6s ease;
                }
                .ai-fade-in.ai-visible {
                  opacity: 1;
                  transform: translateY(0);
                }
              </style>

              <script>
                document.addEventListener('DOMContentLoaded', function() {
                  var targets = document.querySelectorAll('section, [class*="product-list"], [class*="collection"]');
                  targets.forEach(function(el) { el.classList.add('ai-fade-in'); });
                  var observer = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                      if (entry.isIntersecting) entry.target.classList.add('ai-visible');
                    });
                  }, { threshold: 0.1 });
                  document.querySelectorAll('.ai-fade-in').forEach(function(el) { observer.observe(el); });
                });
              </script>
            `;
            indexJson.sections[customStylesId] = {
              type: "custom-liquid",
              settings: { custom_liquid: globalStylesHtml }
            };

            // === SECTION 1: HERO (TOUJOURS injecté — avec image ou gradient) ===
            const heroBackground = uploadedImageKey
              ? `background-image: url('{{ '${uploadedImageKey}' | asset_url }}'); background-size: cover; background-position: center;`
              : `background: ${branding.colors.background};`;
            
            const heroOverlay = uploadedImageKey
              ? `<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.2);"></div>`
              : '';

            const heroHtml = `
              <div style="position: relative; width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; color: ${branding.colors.text}; ${heroBackground} overflow: hidden;">
                ${heroOverlay}
                <div style="position: relative; z-index: 1; padding: 60px 24px; max-width: 800px; animation: fadeInUp 1s ease;">
                  <div style="display: inline-block; padding: 4px 12px; border-radius: 4px; border: 1px solid ${branding.colors.primary}50; color: ${branding.colors.primary}; font-size: 0.75rem; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 24px;">${branding.vibe || 'PREMIUM'}</div>
                  <h1 style="font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; margin: 0 0 16px; color: ${branding.colors.text}; letter-spacing: -1px; line-height: 1.15;">${branding.heroTitle}</h1>
                  <p style="font-size: 1.1rem; margin: 0 0 30px; color: ${branding.colors.text}; opacity: 0.8; max-width: 550px; margin-left: auto; margin-right: auto; line-height: 1.6;">${branding.heroSubtitle}</p>
                  <a href="/collections/all" class="ai-btn" style="display: inline-block; padding: 14px 40px; background: ${branding.colors.buttonBg}; color: ${branding.colors.buttonText} !important; text-decoration: none; font-weight: 700; border-radius: 4px; font-size: 1rem; transition: opacity 0.3s;">Catalogue</a>
                </div>
              </div>
              <style>
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
              </style>
            `;
            indexJson.sections[customHeroId] = {
              type: "custom-liquid",
              settings: { custom_liquid: heroHtml }
            };
            
            // === SECTION 2: MARQUEE SUBTIL (bordure, pas de fond criard) ===
            const marqueeHtml = `
              <div style="background: ${branding.colors.announcementBg}; color: ${branding.colors.announcementText}; padding: 12px 0; overflow: hidden; white-space: nowrap; width: 100vw; position: relative; left: 50%; right: 50%; margin-left: -50vw; margin-right: -50vw;">
                <div style="display: inline-block; animation: marquee 20s linear infinite; font-weight: bold; font-size: 0.85rem; letter-spacing: 2px; text-transform: uppercase;">
                  ✦ ${branding.storeName} ✦ Qualité Premium ✦ Satisfaction Garantie ✦ Livraison Express ✦ Service 24/7 ✦ ${branding.storeName} ✦ Qualité Premium ✦ Satisfaction Garantie ✦ Livraison Express ✦ Service 24/7 ✦ ${branding.storeName} ✦ Qualité Premium ✦ Satisfaction Garantie ✦ Livraison Express ✦ Service 24/7 ✦
                </div>
              </div>
            `;

            // === SECTION 3: À PROPOS (MINIMALISTE) ===
            const aboutHtml = `
              <div style="padding: 60px 20px; text-align: center; background: ${branding.colors.background};">
                <div style="max-width: 700px; margin: 0 auto;">
                  <h2 style="font-size: 2rem; margin-bottom: 24px; font-weight: 800; color: ${branding.colors.text}; letter-spacing: -0.5px;">À Propos de ${branding.storeName}</h2>
                  <p style="font-size: 1.1rem; line-height: 1.7; color: ${branding.colors.text}; opacity: 0.8;">${branding.aboutText}</p>
                  <div style="margin-top: 30px;">
                    <a href="/collections/all" class="ai-btn" style="display: inline-block; padding: 12px 30px; background: ${branding.colors.buttonBg}; color: ${branding.colors.buttonText} !important; text-decoration: none; font-weight: bold; border-radius: 4px; font-size: 1rem;">Explorer nos produits</a>
                  </div>
                </div>
              </div>
            `;

            indexJson.sections[customMarqueeId] = {
              type: "custom-liquid",
              settings: { custom_liquid: marqueeHtml }
            };
            
            indexJson.sections[customAboutId] = {
              type: "custom-liquid",
              settings: { custom_liquid: aboutHtml }
            };

            // Supprimer l'ancien Hero (image_banner, hero, slideshow, etc.)
            if (Array.isArray(indexJson.order)) {
               const heroTypes = ['hero', 'image_banner', 'slideshow', 'image-banner', 'banner'];
               const originalHeroId = indexJson.order.find(id => {
                 const section = indexJson.sections[id];
                 return section && heroTypes.includes(section.type);
               });
               if (originalHeroId) {
                  delete indexJson.sections[originalHeroId];
                  indexJson.order = indexJson.order.filter(id => id !== originalHeroId);
               }
            }

            // Réorganiser l'ordre: styles -> hero -> marquee -> products -> about
            if (Array.isArray(indexJson.order)) {
              const newOrder = [customStylesId, customHeroId, customMarqueeId];
              
              for (const id of indexJson.order) {
                if (id === customStylesId || id === customHeroId || id === customMarqueeId || id === customAboutId) continue;
                newOrder.push(id);
              }

              newOrder.push(customAboutId);
              indexJson.order = newOrder;
            }

            await fetch(`https://${shopUrl}/admin/api/2024-04/themes/${themeId}/assets.json`, {
              method: 'PUT',
              headers,
              body: JSON.stringify({ asset: { key: 'templates/index.json', value: JSON.stringify(indexJson) } })
            });
            results.templates = true;
          }
        } catch (e) {
          console.error('[Store Design] index.json update error:', e.message);
        }

        // 6. Update sections/header-group.json (Announcement Bar)
        try {
          const res = await fetch(`https://${shopUrl}/admin/api/2024-04/themes/${themeId}/assets.json?asset[key]=sections/header-group.json`, { headers });
          const data = await res.json();
          if (data.asset && data.asset.value) {
            const headerJson = JSON.parse(data.asset.value);
            updateTemplateBlocks(headerJson, branding, true);
            await fetch(`https://${shopUrl}/admin/api/2024-04/themes/${themeId}/assets.json`, {
              method: 'PUT',
              headers,
              body: JSON.stringify({ asset: { key: 'sections/header-group.json', value: JSON.stringify(headerJson) } })
            });
          }
        } catch (e) {
          console.error('[Store Design] header-group.json update error:', e.message);
        }
      }

      return NextResponse.json({ 
        success: true, 
        results,
        message: results.theme 
          ? "Design extrême appliqué avec succès ! L'IA a repensé toute ta boutique." 
          : "Erreur partielle. Vérifie les permissions Shopify."
      });
    }

    return NextResponse.json({ error: "Action invalide." }, { status: 400 });

  } catch (error) {
    console.error("Store Design Error:", error);
    return NextResponse.json({ error: "Erreur interne: " + error.message }, { status: 500 });
  }
}
