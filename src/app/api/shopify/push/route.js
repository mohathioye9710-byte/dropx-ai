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
        <div style="background: ${themeColor}; color: ${themeForeground}; text-align: center; padding: 9px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;">🎉 OFFRE DU JOUR : LIVRAISON GRATUITE PARTOUT AU SÉNÉGAL 🚚🎁 (PAIEMENT À LA LIVRAISON)</div>
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
            <div style="display: inline-flex; align-items: center; gap: 6px; background: #ecfdf5; border: 1.5px solid #10b981; color: #065f46; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 800; margin-bottom: 20px; width: fit-content;">
              <span>🎁</span> LIVRAISON GRATUITE AU SÉNÉGAL (Dakar & Régions en 24h/48h)
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
                <div style="font-size: 11px; color: #666; line-height: 1.2;"><b>Livraison Gratuite</b><br/>Expédié en 24/48h Sénégal</div>
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

  /* ==========================================================================
     DROPX UNIVERSAL PRODUCT CARD SPACING & STYLING
     ========================================================================== */
  product-card,
  .product-card,
  .card-wrapper,
  .card,
  .collection .card-wrapper,
  .product-grid .card-wrapper,
  li.grid__item .card-wrapper {
    border: 1.5px solid rgba(82, 115, 104, 0.25) !important;
    border-radius: 18px !important;
    overflow: hidden !important;
    background: #ffffff !important;
    box-shadow: 0 4px 18px rgba(15, 23, 42, 0.07) !important;
    box-sizing: border-box !important;
  }

  .product-card-gallery,
  .product-card__gallery,
  .card__inner,
  .card__media,
  .card__media .media,
  .card__media img,
  product-card slideshow-component,
  product-card [class*="gallery"],
  product-card [class*="media"] {
    border-radius: 16px 16px 0 0 !important;
    overflow: hidden !important;
    width: 100% !important;
    margin: 0 !important;
  }

  product-card a[ref="productTitleLink"],
  product-card a[ref="productTitleLink"] .text-block,
  product-card product-price,
  product-card .text-block:not([class*="gallery"]):not([class*="media"]):not([class*="image"]),
  product-card .product-grid-view-zoom-out--details,
  product-card [role="heading"],
  .product-card a[ref="productTitleLink"],
  .product-card a[ref="productTitleLink"] .text-block,
  .product-card product-price,
  .product-card .text-block:not([class*="gallery"]):not([class*="media"]):not([class*="image"]),
  .product-card [role="heading"],
  .card__information,
  .card-information,
  .card__content > *:not(.card__inner):not(.card__media):not([class*="media"]):not([class*="gallery"]) {
    padding-left: 18px !important;
    padding-right: 18px !important;
    box-sizing: border-box !important;
    --padding-inline-start: 18px !important;
    --padding-inline-end: 18px !important;
  }

  product-card a[ref="productTitleLink"],
  .product-card a[ref="productTitleLink"],
  product-card a[ref="productTitleLink"] .text-block,
  .product-card [role="heading"],
  .card__heading {
    margin-top: 14px !important;
    margin-bottom: 6px !important;
    padding-top: 2px !important;
    line-height: 1.45 !important;
    font-size: 0.98rem !important;
    font-weight: 600 !important;
    color: #111111 !important;
  }

  product-card product-price,
  .product-card product-price,
  .card__information .price,
  .card-information .price,
  .card-information__text {
    margin-top: 4px !important;
    margin-bottom: 18px !important;
    padding-bottom: 6px !important;
    line-height: 1.4 !important;
    box-sizing: border-box !important;
  }

  product-card product-price .price,
  product-card product-price .price-item,
  .product-card .price {
    font-size: 1.05rem !important;
    font-weight: 800 !important;
    color: #111111 !important;
  }

  product-card product-price .compare-at-price,
  .product-card .compare-at-price {
    font-size: 0.92rem !important;
    font-weight: 500 !important;
    color: #9ca3af !important;
    text-decoration: line-through !important;
    margin-left: 8px !important;
  }

  /* Hide default Shopify dynamic checkout buttons */
  .shopify-payment-button,
  .shopify-payment-button__button,
  [data-shopify="payment-button"],
  iframe[name^="__privateStripeMetricsController"],
  .paypal-buttons {
    display: none !important;
  }

  /* When DropX landing page is active, hide old native theme sections and forms */
  body.dropx-product-active [id*="__main"],
  body.dropx-product-active [id*="email_signup"],
  body.dropx-product-active .product-form,
  body.dropx-product-active .shopify-product-form,
  body.dropx-product-active .add-to-cart-button,
  body.dropx-product-active .product-grid__card,
  body.dropx-product-active .product-information,
  body.dropx-product-active .email-signup__form, body.dropx-product-active [class*="email-signup"], body.dropx-product-active .shopify-section-group-footer-group {
    display: none !important;
  }
</style>

<script>
// ==========================================================================
// GLOBAL CURRENCY AUTO-FORMATTER ($13,500.00 -> 13 500 FCFA)
// ==========================================================================
(function() {
  function formatTextFCFA(text) {
    if (!text || typeof text !== 'string') return text;
    // Match $13,500.00 or $13500 or 13,500.00 USD
    return text.replace(/\\$\\s*([0-9]{1,3}(?:[,\\s][0-9]{3})*(?:\\.[0-9]{2})?)/g, function(match, num) {
      var clean = Math.round(parseFloat(num.replace(/[,\\s]/g, '')));
      if (isNaN(clean) || clean <= 0) return match;
      return new Intl.NumberFormat('fr-FR').format(clean) + ' FCFA';
    }).replace(/([0-9]{1,3}(?:[,\\s][0-9]{3})*(?:\\.[0-9]{2})?)\\s*(?:USD|\\$)/g, function(match, num) {
      var clean = Math.round(parseFloat(num.replace(/[,\\s]/g, '')));
      if (isNaN(clean) || clean <= 0) return match;
      return new Intl.NumberFormat('fr-FR').format(clean) + ' FCFA';
    });
  }

  function cleanCurrenciesInNode(node) {
    if (!node) return;
    if (node.nodeType === 3) { // Text node
      if (node.nodeValue && (node.nodeValue.includes('$') || node.nodeValue.includes('USD'))) {
        node.nodeValue = formatTextFCFA(node.nodeValue);
      }
    } else if (node.nodeType === 1 && node.childNodes) {
      // Don't format inside script/style
      if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE' || node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') return;
      for (var i = 0; i < node.childNodes.length; i++) {
        cleanCurrenciesInNode(node.childNodes[i]);
      }
    }
  }

  function runCurrencyFormat() {
    var priceEls = document.querySelectorAll('.price, [class*="price"], .compare-at-price, product-price');
    priceEls.forEach(function(el) { cleanCurrenciesInNode(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runCurrencyFormat);
  } else {
    runCurrencyFormat();
  }
  setTimeout(runCurrencyFormat, 500);
  setTimeout(runCurrencyFormat, 1500);
})();
</script>

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
fbq('init', '1912589453038437');
fbq('init', '1112535538423893');
fbq('track', 'PageView');
</script>

<style>
  /* COD Form Styles */
  .dropx-cod-card {
    background: #ffffff;
    border: 2px solid #10b981;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    margin-top: 20px;
    box-sizing: border-box;
    width: 100%;
  }
  .dropx-cod-badge {
    background: #10b981;
    color: #111111;
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
  .dropx-input:focus, .dropx-select:focus { border-color: #10b981; background: #fff; }
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
    flex-direction: column;
    gap: 8px;
  }
  .dropx-submit-btn {
    background: #10b981;
    color: #111111;
    width: 100%;
    padding: 18px 20px;
    border-radius: 12px;
    font-weight: 900;
    font-size: 16px;
    border: none;
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.2s;
    box-shadow: 0 8px 22px rgba(16, 185, 129, 0.4);
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

  /* Bundles Cards */
  .dropx-bundle-card {
    border: 1.5px solid #e5e7eb;
    background: #ffffff;
    border-radius: 12px;
    padding: 14px 16px;
    cursor: pointer;
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.2s ease;
  }
  .dropx-bundle-card:hover { border-color: #10b981; }
  .dropx-bundle-card.active {
    border: 2px solid #10b981;
    background: #f0fdf4;
  }
  .dropx-bundle-badge {
    position: absolute;
    top: -10px;
    right: 14px;
    background: #000000;
    color: #ffffff;
    font-size: 10px;
    font-weight: 800;
    padding: 3px 10px;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .dropx-bundle-radio {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid #d1d5db;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .dropx-bundle-card.active .dropx-bundle-radio {
    border-color: #10b981;
  }
  .dropx-bundle-card.active .dropx-bundle-radio::after {
    content: '';
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
  }

  /* Confirmation Modal */
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

  /* Gallery Thumbnails */
  .dropx-thumb {
    cursor: pointer;
    transition: opacity 0.2s, border-color 0.2s;
  }
  .dropx-thumb:hover { opacity: 0.8; }

  /* ==========================================================================
     DROPX ADVANCED MOBILE RESPONSIVENESS & TOUCH OPTIMIZATION (max-width: 768px)
     ========================================================================== */
  @media (max-width: 768px) {
    /* Prevent iOS Safari from auto-zooming on inputs */
    input, select, textarea, .dropx-input, .dropx-select {
      font-size: 16px !important;
      -webkit-appearance: none;
    }

    html, body {
      overflow-x: hidden !important;
      max-width: 100vw !important;
    }

    #dropx-full-page-container {
      padding-bottom: 95px !important;
      overflow-x: hidden !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }

    /* Top Announcement Bar */
    #dropx-full-page-container > div:first-child {
      font-size: 11px !important;
      padding: 8px 10px !important;
      line-height: 1.35 !important;
      letter-spacing: 0.2px !important;
    }

    /* Top Header Bar */
    #dropx-full-page-container > div:nth-child(2) {
      padding: 12px 14px !important;
    }
    #dropx-full-page-container > div:nth-child(2) a {
      font-size: 20px !important;
    }

    /* Hero Section Spacing */
    #dropx-full-page-container [style*="max-width: 1200px"] {
      padding-left: 14px !important;
      padding-right: 14px !important;
      padding-top: 14px !important;
      padding-bottom: 24px !important;
      gap: 16px !important;
      display: flex !important;
      flex-direction: column !important;
    }

    /* Hero Gallery */
    #dropx-full-page-container [style*="flex: 1 1 500px"],
    #dropx-full-page-container [style*="flex: 1 1 400px"],
    #dropx-full-page-container [style*="flex: 1 1 45%"],
    #dropx-full-page-container [style*="flex: 1 1 40%"],
    #dropx-full-page-container [style*="flex: 1 1 50%"],
    #dropx-full-page-container [style*="flex: 1 1 30%"],
    #dropx-full-page-container [style*="flex: 1 1 20%"] {
      flex: 1 1 100% !important;
      min-width: 100% !important;
      width: 100% !important;
    }

    /* Main Product Image Container */
    #dropx-full-page-container [style*="aspect-ratio: 1/1"] {
      border-radius: 14px !important;
      background: #fafafa !important;
    }
    #dropx-full-page-container [style*="aspect-ratio: 1/1"] img {
      padding: 8px !important;
      max-height: 340px !important;
      object-fit: contain !important;
    }

    /* Horizontal Thumbnail Swipe Bar */
    #dropx-full-page-container [style*="grid-template-columns: 1fr 1fr"] {
      display: flex !important;
      flex-wrap: nowrap !important;
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
      gap: 8px !important;
      padding: 4px 2px 8px 2px !important;
      scrollbar-width: none !important;
    }
    #dropx-full-page-container [style*="grid-template-columns: 1fr 1fr"]::-webkit-scrollbar {
      display: none !important;
    }
    #dropx-full-page-container [style*="grid-template-columns: 1fr 1fr"] > div {
      width: 68px !important;
      height: 68px !important;
      min-width: 68px !important;
      max-width: 68px !important;
      border-radius: 10px !important;
      padding: 4px !important;
      flex-shrink: 0 !important;
    }

    /* Product Title */
    #dropx-full-page-container h1 {
      font-size: 21px !important;
      line-height: 1.25 !important;
      margin-bottom: 12px !important;
    }

    /* Price Displays */
    #dropx-price-display {
      font-size: 24px !important;
    }
    #dropx-oldprice-display {
      font-size: 17px !important;
    }
    #dropx-savings-display {
      font-size: 11px !important;
      padding: 4px 8px !important;
    }

    /* Bundles */
    .dropx-bundle-card {
      padding: 12px 14px !important;
      border-radius: 12px !important;
      gap: 10px !important;
    }
    .dropx-bundle-badge {
      font-size: 9px !important;
      padding: 2px 8px !important;
      top: -8px !important;
      right: 10px !important;
    }

    /* COD Form Card */
    .dropx-cod-card {
      padding: 16px 14px !important;
      border-radius: 14px !important;
      margin-top: 12px !important;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06) !important;
    }
    .dropx-cod-badge {
      font-size: 12px !important;
      padding: 9px 10px !important;
      border-radius: 8px !important;
      gap: 6px !important;
    }
    .dropx-form-group {
      margin-bottom: 12px !important;
    }
    .dropx-label {
      font-size: 13px !important;
      margin-bottom: 5px !important;
    }
    .dropx-input, .dropx-select {
      padding: 12px 12px !important;
      border-radius: 8px !important;
    }
    .dropx-phone-prefix {
      padding: 0 10px !important;
      font-size: 13px !important;
    }
    .dropx-payment-options {
      gap: 8px !important;
    }
    .dropx-payment-label {
      padding: 10px 8px !important;
      font-size: 12px !important;
      justify-content: center !important;
    }
    .dropx-summary-box {
      padding: 12px !important;
      margin: 12px 0 !important;
      border-radius: 10px !important;
    }
    .dropx-submit-btn {
      padding: 16px 14px !important;
      font-size: 15px !important;
      border-radius: 10px !important;
      letter-spacing: 0.3px !important;
    }
    .dropx-trust-grid {
      grid-template-columns: 1fr 1fr !important;
      gap: 8px !important;
      margin-top: 12px !important;
    }
    .dropx-trust-item {
      font-size: 11px !important;
    }

    /* Sections */
    #dropx-full-page-container h2 {
      font-size: 20px !important;
      line-height: 1.3 !important;
      margin-bottom: 18px !important;
      text-align: center !important;
    }
    #dropx-full-page-container p {
      font-size: 13px !important;
      line-height: 1.55 !important;
    }

    /* Confirmation Modal */
    .dropx-modal-content {
      padding: 22px 16px !important;
      border-radius: 16px !important;
      max-width: 92% !important;
    }
    .dropx-whatsapp-btn {
      padding: 14px 18px !important;
      font-size: 15px !important;
    }
  }

  /* ==========================================================================
     STICKY BOTTOM ORDER BAR (MOBILE ONLY)
     ========================================================================== */
  #dropx-sticky-mobile-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #ffffff;
    border-top: 1.5px solid #10b981;
    box-shadow: 0 -4px 22px rgba(0,0,0,0.14);
    padding: 10px 14px;
    display: none;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    z-index: 99999;
    box-sizing: border-box;
    transition: transform 0.25s ease, opacity 0.25s ease;
  }
  @media (min-width: 992px) {
    #dropx-sticky-mobile-bar {
      display: none !important;
    }
  }
  .dropx-sticky-price-wrap {
    display: flex;
    flex-direction: column;
    line-height: 1.15;
  }
  .dropx-sticky-price {
    font-size: 18px;
    font-weight: 900;
    color: #10b981;
    white-space: nowrap;
  }
  .dropx-sticky-badge {
    font-size: 11px;
    font-weight: 700;
    color: #15803d;
    white-space: nowrap;
  }
  .dropx-sticky-cta-btn {
    flex: 1;
    background: #10b981;
    color: #111111;
    border: none;
    border-radius: 10px;
    padding: 13px 16px;
    font-size: 14px;
    font-weight: 900;
    cursor: pointer;
    text-align: center;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.45);
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    animation: dropxPulse 2s infinite;
  }
  .dropx-sticky-cta-btn:active {
    transform: scale(0.97);
  }
</style>

<!-- COD Form Container -->
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
        <label class="dropx-payment-label active" id="dropx-pay-cash-lbl" onclick="window.dropxSelectPayment('cash')">
          <input type="radio" name="dropx_pay_method" value="Espèces à la livraison" checked style="accent-color: #10b981;" />
          <span>💵 Espèces</span>
        </label>
        <label class="dropx-payment-label" id="dropx-pay-wave-lbl" onclick="window.dropxSelectPayment('wave')">
          <input type="radio" name="dropx_pay_method" value="Wave / Orange Money" style="accent-color: #1d4ed8;" />
          <span>📱 Wave / OM</span>
        </label>
      </div>
    </div>

    <div class="dropx-summary-box">
      <div style="display: flex; justify-content: space-between; width: 100%; font-size: 13px; color: #4b5563;">
        <span id="dropx-cod-pack-label">Articles (1 Unité) :</span>
        <span id="dropx-cod-subtotal-display" style="font-weight: 700; color: #111;">13 500 FCFA</span>
      </div>
      <div style="display: flex; justify-content: space-between; width: 100%; font-size: 13px; color: #4b5563;">
        <span>Frais de livraison (<span id="dropx-cod-zone-name">Dakar Centre</span>) :</span>
        <span id="dropx-cod-delivery-display" style="font-weight: 800; color: #16a34a;"><s style="color: #9ca3af; font-weight: normal; margin-right: 4px;">2 000 FCFA</s> GRATUITE 🎉</span>
      </div>
      <div id="dropx-wave-badge-note" style="display: none; justify-content: space-between; width: 100%; font-size: 12px; color: #1d4ed8; background: #eff6ff; padding: 4px 8px; border-radius: 6px;">
        <span>📱 Paiement Wave direct :</span>
        <span id="dropx-cod-wave-fee">1% sécurisé (0 FCFA)</span>
      </div>
      <div style="border-top: 1px dashed #cbd5e1; padding-top: 8px; margin-top: 4px; display: flex; justify-content: space-between; width: 100%; align-items: center;">
        <div style="font-size: 13px; color: #111; font-weight: 800;">TOTAL À RÉGLER :</div>
        <div id="dropx-cod-total-display" style="font-size: 22px; font-weight: 900; color: #10b981;">13 500 FCFA</div>
      </div>
    </div>

    <button type="button" id="dropx-cod-submit-btn" onclick="window.dropxSubmitOrder()" class="dropx-submit-btn">
      <span>COMMANDER (13 500 FCFA - LIVRAISON GRATUITE) 🚚</span>
    </button>

    <div class="dropx-trust-grid">
      <div class="dropx-trust-item"><span>📦</span> <b>Vérifiez avant de payer</b></div>
      <div class="dropx-trust-item"><span>🚚</span> <b>Livraison Gratuite 24h/48h</b></div>
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
      <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;">
        <img id="dropx-modal-image" src="" alt="Produit" style="width: 56px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; display: none;" />
        <div style="flex: 1;">
          <div id="dropx-modal-product" style="font-weight: 800; font-size: 14px; color: #111;">--</div>
          <div id="dropx-modal-total" style="font-weight: 800; color: #10b981; font-size: 14px; margin-top: 2px;">-- FCFA</div>
        </div>
      </div>
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

<!-- Sticky Bottom Order Bar for Mobile -->
<div id="dropx-sticky-mobile-bar">
  <div class="dropx-sticky-price-wrap">
    <div class="dropx-sticky-price" id="dropx-sticky-price-text">13 500 FCFA</div>
    <div class="dropx-sticky-badge">🚚 Livraison Gratuite</div>
  </div>
  <button type="button" class="dropx-sticky-cta-btn" onclick="window.dropxScrollToOrderForm()">
    <span>COMMANDER EN 1 CLIC ⚡</span>
  </button>
</div>

<script>
(function() {
  var productTitle = {{ product.title | json }};
  var productVariants = {{ product.variants | json }} || [];
  var productFeaturedImage = {{ product.featured_image | image_url: width: 800 | json }} || '';
  if (productFeaturedImage && productFeaturedImage.startsWith('//')) {
    productFeaturedImage = 'https:' + productFeaturedImage;
  }
  var productUrl = {{ shop.url | append: product.url | json }} || (window.location.origin + window.location.pathname);
  if (productUrl && productUrl.startsWith('//')) {
    productUrl = 'https:' + productUrl;
  }
  var shopDomain = window.location.hostname;
  var apiBaseUrl = "https://dropshipping-ten-topaz.vercel.app";

  var basePrice = 13500;
  var comparePrice = 20000;

  var containerEl = document.getElementById('dropx-full-page-container');
  if (containerEl) {
    var bp = parseFloat(containerEl.getAttribute('data-base-price'));
    var cp = parseFloat(containerEl.getAttribute('data-safe-compare'));
    if (!isNaN(bp) && bp > 0) basePrice = bp;
    if (!isNaN(cp) && cp > 0) comparePrice = cp;
  }

  function formatFCFA(val) {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(Math.round(val)) + ' FCFA';
  }

  var bundles = [
    { title: "1 Unité", subtitle: "Idéal pour tester", tag: "", price: basePrice, oldPrice: comparePrice, variantId: productVariants[0] ? productVariants[0].id : null },
    { title: "2 Achetés (-15%)", subtitle: "ÉCONOMISEZ 15% IMMÉDIATEMENT", tag: "Le plus populaire", price: Math.round(basePrice * 2 * 0.85 / 100) * 100, oldPrice: comparePrice * 2, variantId: productVariants[1] ? productVariants[1].id : (productVariants[0] ? productVariants[0].id : null) },
    { title: "3 Achetés (-25%)", subtitle: "MEILLEURE OFFRE - ÉCONOMISEZ 25%", tag: "Meilleure vente", price: Math.round(basePrice * 3 * 0.75 / 100) * 100, oldPrice: comparePrice * 3, variantId: productVariants[2] ? productVariants[2].id : (productVariants[0] ? productVariants[0].id : null) }
  ];

  var selectedBundleIdx = 0;

  var deliveryZoneFees = {
    "Dakar Centre": 1500,
    "Dakar Ouest": 2000,
    "Dakar Nord": 2000,
    "Dakar Banlieue": 2500,
    "Rufisque": 3000,
    "Thiès": 3500,
    "Touba": 4000,
    "Saint-Louis": 4500,
    "Kaolack": 4500,
    "Ziguinchor": 5000,
    "Autre": 4000
  };

  function getDeliveryFee(cityName) {
    var name = String(cityName || '');
    for (var k in deliveryZoneFees) {
      if (name.indexOf(k) !== -1) return deliveryZoneFees[k];
    }
    return 2000;
  }

  window.dropxSelectPayment = function(type) {
    var cashLbl = document.getElementById('dropx-pay-cash-lbl');
    var waveLbl = document.getElementById('dropx-pay-wave-lbl');
    var cashInput = cashLbl ? cashLbl.querySelector('input') : null;
    var waveInput = waveLbl ? waveLbl.querySelector('input') : null;

    if (type === 'cash') {
      if (cashLbl) cashLbl.classList.add('active');
      if (waveLbl) waveLbl.classList.remove('active');
      if (cashInput) cashInput.checked = true;
    } else {
      if (waveLbl) waveLbl.classList.add('active');
      if (cashLbl) cashLbl.classList.remove('active');
      if (waveInput) waveInput.checked = true;
    }
    window.dropxUpdateTotals();
  };

  window.dropxSelectBundle = function(idx) {
    selectedBundleIdx = idx;
    var activeB = bundles[idx];

    // Update active class on bundle cards
    document.querySelectorAll('.dropx-bundle-card').forEach(function(card, i) {
      if (i === idx) card.classList.add('active');
      else card.classList.remove('active');
    });

    // Update top price displays
    var pEl = document.getElementById('dropx-price-display');
    if (pEl) pEl.innerText = formatFCFA(activeB.price);

    var opEl = document.getElementById('dropx-oldprice-display');
    if (opEl) opEl.innerText = formatFCFA(activeB.oldPrice);

    var savEl = document.getElementById('dropx-savings-display');
    if (savEl && activeB.oldPrice > activeB.price) {
      var pct = Math.round((1 - activeB.price / activeB.oldPrice) * 100);
      savEl.innerText = 'Économisez ' + pct + '%';
    }

    // Update sticky mobile bar price
    var stickyPriceEl = document.getElementById('dropx-sticky-price-text');
    if (stickyPriceEl) {
      stickyPriceEl.innerText = formatFCFA(activeB.price);
    }

    window.dropxUpdateTotals();
  };

  window.dropxUpdateTotals = function() {
    var activeB = bundles[selectedBundleIdx];
    var subtotal = activeB.price;

    var citySelect = document.getElementById('dropx-cod-city');
    var selectedCity = citySelect ? citySelect.value : 'Dakar Centre';
    var baseZoneFee = getDeliveryFee(selectedCity);
    var total = subtotal; // Free shipping

    var packLabelEl = document.getElementById('dropx-cod-pack-label');
    var subtotalEl = document.getElementById('dropx-cod-subtotal-display');
    var zoneNameEl = document.getElementById('dropx-cod-zone-name');
    var deliveryEl = document.getElementById('dropx-cod-delivery-display');
    var totalEl = document.getElementById('dropx-cod-total-display');
    var submitBtn = document.getElementById('dropx-cod-submit-btn');
    var waveBadge = document.getElementById('dropx-wave-badge-note');

    if (packLabelEl) packLabelEl.innerText = "Articles (" + activeB.title + ") :";
    if (subtotalEl) subtotalEl.innerText = formatFCFA(subtotal);
    if (zoneNameEl) zoneNameEl.innerText = selectedCity.split('-')[0].split('(')[0].trim();
    if (deliveryEl) deliveryEl.innerHTML = '<s style="color:#9ca3af;font-weight:normal;margin-right:4px;">' + formatFCFA(baseZoneFee) + '</s> <span style="color:#16a34a;font-weight:800;">GRATUITE (0 FCFA) 🎉</span>';
    if (totalEl) totalEl.innerText = formatFCFA(total);

    var isWave = document.querySelector('input[name="dropx_pay_method"]:checked')?.value?.includes('Wave');
    if (waveBadge) waveBadge.style.display = isWave ? 'flex' : 'none';

    if (submitBtn) {
      submitBtn.innerHTML = '<span>COMMANDER (' + formatFCFA(total) + ' - LIVRAISON GRATUITE) 🚚</span>';
    }
  };

  window.dropxSubmitOrder = async function() {
    var nameEl = document.getElementById('dropx-cod-name');
    var phoneEl = document.getElementById('dropx-cod-phone');
    var cityEl = document.getElementById('dropx-cod-city');
    var addrEl = document.getElementById('dropx-cod-address');
    var submitBtn = document.getElementById('dropx-cod-submit-btn');

    var name = (nameEl ? nameEl.value : '').trim();
    var phone = (phoneEl ? phoneEl.value : '').trim();
    var city = (cityEl ? cityEl.value : 'Dakar Centre').trim();
    var address = (addrEl ? addrEl.value : '').trim();

    var methodEl = document.querySelector('input[name="dropx_pay_method"]:checked');
    var paymentMethod = methodEl ? methodEl.value : 'Espèces à la livraison';

    if (!name) {
      alert('Veuillez entrer votre prénom et nom.');
      if (nameEl) nameEl.focus();
      return;
    }
    var cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 8) {
      alert('Veuillez entrer un numéro de téléphone valide (ex: 77 123 45 67).');
      if (phoneEl) phoneEl.focus();
      return;
    }
    if (!address) {
      alert('Veuillez indiquer votre quartier ou adresse de livraison.');
      if (addrEl) addrEl.focus();
      return;
    }

    var fullPhone = '+221 ' + (cleanPhone.startsWith('221') ? cleanPhone.slice(3) : cleanPhone);
    var activeB = bundles[selectedBundleIdx];
    var totalAmount = activeB.price;
    var totalFormatted = formatFCFA(totalAmount);

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Validation en cours... ⏳</span>';
    }

    try {
      if (typeof fbq === 'function') {
        fbq('track', 'Purchase', {
          value: totalAmount,
          currency: 'XOF',
          content_name: productTitle,
          content_type: 'product',
          num_items: 1
        });
      }
    } catch(e) {}

    var waMsg = "Bonjour ShopX ! Je viens de passer une commande pour : " + productTitle + " (" + activeB.title + ").\\n\\n" +
                (productUrl ? "Lien de l'article : " + productUrl + "\\n\\n" : "") +
                "Montant total à régler : " + totalFormatted + "\\n" +
                "Frais de livraison : GRATUITE (Offerte)\\n" +
                "Nom : " + name + "\\n" +
                "Téléphone : " + fullPhone + "\\n" +
                "Ville / Quartier : " + city + " - " + address + "\\n" +
                "Mode de paiement : " + paymentMethod + ".\\n\\n" +
                "Merci de me confirmer la livraison !";

    var waUrl = "https://wa.me/221775447866?text=" + encodeURIComponent(waMsg);

    try {
      var postData = {
        shopDomain: shopDomain,
        customerName: name,
        customerPhone: fullPhone,
        customerCity: city,
        customerAddress: address,
        paymentMethod: paymentMethod,
        productTitle: productTitle,
        productUrl: productUrl,
        productImageUrl: productFeaturedImage,
        bundleTitle: activeB.title,
        variantId: activeB.variantId,
        quantity: 1,
        unitPrice: activeB.price,
        deliveryFee: 0,
        totalPrice: totalAmount,
        currency: 'XOF'
      };

      var response = await fetch(apiBaseUrl + '/api/orders/cod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      var data = await response.json();
      if (data && data.whatsappUrl) {
        waUrl = data.whatsappUrl;
      }
    } catch(err) {
      console.warn("DropX API order sync error:", err);
    }

    var modalImg = document.getElementById('dropx-modal-image');
    if (modalImg && productFeaturedImage) {
      modalImg.src = productFeaturedImage;
      modalImg.style.display = 'block';
    }
    var modalProd = document.getElementById('dropx-modal-product');
    if (modalProd) modalProd.innerText = productTitle + " (" + activeB.title + ")";
    var modalTot = document.getElementById('dropx-modal-total');
    if (modalTot) modalTot.innerText = totalFormatted;
    var modalAddr = document.getElementById('dropx-modal-address');
    if (modalAddr) modalAddr.innerText = address + ", " + city;
    var modalPay = document.getElementById('dropx-modal-payment');
    if (modalPay) modalPay.innerText = paymentMethod;

    var waLink = document.getElementById('dropx-modal-wa-link');
    if (waLink) waLink.href = waUrl;

    var modal = document.getElementById('dropx-confirmation-modal');
    if (modal) modal.style.display = 'flex';

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>COMMANDE VALIDÉE ! ✓</span>';
    }
  };

  // ==========================================================================
  // DROPX LANDING PAGE TAKEOVER & MOUNTING
  // ==========================================================================
  function initDropxPage() {
    var dropxContainer = document.getElementById('dropx-full-page-container');
    if (!dropxContainer) return false;
    if (dropxContainer.getAttribute('data-mounted') === 'true') return true;

    var mainEl = document.getElementById('MainContent') || document.querySelector('main');
    if (!mainEl) return false;

    // 1. Unhide dropxContainer and move to top of mainEl
    dropxContainer.style.display = 'block';
    dropxContainer.setAttribute('data-mounted', 'true');
    mainEl.insertBefore(dropxContainer, mainEl.firstChild);

    // 2. Hide ALL other children of mainEl (eliminates default product section, Add to Cart, email signup, etc.)
    Array.from(mainEl.children).forEach(function(child) {
      if (child !== dropxContainer) {
        child.style.display = 'none';
        child.setAttribute('style', 'display: none !important;');
      }
    });

    // 3. Mark body as dropx-product-active
    document.body.classList.add('dropx-product-active');

    // 3. Render Bundles in #dropx-bundles-container
    var bundlesContainer = document.getElementById('dropx-bundles-container');
    if (bundlesContainer) {
      bundlesContainer.innerHTML = '';
      bundles.forEach(function(b, idx) {
        var card = document.createElement('div');
        card.className = 'dropx-bundle-card' + (idx === selectedBundleIdx ? ' active' : '');
        card.onclick = function() { window.dropxSelectBundle(idx); };

        var badgeHtml = b.tag ? '<span class="dropx-bundle-badge">' + b.tag + '</span>' : '';
        card.innerHTML = 
          badgeHtml +
          '<div class="dropx-bundle-radio"></div>' +
          '<div style="flex: 1; display: flex; justify-content: space-between; align-items: center;">' +
            '<div>' +
              '<div style="font-weight: 800; font-size: 15px; color: #111;">' + b.title + '</div>' +
              '<div style="font-size: 12px; color: #6b7280; margin-top: 2px;">' + b.subtitle + '</div>' +
            '</div>' +
            '<div style="text-align: right;">' +
              '<div style="font-weight: 800; font-size: 15px; color: #10b981;">' + formatFCFA(b.price) + '</div>' +
              (b.oldPrice ? '<div style="font-size: 12px; color: #9ca3af; text-decoration: line-through;">' + formatFCFA(b.oldPrice) + '</div>' : '') +
            '</div>' +
          '</div>';

        bundlesContainer.appendChild(card);
      });
    }

    // 4. Mount COD Form into #dropx-form-placeholder
    var formContainer = document.getElementById('dropx-liquid-form-container');
    var formPlaceholder = document.getElementById('dropx-form-placeholder');
    if (formContainer && formPlaceholder) {
      formPlaceholder.appendChild(formContainer);
      formContainer.style.display = 'block';
    }

    // 5. Interactive Gallery Click & Thumbnail Row
    var galleryCol = dropxContainer.querySelector('[style*="flex: 1 1 500px"]') || dropxContainer.querySelector('[style*="flex: 1 1 45%"]');
    var mainImg = galleryCol ? galleryCol.querySelector('img') : dropxContainer.querySelector('img');
    var thumbsGrid = galleryCol ? galleryCol.children[1] : dropxContainer.querySelector('[style*="grid-template-columns"]');

    if (thumbsGrid) {
      thumbsGrid.classList.add('dropx-thumbs-row');
      var thumbDivs = Array.from(thumbsGrid.children);
      thumbDivs.forEach(function(thumbDiv, idx) {
        var tImg = thumbDiv.querySelector('img');
        if (!tImg) return;
        thumbDiv.style.cursor = 'pointer';
        thumbDiv.classList.add('dropx-thumb-item');
        if (idx === 0) thumbDiv.classList.add('active');

        thumbDiv.addEventListener('click', function() {
          if (mainImg) {
            mainImg.style.opacity = '0.35';
            mainImg.src = tImg.src;
            setTimeout(function() { mainImg.style.opacity = '1'; }, 150);
          }
          thumbDivs.forEach(function(d) { d.classList.remove('active'); });
          thumbDiv.classList.add('active');
        });
      });
    }

    // 6. City Select change listener
    var citySelect = document.getElementById('dropx-cod-city');
    if (citySelect) {
      citySelect.addEventListener('change', window.dropxUpdateTotals);
    }

    // 7. Scroll to Order Form handler
    window.dropxScrollToOrderForm = function() {
      var bar = document.getElementById('dropx-sticky-mobile-bar');
      if (bar) bar.style.display = 'none';

      var formEl = document.getElementById('dropx-cod-name') || document.getElementById('dropx-liquid-form-container') || document.getElementById('dropx-form-placeholder');
      if (formEl) {
        var rect = formEl.getBoundingClientRect();
        var targetY = (window.pageYOffset || document.documentElement.scrollTop || 0) + rect.top - 80;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
        try {
          formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (e) {}
        setTimeout(function() {
          var nameInput = document.getElementById('dropx-cod-name');
          if (nameInput) {
            try { nameInput.focus(); } catch (e) {}
          }
        }, 400);
      }
    };

    // 8. Sticky Mobile Bar Scroll Monitor
    function initStickyBarMonitor() {
      var bar = document.getElementById('dropx-sticky-mobile-bar');
      if (!bar) return;

      function checkVisibility() {
        if (window.innerWidth > 991) {
          bar.style.display = 'none';
          return;
        }
        var formCard = document.querySelector('.dropx-cod-card');
        var formRect = formCard ? formCard.getBoundingClientRect() : null;
        var scrollY = window.scrollY || window.pageYOffset;
        var isFormOnScreen = formRect && (formRect.top < window.innerHeight && formRect.bottom > 40);
        
        if (scrollY > 280 && !isFormOnScreen) {
          bar.style.display = 'flex';
        } else {
          bar.style.display = 'none';
        }
      }

      window.addEventListener('scroll', checkVisibility, { passive: true });
      window.addEventListener('resize', checkVisibility, { passive: true });
      checkVisibility();
    }
    initStickyBarMonitor();

    // 9. Initial update
    window.dropxSelectBundle(0);
    return true;
  }

  var attempts = 0;
  var interval = setInterval(function() {
    if (initDropxPage() || attempts > 25) {
      clearInterval(interval);
    }
    attempts++;
  }, 80);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDropxPage);
  } else {
    initDropxPage();
  }
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
