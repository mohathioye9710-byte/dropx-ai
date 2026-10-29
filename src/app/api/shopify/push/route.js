import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { normalizeLandingPage } from '@/lib/landing-page';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Vérifier si l'utilisateur a configuré Shopify
    const integration = await prisma.integration.findUnique({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: "shopify"
        }
      }
    });

    if (!integration || integration.status !== 'connected') {
      return NextResponse.json({ error: "Boutique Shopify non connectée. Veuillez configurer l'intégration." }, { status: 400 });
    }

    const creds = JSON.parse(integration.keyData);
    // Support both old field names (shopUrl/accessToken/clientSecret) AND new field names (domain/token)
    let shopUrl = creds.shopUrl || creds.domain || "";
    const adminToken = creds.accessToken || creds.clientSecret || creds.token || "";

    if (!shopUrl || !adminToken) {
      return NextResponse.json({ error: "Identifiants Shopify incomplets. Veuillez vérifier vos paramètres." }, { status: 400 });
    }
    
    // Clean shopUrl format (remove https://, trailing slashes, and spaces)
    shopUrl = shopUrl.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Récupérer le produit à envoyer
    const body = await req.json();
    const { product, currency, themeColor: requestedThemeColor, buttonColor: requestedButtonColor } = body;
    const isHexColor = (value) => /^#[0-9a-f]{6}$/i.test(value || '');
    const themeColor = isHexColor(requestedThemeColor) ? requestedThemeColor : '#000000';
    const buttonColor = isHexColor(requestedButtonColor) ? requestedButtonColor : '#10b981';
    const themeForeground = themeColor.toLowerCase() === '#ffffff' ? '#111111' : '#ffffff';
    const buttonForeground = buttonColor.toLowerCase() === '#000000' ? '#ffffff' : '#111111';

    // Smart Bundles Variants
    const basePrice = parseFloat(product.price) || 0;
    const baseComparePrice = parseFloat(product.compareAtPrice) || 0;

    const safeCompare = baseComparePrice > basePrice ? baseComparePrice : basePrice * 2.8;

    const roundPrice = (p) => {
      if (currency === 'XOF') return Math.ceil(p / 100) * 100;
      return Math.floor(p) + 0.99;
    };

    let shopifyOptions = [{ name: "Offres Limitées" }];
    const bundleOffers = [
      { title: "1 Unité", p: basePrice, cp: safeCompare },
      { title: "2 Achetés (-15%)", p: roundPrice(basePrice * 2 * 0.85), cp: roundPrice(safeCompare * 2) },
      { title: "3 Achetés (-25%)", p: roundPrice(basePrice * 3 * 0.75), cp: roundPrice(safeCompare * 3) }
    ];

    let hasExtraOptions = product.options && product.options.length > 0;
    
    if (hasExtraOptions) {
      product.options.slice(0, 2).forEach((opt) => {
         shopifyOptions.push({ name: opt.name });
      });
    }

    let variants = [];
    
    bundleOffers.forEach(offer => {
      if (!hasExtraOptions) {
         variants.push({
           option1: offer.title,
           price: offer.p.toString(),
           compare_at_price: offer.cp.toString(),
           inventory_management: null,
         });
      } else {
         const opt1 = product.options[0];
         const opt2 = product.options[1];
         
         opt1.values.forEach(v1 => {
           if (opt2 && opt2.values.length > 0) {
             opt2.values.forEach(v2 => {
               variants.push({
                 option1: offer.title,
                 option2: v1,
                 option3: v2,
                 price: offer.p.toString(),
                 compare_at_price: offer.cp.toString(),
                 inventory_management: null,
               });
             });
           } else {
             variants.push({
               option1: offer.title,
               option2: v1,
               price: offer.p.toString(),
               compare_at_price: offer.cp.toString(),
               inventory_management: null,
             });
           }
         });
      }
    });

    // HTML Injection - Full Landing Page (DropX Premium Style)
    const formattedDesc = (product.description || '').replace(/\n/g, '<br/>');
    const lp = normalizeLandingPage(product.landingPage, product.title);
    // Legacy support
    const features = lp.features || [];
    const howToUse = lp.howToUse || [];
    // New 5-Section Architecture
    const s1 = lp.section1_benefits;
    const s2 = lp.section2_features;
    const s3 = lp.section3_steps;
    const s4 = lp.section4_cta;
    const s5 = lp.section5_power;
    const faq = lp.faq || [];
    const reviews = lp.reviews || [];
    const images = product.images || [];

    const imgTag = (idx) => images[idx] ? `<img src="${images[idx]}" alt="Product" style="width:100%; border-radius:8px; object-fit:cover; display:block;"/>` : '';

    let contentHtml = '';

    if (s1 || s2 || s3 || s4 || s5) {
      // --- SECTION 1: 3 Columns Benefits ---
      if (s1) {
        contentHtml += `
        <div style="padding: 40px 20px; max-width: 1200px; margin: 0 auto;">
          <h2 style="text-align:center; font-size: 28px; font-weight: 800; margin-bottom: 30px; color: #111;">${s1.sectionTitle}</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center;">
            ${s1.items.map((item, i) => `
              <div style="flex: 1 1 30%; min-width: 250px; background: #fff; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                ${imgTag(i + 1)}
                <div style="padding: 20px;">
                  <h3 style="font-size: 16px; font-weight: 700; margin: 0 0 10px; color: #111;">${item.title}</h3>
                  <p style="font-size: 14px; color: #555; line-height: 1.5; margin: 0;">${item.text}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>`;
      }
      // --- SECTION 2: Left Grid Features, Right Image ---
      if (s2) {
        contentHtml += `
        <div style="background: #eaf8f9; padding: 50px 20px;">
          <div style="max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; gap: 40px;">
            <div style="flex: 1 1 45%; min-width: 300px;">
              <div style="display: flex; flex-wrap: wrap; gap: 30px;">
                ${s2.items.map(item => `
                  <div style="flex: 1 1 45%; min-width: 200px;">
                    <div style="font-size: 28px; color: #1e3a8a; margin-bottom: 12px;">${item.icon}</div>
                    <h3 style="font-size: 16px; font-weight: 700; margin: 0 0 8px; color: #111;">${item.title}</h3>
                    <p style="font-size: 14px; color: #555; line-height: 1.5; margin: 0;">${item.text}</p>
                  </div>
                `).join('')}
              </div>
            </div>
            <div style="flex: 1 1 45%; min-width: 300px;">
               ${imgTag(4)}
            </div>
          </div>
        </div>`;
      }
      // --- SECTION 3: 3 Columns Steps with Numbers ---
      if (s3) {
        contentHtml += `
        <div style="padding: 40px 20px; max-width: 1200px; margin: 0 auto;">
          <h2 style="text-align:center; font-size: 28px; font-weight: 800; margin-bottom: 30px; color: #111;">${s3.sectionTitle}</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center;">
            ${s3.items.map((item, i) => `
              <div style="flex: 1 1 30%; min-width: 250px; background: #fff; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
                <div style="position: relative;">
                  ${imgTag(i + 5)}
                  <div style="position: absolute; top: 15px; right: 15px; background: #0ea5e9; color: #fff; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: bold; font-size: 18px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">${i+1}</div>
                </div>
                <div style="padding: 20px;">
                  <h3 style="font-size: 16px; font-weight: 700; margin: 0 0 10px; color: #111;">${item.title}</h3>
                  <p style="font-size: 14px; color: #555; line-height: 1.5; margin: 0;">${item.text}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>`;
      }
      // --- SECTION 4: Left Image, Right Big CTA ---
      if (s4) {
        contentHtml += `
        <div style="background: #eaf8f9; padding: 50px 20px;">
          <div style="max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; gap: 40px;">
            <div style="flex: 1 1 45%; min-width: 300px;">
               ${imgTag(8)}
            </div>
            <div style="flex: 1 1 45%; min-width: 300px;">
              <h2 style="font-size: 32px; font-weight: 800; color: #111; margin: 0 0 20px; line-height: 1.2;">${s4.title}</h2>
              <p style="font-size: 16px; color: #555; line-height: 1.6; margin: 0 0 30px;">${s4.text}</p>
              <a href="#buy" style="display: inline-block; background: #1d4ed8; color: #fff; text-decoration: none; padding: 16px 32px; font-weight: 700; font-size: 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(29,78,216,0.3);">${s4.buttonText}</a>
            </div>
          </div>
        </div>`;
      }
      // --- SECTION 5: Left Spec List, Right Image ---
      if (s5) {
        contentHtml += `
        <div style="padding: 50px 20px; max-width: 1200px; margin: 0 auto;">
          <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 40px;">
            <div style="flex: 1 1 45%; min-width: 300px;">
              <h2 style="font-size: 28px; font-weight: 800; color: #111; margin: 0 0 30px;">${s5.sectionTitle}</h2>
              <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 30px;">
                ${s5.items.map(item => `
                  <div style="display: flex; gap: 16px; align-items: flex-start; padding: 16px; border: 1px solid #eaeaea; border-radius: 8px; background: #fafafa;">
                    <div style="font-size: 24px; color: #1d4ed8; min-width: 30px;">${item.icon}</div>
                    <div>
                      <h3 style="font-size: 15px; font-weight: 700; margin: 0 0 6px; color: #111;">${item.title}</h3>
                      <p style="font-size: 13px; color: #555; line-height: 1.5; margin: 0;">${item.text}</p>
                    </div>
                  </div>
                `).join('')}
              </div>
              <a href="#buy" style="display: block; text-align: center; background: #1d4ed8; color: #fff; text-decoration: none; padding: 16px 32px; font-weight: 700; font-size: 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(29,78,216,0.3);">${s5.buttonText}</a>
              <p style="text-align: center; font-size: 12px; color: #666; margin-top: 10px; font-weight: 600;">⭐ ${s5.ratingText}</p>
            </div>
            <div style="flex: 1 1 45%; min-width: 300px;">
               ${imgTag(9)}
            </div>
          </div>
        </div>`;
      }
    } else {
      // --- LEGACY FALLBACK ---
      contentHtml += features.length > 0 ? `
        <div style="background:#fdf2f8;padding:40px 20px;margin:30px -20px;">
          <div style="max-width:600px;margin:0 auto;">
            <div style="display:flex;flex-wrap:wrap;gap:20px;">
              ${features.map(f => `
                <div style="flex:1 1 45%;min-width:200px;display:flex;gap:12px;align-items:flex-start;">
                  <span style="font-size:28px;">${f.icon || '✨'}</span>
                  <div>
                    <h4 style="margin:0 0 4px;font-size:15px;font-weight:700;color:#111;">${f.title}</h4>
                    <p style="margin:0;font-size:13px;color:#555;line-height:1.5;">${f.text}</p>
                  </div>
                </div>
              `).join('')}
            </div>
            ${images[1] ? `<div style="text-align:center;margin-top:30px;"><img src="${images[1]}" alt="Product" style="max-width:100%;border-radius:12px;"/></div>` : ''}
          </div>
        </div>
      ` : '';
      contentHtml += howToUse.length > 0 ? `
        <div style="padding:40px 0;text-align:center;">
          <h2 style="font-size:22px;font-weight:800;color:#111;margin-bottom:30px;">Comment l'utiliser ?</h2>
          <div style="display:flex;flex-wrap:wrap;gap:20px;justify-content:center;">
            ${howToUse.map((h, i) => `
              <div style="flex:1 1 30%;min-width:160px;max-width:200px;text-align:center;">
                ${images[i+2] ? `<img src="${images[i+2]}" alt="Step ${h.step}" style="width:100%;border-radius:12px;margin-bottom:12px;"/>` : `<div style="width:60px;height:60px;background:#fce7f3;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:24px;font-weight:900;color:#c85a7c;">${h.step}</div>`}
                <h4 style="margin:0 0 6px;font-size:14px;font-weight:700;color:#111;">${h.title}</h4>
                <p style="margin:0;font-size:12px;color:#666;line-height:1.5;">${h.text}</p>
              </div>
            `).join('')}
          </div>
        </div>
      ` : '';
    }

    // Use the same five-section composition and colour system as the local preview.
    contentHtml = `
      <div style="padding: 60px 20px; background: #fdf2f8; text-align: center;">
        <div style="max-width: 1200px; margin: 0 auto;">
          <h2 style="font-size: 32px; font-weight: 800; color: #c85a7c; margin: 0 0 40px;">${s1.sectionTitle}</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 30px; justify-content: center;">
            ${s1.items.map(item => `
              <div style="flex: 1 1 30%; min-width: 250px; background: #fff; padding: 30px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <h3 style="font-size: 18px; font-weight: 700; color: #111; margin: 0 0 12px;">${item.title}</h3>
                <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0;">${item.text}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div style="padding: 60px 20px; background: #fff;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; gap: 40px;">
          <div style="flex: 1 1 45%; min-width: 300px;">
            ${images[1] ? `<img src="${images[1]}" alt="Produit" style="width: 100%; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); display: block;"/>` : ''}
          </div>
          <div style="flex: 1 1 45%; min-width: 300px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px;">
            ${s2.items.map(item => `
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: #fce7f3; display: flex; align-items: center; justify-content: center; font-size: 24px;">${item.icon || '✓'}</div>
                <h3 style="font-size: 16px; font-weight: 700; color: #111; margin: 0;">${item.title}</h3>
                <p style="font-size: 13px; color: #666; line-height: 1.5; margin: 0;">${item.text}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div style="padding: 60px 20px; background: #f9f9f9; text-align: center;">
        <div style="max-width: 1200px; margin: 0 auto;">
          <h2 style="font-size: 28px; font-weight: 800; color: #111; margin: 0 0 40px;">${s3.sectionTitle}</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 30px; justify-content: center;">
            ${s3.items.map((item, index) => `
              <div style="flex: 1 1 30%; min-width: 250px;">
                <div style="width: 100%; aspect-ratio: 1 / 1; background: #fff; border-radius: 16px; overflow: hidden; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; border: 1px solid #eaeaea;">
                  ${images[index + 2] ? `<img src="${images[index + 2]}" alt="Étape ${index + 1}" style="width: 100%; height: 100%; object-fit: contain;"/>` : `<span style="font-size: 48px; font-weight: 900; color: #fce7f3;">${index + 1}</span>`}
                </div>
                <h3 style="font-size: 18px; font-weight: 700; color: #111; margin: 0 0 8px;">${item.title}</h3>
                <p style="font-size: 14px; color: #555; line-height: 1.5; margin: 0;">${item.text}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div style="padding: 60px 20px; background: #111; color: #fff; text-align: center;">
        <div style="max-width: 800px; margin: 0 auto;">
          <h2 style="font-size: 36px; font-weight: 900; margin: 0 0 16px; line-height: 1.2;">${s4.title}</h2>
          <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin: 0 0 30px;">${s4.text}</p>
          <a href="#dropx-form-placeholder" style="display: inline-block; background: ${buttonColor}; color: ${buttonForeground}; text-decoration: none; padding: 16px 32px; font-weight: 700; font-size: 16px; border-radius: 8px;">${s4.buttonText}</a>
        </div>
      </div>

      <div style="padding: 60px 20px; background: #fff;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; gap: 40px;">
          <div style="flex: 1 1 45%; min-width: 300px;">
            <h2 style="font-size: 28px; font-weight: 800; color: #111; margin: 0 0 30px;">${s5.sectionTitle}</h2>
            <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 30px;">
              ${s5.items.map(item => `
                <div style="display: flex; gap: 16px; align-items: flex-start; padding: 16px; border: 1px solid #eaeaea; border-radius: 8px; background: #fafafa;">
                  <div style="font-size: 24px; min-width: 30px;">${item.icon || '✓'}</div>
                  <div><h3 style="font-size: 15px; font-weight: 700; margin: 0 0 6px; color: #111;">${item.title}</h3><p style="font-size: 13px; color: #555; line-height: 1.5; margin: 0;">${item.text}</p></div>
                </div>
              `).join('')}
            </div>
            <a href="#dropx-form-placeholder" style="display: block; text-align: center; background: ${buttonColor}; color: ${buttonForeground}; text-decoration: none; padding: 16px 32px; font-weight: 700; font-size: 16px; border-radius: 8px;">${s5.buttonText}</a>
            <p style="text-align: center; font-size: 12px; color: #666; margin: 10px 0 0; font-weight: 600;">⭐ ${s5.ratingText}</p>
          </div>
          <div style="flex: 1 1 45%; min-width: 300px;">
            ${images[0] ? `<img src="${images[0]}" alt="Produit" style="width: 100%; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); display: block;"/>` : ''}
          </div>
        </div>
      </div>
    `;

    // Build Reviews HTML (Trustpilot style - green bg, 3-col grid)
    const reviewsHtml = reviews.length > 0 ? `
      <div style="background: #eaf8f9; padding: 60px 20px;">
        <div style="max-width: 1200px; margin: 0 auto;">
          <p style="text-align: center; color: #16a34a; font-weight: 700; font-size: 14px; margin-bottom: 8px;">⭐⭐⭐⭐⭐ 4.9/5 sur +2500 clients</p>
          <h2 style="text-align: center; font-size: 32px; font-weight: 800; color: #111; margin-bottom: 40px;">Ils l'adorent</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center;">
            ${reviews.map(r => `
              <div style="flex: 1 1 30%; min-width: 280px; background: #fff; border: 1px solid #eaeaea; border-radius: 8px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <strong style="font-size: 16px; color: #111;">${r.name}</strong>
                  <span style="font-size: 12px; color: #1d4ed8; font-weight: 600;">&#10003; Acheteur vérifié</span>
                </div>
                <div style="color: #fbbf24; font-size: 16px; margin-bottom: 12px;">${'⭐'.repeat(r.rating || 5)}</div>
                <p style="margin: 0 0 16px; font-size: 14px; color: #444; line-height: 1.6;">${r.text}</p>
                <span style="font-size: 12px; color: #999;">Il y a ${Math.floor(Math.random() * 10) + 1}j</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    ` : '';

    const noReviewsHtml = `
      <div style="background: #eaf8f9; padding: 60px 20px; text-align: center;">
        <div style="max-width: 700px; margin: 0 auto;">
          <p style="color: #16a34a; font-weight: 700; font-size: 14px; margin-bottom: 8px;">AVIS CLIENTS</p>
          <h2 style="font-size: 32px; font-weight: 800; color: #111; margin: 0 0 20px;">Ils partagent leur expérience</h2>
          <p style="margin: 0; padding: 24px; background: #fff; color: #555; border-radius: 8px;">Les avis vérifiés seront affichés ici dès qu’ils seront disponibles.</p>
        </div>
      </div>
    `;

    // Build FAQ HTML (2-column: left title + support card, right accordion)
    const faqHtml = faq.length > 0 ? `
      <div style="padding: 60px 20px; background: #fff;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 60px;">
          <div style="flex: 1 1 40%; min-width: 280px;">
            <h2 style="font-size: 32px; font-weight: 800; color: #111; margin-bottom: 16px;">Questions Fréquentes</h2>
            <p style="font-size: 16px; color: #666; line-height: 1.6; margin-bottom: 40px;">Découvrez comment ce produit révolutionne votre quotidien en rendant vos tâches aussi simples, rapides et efficaces que jamais auparavant.</p>
            <div style="background: #fff; border: 1px solid #eaeaea; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <h4 style="font-size: 18px; font-weight: 700; color: #1d4ed8; margin: 0 0 12px;">Besoin d'un coup de main supplémentaire ?</h4>
              <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.5;">Notre équipe est disponible 7j/7 pour vous accompagner et répondre à toutes vos interrogations.</p>
            </div>
          </div>
          <div style="flex: 1 1 50%; min-width: 300px;">
            ${faq.map(f => `
              <details style="border-bottom: 1px solid #eaeaea; padding: 20px 0; cursor: pointer;">
                <summary style="font-weight: 600; font-size: 16px; color: #111; list-style: none; display: flex; justify-content: space-between; align-items: center;">
                  ${f.question}
                  <span style="font-size: 24px; color: #666; font-weight: 300;">+</span>
                </summary>
                <p style="margin: 16px 0 0; font-size: 15px; color: #555; line-height: 1.6;">${f.answer}</p>
              </details>
            `).join('')}
          </div>
        </div>
      </div>
    ` : '';

    // Trust Footer (4 feature icons + payment footer)
    const trustFooterHtml = `
      <div style="background: linear-gradient(180deg, #eaf8f9 0%, #fff 100%); padding: 50px 20px;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 30px; justify-content: center;">
          <div style="flex: 1 1 20%; min-width: 200px; text-align: left;">
            <div style="font-size: 32px; margin-bottom: 16px;">⚡</div>
            <h4 style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #111;">Efficacité garantie</h4>
            <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.5;">Fini les efforts inutiles, notre produit puissant vous simplifie la vie en un instant.</p>
          </div>
          <div style="flex: 1 1 20%; min-width: 200px; text-align: left;">
            <div style="font-size: 32px; margin-bottom: 16px;">📦</div>
            <h4 style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #111;">Polyvalent</h4>
            <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.5;">Changez et adaptez son utilisation pour chaque besoin de votre quotidien.</p>
          </div>
          <div style="flex: 1 1 20%; min-width: 200px; text-align: left;">
            <div style="font-size: 32px; margin-bottom: 16px;">🔋</div>
            <h4 style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #111;">Design moderne</h4>
            <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.5;">Une finition épurée et pratique qui s'intègre parfaitement partout.</p>
          </div>
          <div style="flex: 1 1 20%; min-width: 200px; text-align: left;">
            <div style="font-size: 32px; margin-bottom: 16px;">⭐</div>
            <h4 style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #111;">Qualité premium</h4>
            <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.5;">Une conception ergonomique et durable pour vous accompagner dans la durée.</p>
          </div>
        </div>
      </div>
      <div style="background: #fff; padding: 40px 20px; border-top: 1px solid #eaeaea;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 20px;">
          <div>
            <h3 style="font-size: 22px; font-weight: 800; font-style: italic; color: #111; margin: 0 0 8px;">${product.title}</h3>
            <p style="margin: 0; font-size: 14px; color: #666;">La qualité sans effort pour un quotidien<br/>étincelant.</p>
          </div>
          <div style="text-align: right;">
            <div style="display: flex; gap: 8px; justify-content: flex-end; margin-bottom: 12px; opacity: 0.5;">
              <span style="background: #10b981; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; color:#fff;">PAIEMENT LIVRAISON</span>
              <span style="background: #1d4ed8; padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 800; color:#fff;">📱 WAVE & ORANGE MONEY</span>
              <span style="background: #0ea5e9; padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 800; color:#fff;">🚚 LIVRAISON 24H/48H SÉNÉGAL</span>
              
              
              
            </div>
            <p style="margin: 0; font-size: 12px; color: #999;">© 2024 Tous droits réservés.</p>
          </div>
        </div>
      </div>
    `;

    const imagesHtml = `
      <!-- Dropmagic Custom Gallery -->
      <div class="dropmagic-custom-gallery" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 30px;">
        <div style="width: 100%; aspect-ratio: 1/1; border-radius: 16px; background: #f9f9f9; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid #eaeaea;">
          <img src="${product.images[0]}" style="width: 100%; height: 100%; object-fit: contain; padding: 24px;" />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          ${product.images.slice(1).map(img => `
            <div style="width: 100%; aspect-ratio: 1/1; border-radius: 12px; border: 1px solid #eaeaea; background: #f9f9f9; padding: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
              <img src="${img}" style="width: 100%; height: 100%; object-fit: contain;" />
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Build full DropX Layout
    const body_html = `
      <div id="dropx-full-page-container" data-base-price="${basePrice}" data-safe-compare="${safeCompare}" data-theme-color="${themeColor}" data-theme-foreground="${themeForeground}" data-button-color="${buttonColor}" data-button-foreground="${buttonForeground}" style="display: none; font-family: 'Trebuchet MS', 'Segoe UI', sans-serif; background: #fff; color: #111; min-height: 100vh; padding-bottom: 50px;">
        <div style="background: ${themeColor}; color: ${themeForeground}; text-align: center; padding: 8px; font-size: 12px; font-weight: 600; letter-spacing: 1px;">Livraison rapide 🚚</div>
        <div style="padding: 20px 5%; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f0f0f0;">
          <a href="/" style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px; margin: 0; color: ${themeColor}; text-decoration: none; cursor: pointer;">ShopX</a>
          <span style="font-size: 24px; color: ${themeColor};">🛍</span>
        </div>
        
        <!-- Top Section: Image & Info -->
        <div style="max-width: 1200px; margin: 0 auto; padding: 40px 5%; display: flex; gap: 50px; flex-wrap: wrap;">
          
          <!-- Left: Gallery -->
          <div style="flex: 1 1 500px; display: flex; flex-direction: column; gap: 16px;">
            <div style="width: 100%; aspect-ratio: 1/1; border-radius: 16px; background: #f9f9f9; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid #eaeaea;">
              <img src="${product.images[0]}" style="width: 100%; height: 100%; object-fit: contain; padding: 24px;" />
            </div>
            ${product.images.length > 1 ? `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              ${product.images.slice(1).map(img => `
                <div style="width: 100%; aspect-ratio: 1/1; border-radius: 12px; border: 1px solid #eaeaea; background: #f9f9f9; padding: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                  <img src="${img}" style="width: 100%; height: 100%; object-fit: contain;" />
                </div>
              `).join('')}
            </div>` : ''}
          </div>

          <!-- Right: Product Info -->
          <div style="flex: 1 1 400px; display: flex; flex-direction: column;">
            <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 600;">Tendance actuelle</p>
            <h1 style="font-size: 32px; font-weight: 800; line-height: 1.2; margin-bottom: 16px; color: ${themeColor};">${product.title}</h1>
            
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; font-size: 28px; font-weight: 800; color: ${themeColor};">
                <span id="dropx-price-display"></span>
              </div>
              <div style="display: flex; align-items: center; font-size: 20px; color: #9ca3af; text-decoration: line-through; font-weight: 600;">
                <span id="dropx-oldprice-display"></span>
              </div>
              <span id="dropx-savings-display" style="background: #fef2f2; color: #ef4444; padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 800;"></span>
            </div>

            <div style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 32px;">
              ${formattedDesc}
            </div>

            <div style="margin-bottom: 24px;">
              <h3 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; color: ${themeColor};">Choisissez votre pack</h3>
              <div id="dropx-bundles-container" style="display: flex; flex-direction: column; gap: 12px;"></div>
            </div>

            <div id="dropx-form-placeholder" style="margin-bottom: 20px; width: 100%;"></div>

            <!-- Trust Footer Inline -->
            <div style="display: flex; gap: 16px; justify-content: center; padding-top: 20px; border-top: 1px solid #eaeaea;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 20px;">🛡️</span>
                <div style="font-size: 11px; color: #666; line-height: 1.2;"><b>Essai 30 Jours</b><br/>Satisfait ou remboursé</div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 20px;">🚚</span>
                <div style="font-size: 11px; color: #666; line-height: 1.2;"><b>Livraison Rapide</b><br/>Expédié en 24/48h</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Full Width Landing Page Sections -->
        ${contentHtml}
        ${reviewsHtml || noReviewsHtml}
        ${faqHtml}
        ${trustFooterHtml}
      </div>
    `;
    // -------------------------------------------------------------
    // Inject Script into Shopify Theme to Bypass body_html sanitization
    // -------------------------------------------------------------
    try {
      const headersAssets = {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminToken
      };
      
      // 1. Get Active Theme
      const themeRes = await fetch(`https://${shopUrl}/admin/api/2024-04/themes.json`, { headers: headersAssets });
      const themeData = await themeRes.json();
      const activeTheme = (themeData.themes || []).find(t => t.role === 'main');
      
      if (activeTheme) {
        const themeId = activeTheme.id;
        
        // 2. Create the Snippet (EasySell COD Senegal)
        const appApiUrl = (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost'))
          ? process.env.NEXT_PUBLIC_APP_URL
          : 'https://dropx-ai.vercel.app';
        const snippetContent = `
<style>
  body, button, input, select, textarea { font-family: 'Trebuchet MS', 'Segoe UI', sans-serif !important; }
  .product-card, .card-wrapper, .card, .collection .card-wrapper, .product-grid .card-wrapper, li.grid__item .card-wrapper {
    border: 1.5px solid rgba(82, 115, 104, 0.42) !important;
    border-radius: 18px !important;
    overflow: hidden !important;
    background: #fff !important;
    box-shadow: 0 5px 18px rgba(15, 23, 42, 0.08) !important;
    box-sizing: border-box !important;
  }
  .card__inner, .card__media, .card__media .media, .card__media img { border-radius: 16px 16px 0 0 !important; overflow: hidden !important; }
  .card__information, .card-information, .card__content { padding: 16px 18px 18px !important; }
  .card__heading, .card-information__text, .price { margin-left: 0 !important; margin-right: 0 !important; line-height: 1.45 !important; }
</style>
{% if template contains 'product' %}
<!-- Meta Pixel Base Code (DropX Senegal) -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1112535538423893');
fbq('track', 'PageView');
</script>
<style>
  body.dropx-product-active > header,
  body.dropx-product-active > footer,
  body.dropx-product-active .shopify-section-group-header-group,
  body.dropx-product-active .shopify-section-group-footer-group,
  body.dropx-product-active #shopify-section-announcement-bar,
  body.dropx-product-active .announcement-bar-section { display: none !important; }
  body.dropx-product-active main { padding: 0 !important; margin: 0 !important; max-width: none !important; }

  /* HIDE ALL DEFAULT PAYPAL / STRIPE / DYNAMIC CHECKOUT BUTTONS */
  .shopify-payment-button,
  .shopify-payment-button__button,
  [data-shopify="payment-button"],
  iframe[name^="__privateStripeMetricsController"],
  .paypal-buttons,
  .product-form__buttons,
  .product-form__submit {
    display: none !important;
  }

  /* EasySell COD Senegal Styles */
  .dropx-cod-card {
    background: #ffffff;
    border: 2px solid ${buttonColor};
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    margin-top: 20px;
    box-sizing: border-box;
    width: 100%;
  }
  .dropx-cod-badge {
    background: ${buttonColor};
    color: ${buttonForeground};
    padding: 10px 14px;
    border-radius: 10px;
    text-align: center;
    font-weight: 800;
    font-size: 14px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    letter-spacing: 0.5px;
  }
  .dropx-form-group { margin-bottom: 14px; }
  .dropx-label { display: block; font-size: 13px; font-weight: 700; color: #1f2937; margin-bottom: 6px; }
  .dropx-input, .dropx-select {
    width: 100%;
    box-sizing: border-box;
    padding: 13px 14px;
    border: 1.5px solid #d1d5db;
    border-radius: 10px;
    font-size: 15px;
    color: #111;
    background: #f9fafb;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    font-family: inherit;
  }
  .dropx-input:focus, .dropx-select:focus { border-color: ${buttonColor}; background: #fff; }
  .dropx-phone-wrap { display: flex; gap: 8px; }
  .dropx-phone-prefix {
    display: flex;
    align-items: center;
    padding: 0 12px;
    background: #e5e7eb;
    border-radius: 10px;
    font-weight: 700;
    font-size: 14px;
    color: #374151;
    white-space: nowrap;
  }
  .dropx-payment-options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .dropx-payment-label {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    background: #f9fafb;
    cursor: pointer;
    font-size: 13px;
    font-weight: 700;
    color: #374151;
    transition: all 0.2s;
  }
  .dropx-payment-label.active { border-color: #10b981; background: #f0fdf4; color: #15803d; }
  .dropx-summary-box {
    background: #f8fafc;
    border: 1.5px dashed #cbd5e1;
    border-radius: 12px;
    padding: 14px;
    margin: 16px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .dropx-submit-btn {
    background: ${buttonColor};
    color: ${buttonForeground};
    width: 100%;
    padding: 18px 20px;
    border-radius: 12px;
    font-weight: 900;
    font-size: 17px;
    border: none;
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.2s;
    box-shadow: 0 8px 22px ${buttonColor}50;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    animation: dropxPulse 2s infinite;
  }
  .dropx-submit-btn:active { transform: scale(0.98); }
  @keyframes dropxPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
  }
  .dropx-trust-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; font-size: 11px; color: #4b5563; }
  .dropx-trust-item { display: flex; align-items: center; gap: 6px; }
  .dropx-modal-backdrop {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    padding: 20px;
    box-sizing: border-box;
  }
  .dropx-modal-content {
    background: #fff;
    border-radius: 20px;
    padding: 30px;
    max-width: 480px;
    width: 100%;
    text-align: center;
    box-shadow: 0 25px 50px rgba(0,0,0,0.3);
    position: relative;
    color: #111;
  }
  .dropx-whatsapp-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: #25D366;
    color: #fff;
    padding: 16px 24px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 800;
    text-decoration: none;
    margin-top: 20px;
    box-shadow: 0 8px 20px rgba(37,211,102,0.4);
    transition: transform 0.2s;
  }
  .dropx-whatsapp-btn:hover { transform: scale(1.03); }
</style>

<div id="dropx-liquid-form-container" style="display:none; width: 100%;">
  <div class="dropx-cod-card">
    <div class="dropx-cod-badge">
      <span>⚡</span> COMMANDE RAPIDE EN 1 CLIC (PAIEMENT À LA LIVRAISON)
    </div>

    <p style="font-size: 13px; color: #4b5563; text-align: center; margin: 0 0 16px; line-height: 1.4;">
      Pas besoin de carte bancaire ! Remplissez vos coordonnées ci-dessous, nous vous livrons chez vous et vous réglez à la réception.
    </p>

    <div class="dropx-form-group">
      <label class="dropx-label">👤 Votre Prénom et Nom <span style="color: #ef4444;">*</span></label>
      <input type="text" id="dropx-cod-name" class="dropx-input" placeholder="Ex: Mamadou Diallo" required />
    </div>

    <div class="dropx-form-group">
      <label class="dropx-label">📞 Numéro WhatsApp / Téléphone <span style="color: #ef4444;">*</span></label>
      <div class="dropx-phone-wrap">
        <span class="dropx-phone-prefix">🇸🇳 +221</span>
        <input type="tel" id="dropx-cod-phone" class="dropx-input" placeholder="77 123 45 67" required />
      </div>
      <span style="font-size: 11px; color: #6b7280; margin-top: 4px; display: block;">Notre livreur vous appellera sur ce numéro avant de passer.</span>
    </div>

    <div class="dropx-form-group">
      <label class="dropx-label">📍 Ville / Région <span style="color: #ef4444;">*</span></label>
      <select id="dropx-cod-city" class="dropx-select">
        <option value="Dakar Centre (Plateau, Médina, Fann, Point E)">Dakar Centre (Plateau, Médina, Fann, Point E)</option>
        <option value="Dakar Ouest (Almadies, Ngor, Ouakam, Mermoz)">Dakar Ouest (Almadies, Ngor, Ouakam, Mermoz)</option>
        <option value="Dakar Nord (Yoff, Ouest-Foire, Nord-Foire, Maristes)">Dakar Nord (Yoff, Ouest-Foire, Nord-Foire, Maristes)</option>
        <option value="Dakar Banlieue (Pikine, Guédiawaye, Parcelles Assainies)">Dakar Banlieue (Pikine, Guédiawaye, Parcelles Assainies)</option>
        <option value="Rufisque / Keur Massar / Diamniadio">Rufisque / Keur Massar / Diamniadio</option>
        <option value="Thiès / Mbour / Saly">Thiès / Mbour / Saly</option>
        <option value="Touba / Mbacké / Diourbel">Touba / Mbacké / Diourbel</option>
        <option value="Saint-Louis">Saint-Louis</option>
        <option value="Kaolack">Kaolack</option>
        <option value="Ziguinchor">Ziguinchor</option>
        <option value="Autre région du Sénégal">Autre région du Sénégal</option>
      </select>
    </div>

    <div class="dropx-form-group">
      <label class="dropx-label">🏠 Quartier / Adresse de livraison <span style="color: #ef4444;">*</span></label>
      <input type="text" id="dropx-cod-address" class="dropx-input" placeholder="Ex: Sacré-Cœur 3, près de la boulangerie..." required />
    </div>

    <div class="dropx-form-group">
      <label class="dropx-label">💵 Mode de Paiement à la réception</label>
      <div class="dropx-payment-options">
        <label class="dropx-payment-label active" id="dropx-pay-cash-lbl">
          <input type="radio" name="dropx_pay_method" value="Espèces à la livraison" checked style="accent-color: #10b981;" />
          <span>💵 Espèces</span>
        </label>
        <label class="dropx-payment-label" id="dropx-pay-wave-lbl">
          <input type="radio" name="dropx_pay_method" value="Wave / Orange Money" style="accent-color: #1d4ed8;" />
          <span>📱 Wave / OM</span>
        </label>
      </div>
    </div>

    <div class="dropx-summary-box">
      <div>
        <div style="font-size: 12px; color: #64748b; font-weight: 600;">Total à régler à la livraison :</div>
        <div id="dropx-cod-pack-label" style="font-size: 13px; color: #111; font-weight: 700;">Pack 1 Unité</div>
      </div>
      <div id="dropx-cod-total-display" style="font-size: 22px; font-weight: 900; color: ${buttonColor};">-- FCFA</div>
    </div>

    <button type="button" id="dropx-cod-submit-btn" class="dropx-submit-btn">
      <span>COMMANDER MAINTENANT (PAIEMENT À LA LIVRAISON) 🚚</span>
    </button>

    <div class="dropx-trust-grid">
      <div class="dropx-trust-item"><span>📦</span> <b>Vérifiez avant de payer</b></div>
      <div class="dropx-trust-item"><span>🚀</span> <b>Livraison 24h/48h Sénégal</b></div>
      <div class="dropx-trust-item"><span>📞</span> <b>Confirmation WhatsApp</b></div>
      <div class="dropx-trust-item"><span>🔒</span> <b>Paiement 100% sécurisé</b></div>
    </div>
  </div>
</div>

<!-- Confirmation Modal -->
<div id="dropx-confirmation-modal" class="dropx-modal-backdrop" style="display: none;">
  <div class="dropx-modal-content">
    <div style="width: 70px; height: 70px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 36px; margin: 0 auto 16px;">
      ✓
    </div>
    <h2 style="font-size: 24px; font-weight: 900; color: #111; margin: 0 0 8px;">Félicitations ! 🎉</h2>
    <p style="font-size: 15px; color: #4b5563; margin: 0 0 16px; line-height: 1.5;">
      Votre commande a été enregistrée avec succès. Notre équipe va vous appeler pour organiser la livraison.
    </p>

    <div style="background: #f8fafc; border-radius: 12px; padding: 14px; text-align: left; font-size: 13px; color: #374151; margin-bottom: 20px;">
      <div style="margin-bottom: 6px;"><b>📦 Produit :</b> <span id="dropx-modal-product">--</span></div>
      <div style="margin-bottom: 6px;"><b>💰 Montant à payer :</b> <span id="dropx-modal-total" style="font-weight: 800; color: #10b981;">-- FCFA</span></div>
      <div style="margin-bottom: 6px;"><b>📍 Livraison à :</b> <span id="dropx-modal-address">--</span></div>
      <div><b>💵 Règlement :</b> <span id="dropx-modal-payment">--</span></div>
    </div>

    <a id="dropx-modal-wa-link" href="#" target="_blank" class="dropx-whatsapp-btn">
      <span style="font-size: 20px;">💬</span> Confirmer rapidement sur WhatsApp
    </a>

    <button type="button" onclick="document.getElementById('dropx-confirmation-modal').style.display='none'" style="margin-top: 14px; background: transparent; border: none; color: #6b7280; font-size: 13px; cursor: pointer; text-decoration: underline;">
      Fermer cette fenêtre
    </button>
  </div>
</div>

<script>
(function() {
  var productVariants = {{ product.variants | json }};
  var productOptions = {{ product.options_with_values | json }};
  var productTitle = {{ product.title | json }};
  var shopDomain = window.location.hostname;
  var apiBaseUrl = "` + appApiUrl + `";

  function attemptDropxOverride() {
    try {
      var dropxUI = document.getElementById('dropx-full-page-container');
      if(!dropxUI) return false;
      if(dropxUI.getAttribute('data-injected') === 'true') return true;

      var mainContainer = document.querySelector('main') || document.querySelector('#MainContent') || document.querySelector('.main-content');
      if(!mainContainer) return false;

      var baseP = parseFloat(dropxUI.getAttribute('data-base-price')) || 0;
      var safeC = parseFloat(dropxUI.getAttribute('data-safe-compare')) || 0;
      var themeColor = dropxUI.getAttribute('data-theme-color') || '#000000';
      var themeForeground = dropxUI.getAttribute('data-theme-foreground') || '#ffffff';
      var buttonColor = dropxUI.getAttribute('data-button-color') || '#10b981';

      var bundlesData = [
        { title: "Pack Découverte (1 Unité)", tag: "", price: baseP, oldPrice: safeC },
        { title: "2 Achetés (-15%)", tag: "Le plus populaire", price: Math.ceil(baseP * 2 * 0.85 / 100) * 100, oldPrice: safeC * 2 },
        { title: "3 Achetés (-25%)", tag: "Meilleure vente", price: Math.ceil(baseP * 3 * 0.75 / 100) * 100, oldPrice: safeC * 3 }
      ];

      function formatPrice(price) {
        if (price >= 500) {
          return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(price) + ' FCFA';
        }
        var xofAmount = Math.round(price * 600 / 100) * 100;
        return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(xofAmount) + ' FCFA';
      }

      var selectedBundleIndex = 0;

      function updateCODAmounts() {
        var activeBundle = bundlesData[selectedBundleIndex] || bundlesData[0];
        var packLabelEl = document.getElementById('dropx-cod-pack-label');
        var totalEl = document.getElementById('dropx-cod-total-display');
        if (packLabelEl) packLabelEl.innerText = activeBundle.title;
        if (totalEl) totalEl.innerText = formatPrice(activeBundle.price);

        var priceEl = document.getElementById('dropx-price-display');
        if(priceEl) priceEl.innerText = formatPrice(activeBundle.price);
        var oldPriceEl = document.getElementById('dropx-oldprice-display');
        if(oldPriceEl) oldPriceEl.innerText = formatPrice(activeBundle.oldPrice);
        var savingsEl = document.getElementById('dropx-savings-display');
        if(savingsEl) {
           var savingPct = activeBundle.oldPrice > 0 ? Math.round((1 - activeBundle.price / activeBundle.oldPrice) * 100) : 0;
           savingsEl.innerText = 'Économisez ' + (savingPct || 0) + '%';
        }
      }

      mainContainer.innerHTML = '';
      document.body.classList.add('dropx-product-active');
      dropxUI.style.display = 'block';
      dropxUI.setAttribute('data-injected', 'true');
      mainContainer.appendChild(dropxUI);

      var placeholder = document.getElementById('dropx-form-placeholder');
      var liquidForm = document.getElementById('dropx-liquid-form-container');
      if(placeholder && liquidForm) {
         placeholder.appendChild(liquidForm);
         liquidForm.style.display = 'block';
      }

      function renderBundles() {
        var container = document.getElementById('dropx-bundles-container');
        if(!container) return;
        container.innerHTML = '';

        bundlesData.forEach(function(b, index) {
          var isSelected = (index === selectedBundleIndex);
          var box = document.createElement('div');
          box.style.border = isSelected ? '2px solid ' + themeColor : '1px solid #e5e7eb';
          box.style.background = isSelected ? '#f8fafc' : '#fff';
          box.style.borderRadius = '12px';
          box.style.padding = '16px';
          box.style.cursor = 'pointer';
          box.style.position = 'relative';
          box.style.display = 'flex';
          box.style.alignItems = 'center';
          box.style.gap = '12px';
          box.style.transition = 'all 0.2s';

          if(b.tag) {
            var tag = document.createElement('div');
            tag.innerText = b.tag;
            tag.style.position = 'absolute';
            tag.style.top = '-10px';
            tag.style.right = '16px';
            tag.style.background = themeColor;
            tag.style.color = themeForeground;
            tag.style.fontSize = '10px';
            tag.style.fontWeight = 'bold';
            tag.style.padding = '2px 8px';
            tag.style.borderRadius = '10px';
            box.appendChild(tag);
          }

          var radioContainer = document.createElement('div');
          radioContainer.style.width = '18px';
          radioContainer.style.height = '18px';
          radioContainer.style.borderRadius = '50%';
          radioContainer.style.border = isSelected ? '6px solid ' + themeColor : '2px solid #d1d5db';
          box.appendChild(radioContainer);

          var textDiv = document.createElement('div');
          textDiv.style.flex = '1';
          textDiv.style.display = 'flex';
          textDiv.style.justifyContent = 'space-between';
          textDiv.style.alignItems = 'center';

          var t1 = document.createElement('div');
          var titleTxt = document.createElement('div');
          titleTxt.innerText = b.title;
          titleTxt.style.fontWeight = '600';
          titleTxt.style.fontSize = '15px';
          titleTxt.style.color = themeColor;
          var subtitleTxt = document.createElement('div');
          subtitleTxt.style.fontSize = '12px';
          subtitleTxt.style.color = '#666';
          var saveP = b.oldPrice > 0 ? Math.round((1 - b.price / b.oldPrice) * 100) : 0;
          subtitleTxt.innerText = 'ÉCONOMISEZ ' + saveP + '%';
          t1.appendChild(titleTxt);
          t1.appendChild(subtitleTxt);

          var t2 = document.createElement('div');
          t2.style.textAlign = 'right';
          var p1 = document.createElement('div');
          p1.innerText = formatPrice(b.price);
          p1.style.fontWeight = '800';
          p1.style.fontSize = '15px';
          p1.style.color = themeColor;
          var p2 = document.createElement('div');
          p2.innerText = formatPrice(b.oldPrice);
          p2.style.textDecoration = 'line-through';
          p2.style.fontSize = '12px';
          p2.style.color = '#999';
          t2.appendChild(p1);
          t2.appendChild(p2);

          textDiv.appendChild(t1);
          textDiv.appendChild(t2);
          box.appendChild(textDiv);

          box.onclick = function() {
            selectedBundleIndex = index;
            renderBundles();
            updateCODAmounts();
          };

          container.appendChild(box);
        });
      }

      renderBundles();
      updateCODAmounts();

      // Payment radio toggle style
      var cashLbl = document.getElementById('dropx-pay-cash-lbl');
      var waveLbl = document.getElementById('dropx-pay-wave-lbl');
      var radios = document.getElementsByName('dropx_pay_method');
      for (var r = 0; r < radios.length; r++) {
        radios[r].onchange = function() {
          if (this.value.includes('Espèces')) {
            if(cashLbl) cashLbl.classList.add('active');
            if(waveLbl) waveLbl.classList.remove('active');
          } else {
            if(waveLbl) waveLbl.classList.add('active');
            if(cashLbl) cashLbl.classList.remove('active');
          }
        };
      }

      // COD Form Submission
      var submitBtn = document.getElementById('dropx-cod-submit-btn');
      if (submitBtn) {
        submitBtn.onclick = async function() {
          var name = (document.getElementById('dropx-cod-name') || {}).value || '';
          var phone = (document.getElementById('dropx-cod-phone') || {}).value || '';
          var city = (document.getElementById('dropx-cod-city') || {}).value || 'Dakar';
          var address = (document.getElementById('dropx-cod-address') || {}).value || '';

          var methodEl = document.querySelector('input[name="dropx_pay_method"]:checked');
          var paymentMethod = methodEl ? methodEl.value : 'Espèces à la livraison';

          if (!name.trim()) {
            alert('Veuillez entrer votre nom et prénom.');
            var n = document.getElementById('dropx-cod-name'); if(n) n.focus();
            return;
          }
          if (!phone.trim()) {
            alert('Veuillez entrer votre numéro de téléphone.');
            var p = document.getElementById('dropx-cod-phone'); if(p) p.focus();
            return;
          }
          if (!address.trim()) {
            alert('Veuillez entrer votre quartier ou adresse de livraison.');
            var a = document.getElementById('dropx-cod-address'); if(a) a.focus();
            return;
          }

          var activeBundle = bundlesData[selectedBundleIndex] || bundlesData[0];
          var totalAmount = activeBundle.price;

          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span>Validation en cours... ⏳</span>';

          var fullPhone = '+221 ' + phone.replace(/^\+221/, '').trim();

          // Fire Meta Pixel Purchase event for ads tracking!
          try {
            if (typeof fbq === 'function') {
              fbq('track', 'Purchase', {
                value: totalAmount,
                currency: 'XOF',
                content_name: productTitle,
                content_type: 'product',
                num_items: selectedBundleIndex + 1
              });
            }
          } catch(e) {}

          // Prepare WhatsApp link
          var waText = encodeURIComponent(
            "Bonjour ShopX ! Je viens de commander : " + productTitle + " (" + activeBundle.title + ").\n" +
            "Montant total : " + formatPrice(totalAmount) + ".\n" +
            "Nom : " + name + "\n" +
            "Téléphone : " + fullPhone + "\n" +
            "Ville / Quartier : " + city + " - " + address + "\n" +
            "Paiement : " + paymentMethod + ".\n" +
            "Merci de me confirmer la livraison !"
          );
          var waUrl = "https://wa.me/221775447866?text=" + waText;

          // Send to DropX COD API
          try {
            var targetEndpoint = (apiBaseUrl ? apiBaseUrl : '') + '/api/orders/cod';
            var response = await fetch(targetEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                shopDomain: shopDomain,
                customerName: name,
                customerPhone: fullPhone,
                customerCity: city,
                customerAddress: address,
                paymentMethod: paymentMethod,
                productTitle: productTitle,
                bundleTitle: activeBundle.title,
                quantity: selectedBundleIndex + 1,
                unitPrice: baseP,
                totalPrice: totalAmount,
                currency: 'XOF'
              })
            });
            var data = await response.json();
            if (data.whatsappUrl) {
              waUrl = data.whatsappUrl;
            }
          } catch (apiErr) {
            console.warn("DropX API sync fallback:", apiErr);
          }

          // Populate and show Confirmation Modal
          var modalProd = document.getElementById('dropx-modal-product');
          if (modalProd) modalProd.innerText = productTitle + " (" + activeBundle.title + ")";
          var modalTot = document.getElementById('dropx-modal-total');
          if (modalTot) modalTot.innerText = formatPrice(totalAmount);
          var modalAddr = document.getElementById('dropx-modal-address');
          if (modalAddr) modalAddr.innerText = address + ", " + city;
          var modalPay = document.getElementById('dropx-modal-payment');
          if (modalPay) modalPay.innerText = paymentMethod;

          var waLink = document.getElementById('dropx-modal-wa-link');
          if (waLink) waLink.href = waUrl;

          var modal = document.getElementById('dropx-confirmation-modal');
          if (modal) modal.style.display = 'flex';

          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>COMMANDE VALIDÉE ! ✓</span>';
        };
      }

      return true;
    } catch(e) {
      console.error("DropX UI Error:", e);
      return false;
    }
  }

  var dropxAttempts = 0;
  var dropxInterval = setInterval(function() {
    if (attemptDropxOverride() || dropxAttempts > 30) {
      clearInterval(dropxInterval);
    }
    dropxAttempts++;
  }, 100);
})();
</script>
{% endif %}
`;

        await fetch(`https://${shopUrl}/admin/api/2024-04/themes/${themeId}/assets.json`, {
          method: 'PUT',
          headers: headersAssets,
          body: JSON.stringify({ asset: { key: 'snippets/dropx-ui.liquid', value: snippetContent } })
        });

        // 3. Inject Snippet into layout/theme.liquid
        const layoutRes = await fetch(`https://${shopUrl}/admin/api/2024-04/themes/${themeId}/assets.json?asset[key]=layout/theme.liquid`, { headers: headersAssets });
        if (layoutRes.ok) {
          const layoutData = await layoutRes.json();
          let themeHtml = layoutData?.asset?.value || "";
          if (themeHtml && !themeHtml.includes("render 'dropx-ui'")) {
            themeHtml = themeHtml.replace('</body>', "\n{% render 'dropx-ui' %}\n</body>");
            await fetch(`https://${shopUrl}/admin/api/2024-04/themes/${themeId}/assets.json`, {
              method: 'PUT',
              headers: headersAssets,
              body: JSON.stringify({ asset: { key: 'layout/theme.liquid', value: themeHtml } })
            });
          }
        }
      }
    } catch (e) {
      console.error("[Shopify Push] Theme JS injection failed:", e);
    }
    // -------------------------------------------------------------

    const shopifyPayload = {
      product: {
        title: product.title,
        body_html: body_html,
        vendor: "DropX AI",
        product_type: "AI Generated",
        status: "active", // Actif pour que l'ajout au panier fonctionne
        published: true,
        options: shopifyOptions,
        variants: variants.slice(0, 100), // Shopify max 100 variants
        images: (product.images || []).map(imgUrl => ({ src: imgUrl }))
      }
    };

    console.log(`[Shopify Push] Sending product to: https://${shopUrl}/admin/api/2024-04/products.json`);

    const response = await fetch(`https://${shopUrl}/admin/api/2024-04/products.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminToken
      },
      body: JSON.stringify(shopifyPayload)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("[Shopify Push Error from API]:", responseData);
      
      // Attempt to return a user-friendly error
      let errorMsg = "Erreur de l'API Shopify.";
      if (responseData.errors) {
        if (typeof responseData.errors === 'string') {
          errorMsg = responseData.errors;
        } else {
          errorMsg = JSON.stringify(responseData.errors);
        }
      }
      
      // If it's an auth error
      if (response.status === 401 || errorMsg.includes("Invalid API key")) {
         return NextResponse.json({ error: "Token API invalide. Assurez-vous d'avoir utilisé le jeton 'shpat_...'." }, { status: 401 });
      }

      if (errorMsg.includes("write_products")) {
        return NextResponse.json({ error: "Permission 'write_products' manquante. Si vous avez utilisé OAuth, vérifiez les scopes de votre app. Solution recommandée : Créez une Application Personnalisée directement dans votre boutique Shopify (Paramètres > Applications), cochez 'write_products', et utilisez le jeton d'accès (shpat_...) à la place de l'ID Client." }, { status: 403 });
      }

      return NextResponse.json({ error: `Erreur Shopify: ${errorMsg}` }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Produit exporté vers Shopify avec succès !",
      shopifyProduct: responseData.product
    }, { status: 200 });

  } catch (error) {
    console.error("Shopify Push Error:", error);
    return NextResponse.json({ error: "Erreur interne lors de l'export." }, { status: 500 });
  }
}
