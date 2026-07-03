import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import OpenAI from 'openai';

async function getShopifyCredentials(userId) {
  const integration = await prisma.integration.findUnique({
    where: { userId_platform: { userId, platform: "shopify" } }
  });
  if (!integration || integration.status !== 'connected') return null;
  const creds = JSON.parse(integration.keyData);
  const shopUrl = (creds.shopUrl || "").trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const adminToken = creds.accessToken || creds.clientSecret;
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
    const { action } = body;

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

      let products = [];
      try {
        const res = await fetch(`https://${shopUrl}/admin/api/2024-04/products.json?limit=10`, { headers });
        const data = await res.json();
        products = (data.products || []).map(p => p.title);
      } catch (e) { console.error('[Store Design] Products error:', e.message); }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const prompt = `You are an expert Shopify store designer and brand strategist.

The user has a Shopify store:
- Current name: "${shopName}"
- ACTUAL PRODUCTS in the store: ${products.length > 0 ? products.join(', ') : 'No products yet'}
- Niche/style hint: "${niche}"

IMPORTANT: Base your branding on the ACTUAL PRODUCTS listed above. If the products are laser pointers or tech gadgets, the branding must be about that — NOT about animals or pets.

Generate a complete premium brand redesign. Return ONLY valid JSON:
{
  "storeName": "Catchy premium store name (max 25 chars, fits the niche, NOT generic)",
  "announcementText": "Short announcement bar in French (e.g. '🚚 Livraison GRATUITE dès 30€ | ⚡ Expédition 24h')",
  "heroTitle": "Compelling hero headline in French (max 8 words, punchy)",
  "heroSubtitle": "Hero subtitle in French (1 short sentence, max 15 words)",
  "aboutText": "Premium 'About' paragraph in French (2-3 sentences, brand story)",
  "colors": {
    "primary": "#hex (vibrant accent color for buttons and highlights)",
    "secondary": "#hex (complementary accent, subtle)",
    "background": "#hex (ONE single solid dark color. Examples: #0F0F0F, #1A1A2E, #0D1117, #141414. Must be very dark. NO gradients, NO white.)",
    "text": "#hex (MUST be white or very light gray like #FFFFFF or #F0F0F0 to contrast with the dark background)",
    "buttonBg": "#hex (CTA button, should pop against dark bg)",
    "buttonText": "#hex (button text — MUST contrast with buttonBg. Use #FFFFFF for dark buttons, #000000 for light buttons)",
    "announcementBg": "#hex (top bar bg, slightly different from background)",
    "announcementText": "#hex (top bar text, must be readable)"
  },
  "font": "One of: Montserrat, Poppins, Outfit, DM Sans, Plus Jakarta Sans. Best fit for the vibe.",
  "vibe": "One word (e.g. Premium, Futuristic, Cozy, Bold, Minimal)"
}

CRITICAL CONTRAST RULES:
- The background MUST be a single solid very dark color (no gradients)
- ALL text colors must be light (white/light gray) to be readable on dark backgrounds
- Button text MUST be clearly visible on the button background (if button is bright, use dark text; if button is dark, use white text)
- This is a premium dark-mode store. Think Apple.com dark mode or luxury brands.`;

      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4o-mini",
        response_format: { type: "json_object" }
      });

      const branding = JSON.parse(completion.choices[0].message.content);
      console.log('[Store Design] ✅ AI branding generated:', branding.storeName, '| Vibe:', branding.vibe);

      return NextResponse.json({ branding, currentShop: { name: shopName, url: shopUrl, products } });
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
          if (res.status === 403 || res.status === 406 || resBody.includes('access')) {
            results.errors.push('Shopify a bloqué la modification du nom via API (Erreur ' + res.status + '). Tu pourras le changer manuellement dans tes paramètres Shopify.');
          }
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
          const imagePrompt = `A highly professional, premium, and clean hero banner image for an e-commerce store. 
          The store sells these actual products: ${products.length > 0 ? products.join(', ') : (niche || branding.storeName)}. 
          The vibe is ${branding.vibe}. It should look like a modern cinematic product lifestyle photo featuring the products mentioned above without any text. High resolution.`;
          
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
                }

                html, body, .gradient, .color-background-1, .color-background-2,
                .header-wrapper, .header, .footer, .shopify-section,
                #MainContent, .page-container, [id^="shopify-section-"] > * {
                  background-color: ${branding.colors.background} !important;
                  color: ${branding.colors.text} !important;
                }

                /* === FORCE ALL TEXT READABLE === */
                h1, h2, h3, h4, h5, h6, p, span, li, label, td, th, dt, dd,
                .price, [class*="price"], [class*="title"], [class*="product-title"],
                .card__heading, .card__information, .card-information,
                .product-card, [class*="product"] *, [class*="card"] * {
                  color: ${branding.colors.text} !important;
                }

                /* Links slightly brighter */
                a:not([class*="button"]):not(.btn):not(.ai-btn) {
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

            // === SECTION 1: HERO AVEC IMAGE IA ===
            if (uploadedImageKey) {
              const heroHtml = `
                <div style="position: relative; width: 100%; height: 70vh; min-height: 500px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; color: #ffffff; background-image: url('{{ '${uploadedImageKey}' | asset_url }}'); background-size: cover; background-position: center; overflow: hidden;">
                  <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.45);"></div>
                  <div style="position: relative; z-index: 1; padding: 40px 20px; max-width: 800px; animation: fadeInUp 1s ease;">
                    <h1 style="font-size: 3.5rem; font-weight: 800; margin-bottom: 20px; color: #ffffff; text-shadow: 0 4px 15px rgba(0,0,0,0.5); letter-spacing: -1px;">${branding.heroTitle}</h1>
                    <p style="font-size: 1.3rem; margin-bottom: 35px; color: rgba(255,255,255,0.9); text-shadow: 0 2px 8px rgba(0,0,0,0.4); max-width: 600px; margin-left: auto; margin-right: auto;">${branding.heroSubtitle}</p>
                    <a href="/collections/all" class="ai-btn" style="display: inline-block; padding: 16px 40px; background: ${branding.colors.buttonBg}; color: #FFFFFF !important; text-decoration: none; font-weight: bold; border-radius: 50px; font-size: 1.1rem; box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition: transform 0.3s; letter-spacing: 0.5px;">Découvrir la Collection ✨</a>
                  </div>
                </div>
                <style>
                  @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                </style>
              `;
              indexJson.sections[customHeroId] = {
                type: "custom-liquid",
                settings: { custom_liquid: heroHtml }
              };
            }
            
            // === SECTION 2: MARQUEE ANIMÉ AVEC GLOW ===
            const marqueeHtml = `
              <div style="background: ${branding.colors.primary}; padding: 14px 0; overflow: hidden; white-space: nowrap;">
                <div style="display: inline-block; animation: marquee 18s linear infinite; color: #ffffff; font-weight: 700; font-size: 0.95rem; letter-spacing: 2px; text-transform: uppercase;">
                  ✦ ${branding.storeName} ✦ Qualité Premium ✦ Satisfaction Garantie ✦ Livraison Express ✦ Service 24/7 ✦ ${branding.storeName} ✦ Qualité Premium ✦ Satisfaction Garantie ✦ Livraison Express ✦ Service 24/7 ✦ ${branding.storeName} ✦ Qualité Premium ✦ Satisfaction Garantie ✦ Livraison Express ✦ Service 24/7 ✦
                </div>
              </div>
            `;

            // === SECTION 3: À PROPOS (MINIMALISTE) ===
            const aboutHtml = `
              <div style="padding: 80px 20px; text-align: center;">
                <div style="max-width: 700px; margin: 0 auto;">
                  <h2 style="font-size: 2.2rem; margin-bottom: 24px; font-weight: 700; color: ${branding.colors.text}; letter-spacing: -0.5px;">À Propos de ${branding.storeName}</h2>
                  <p style="font-size: 1.1rem; line-height: 1.9; color: ${branding.colors.text}; opacity: 0.8;">${branding.aboutText}</p>
                  <div style="margin-top: 35px;">
                    <a href="/collections/all" class="ai-btn" style="display: inline-block; padding: 14px 35px; background: ${branding.colors.buttonBg}; color: #FFFFFF !important; text-decoration: none; font-weight: bold; border-radius: 50px; font-size: 1rem;">Explorer nos produits →</a>
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

            // Supprimer l'ancien Hero si on a créé le nôtre
            // IMPORTANT: Shopify exige que toute section dans "sections" soit aussi dans "order"
            // Il faut donc supprimer de SECTIONS ET de ORDER
            let originalHeroHidden = false;
            if (uploadedImageKey && Array.isArray(indexJson.order)) {
               const originalHeroId = indexJson.order.find(id => indexJson.sections[id]?.type === 'hero' || indexJson.sections[id]?.type === 'image_banner');
               if (originalHeroId) {
                  delete indexJson.sections[originalHeroId]; // Supprimer de sections aussi !
                  indexJson.order = indexJson.order.filter(id => id !== originalHeroId);
                  originalHeroHidden = true;
               }
            }

            // Réorganiser l'ordre: styles -> hero -> marquee -> products -> about
            if (Array.isArray(indexJson.order)) {
              const newOrder = [customStylesId]; // Styles en premier (invisible)
              if (uploadedImageKey) newOrder.push(customHeroId);
              newOrder.push(customMarqueeId);
              
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
