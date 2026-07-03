import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

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
    let shopUrl = creds.shopUrl || "";
    // Pour le Dev Dashboard on utilise accessToken (shpat_), sinon on fallback sur clientSecret (anciens comptes)
    const adminToken = creds.accessToken || creds.clientSecret;

    if (!shopUrl || !adminToken) {
      return NextResponse.json({ error: "Identifiants Shopify incomplets. Veuillez vérifier vos paramètres." }, { status: 400 });
    }
    
    // Clean shopUrl format (remove https://, trailing slashes, and spaces)
    shopUrl = shopUrl.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Récupérer le produit à envoyer
    const body = await req.json();
    const { product, currency } = body;

    // Smart Bundles Variants
    const basePrice = parseFloat(product.price) || 0;
    const baseComparePrice = parseFloat(product.compareAtPrice) || 0;

    const safeCompare = baseComparePrice > basePrice ? baseComparePrice : basePrice * 2.8;

    let shopifyOptions = [{ name: "Offres Limitées" }];
    const bundleOffers = [
      { title: "Pack Découverte (1 Unité)", p: basePrice, cp: safeCompare },
      { title: "2 Achetés = 1 OFFERT", p: basePrice * 2, cp: safeCompare * 3 },
      { title: "3 Achetés = 2 OFFERTS", p: basePrice * 3, cp: safeCompare * 5 }
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

    // HTML Injection - Full Landing Page (Dropmagic Style)
    const formattedDesc = (product.description || '').replace(/\n/g, '<br/>');
    const lp = product.landingPage || {};
    const features = lp.features || [];
    const howToUse = lp.howToUse || [];
    const faq = lp.faq || [];
    const reviews = lp.reviews || [];
    const images = product.images || [];

    // Build features HTML
    const featuresHtml = features.length > 0 ? `
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

    // Build How To Use HTML
    const howToUseHtml = howToUse.length > 0 ? `
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

    // Build Reviews HTML
    const reviewsHtml = reviews.length > 0 ? `
      <div style="padding:40px 0;">
        <p style="text-align:center;font-size:12px;color:#c85a7c;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">⭐⭐⭐⭐⭐ Avis de nos clients vérifiés</p>
        <h2 style="text-align:center;font-size:22px;font-weight:800;color:#111;margin-bottom:30px;">Nos clients l'adorent!</h2>
        <div style="display:flex;flex-wrap:wrap;gap:16px;">
          ${reviews.map(r => `
            <div style="flex:1 1 45%;min-width:240px;background:#fff;border:1px solid #eee;border-radius:12px;padding:20px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <strong style="font-size:14px;color:#111;">${r.name}</strong>
                <span style="font-size:12px;color:#16a34a;">✅ Achat vérifié</span>
              </div>
              <div style="color:#f59e0b;font-size:14px;margin-bottom:8px;">${'⭐'.repeat(r.rating || 5)}</div>
              <p style="margin:0;font-size:13px;color:#444;line-height:1.5;">${r.text}</p>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    // Build FAQ HTML
    const faqHtml = faq.length > 0 ? `
      <div style="padding:40px 0;">
        <h2 style="font-size:22px;font-weight:800;color:#111;margin-bottom:24px;">Vos Questions, Nos Réponses.</h2>
        ${faq.map(f => `
          <details style="border:1px solid #eee;border-radius:8px;padding:16px;margin-bottom:10px;cursor:pointer;">
            <summary style="font-weight:600;font-size:14px;color:#111;">${f.question}</summary>
            <p style="margin:12px 0 0;font-size:13px;color:#555;line-height:1.6;">${f.answer}</p>
          </details>
        `).join('')}
      </div>
    ` : '';

    // Trust Footer
    const trustFooterHtml = `
      <div style="display:flex;flex-wrap:wrap;gap:20px;padding:30px 0;border-top:1px solid #eee;margin-top:30px;">
        <div style="flex:1 1 22%;min-width:120px;text-align:center;">
          <div style="font-size:24px;margin-bottom:6px;">🛡️</div>
          <h4 style="margin:0;font-size:12px;font-weight:700;">Satisfait ou Remboursé</h4>
          <p style="margin:4px 0 0;font-size:11px;color:#888;">Garantie 30 jours</p>
        </div>
        <div style="flex:1 1 22%;min-width:120px;text-align:center;">
          <div style="font-size:24px;margin-bottom:6px;">🚚</div>
          <h4 style="margin:0;font-size:12px;font-weight:700;">Livraison Rapide</h4>
          <p style="margin:4px 0 0;font-size:11px;color:#888;">Expédié en 24/48h</p>
        </div>
        <div style="flex:1 1 22%;min-width:120px;text-align:center;">
          <div style="font-size:24px;margin-bottom:6px;">🔒</div>
          <h4 style="margin:0;font-size:12px;font-weight:700;">Paiement Sécurisé</h4>
          <p style="margin:4px 0 0;font-size:11px;color:#888;">Cryptage SSL 256-bit</p>
        </div>
        <div style="flex:1 1 22%;min-width:120px;text-align:center;">
          <div style="font-size:24px;margin-bottom:6px;">💬</div>
          <h4 style="margin:0;font-size:12px;font-weight:700;">Support Client</h4>
          <p style="margin:4px 0 0;font-size:11px;color:#888;">Réponse sous 24h</p>
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
      <div id="dropx-full-page-container" data-base-price="${basePrice}" data-safe-compare="${safeCompare}" style="display: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #fff; color: #111; min-height: 100vh; padding-bottom: 50px;">
        
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
            <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Haute Qualité</p>
            <h1 style="font-size: 32px; font-weight: 800; line-height: 1.2; margin-bottom: 16px; color: #111;">${product.title}</h1>
            
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; background: #fce7f3; padding: 6px 16px; border-radius: 8px; font-size: 24px; font-weight: bold; color: #c85a7c;">
                <span id="dropx-price-display"></span>
              </div>
              <div style="display: flex; align-items: center; background: #f9f9f9; padding: 6px 16px; border-radius: 8px; font-size: 18px; color: #999; text-decoration: line-through;">
                <span id="dropx-oldprice-display"></span>
              </div>
              <span id="dropx-savings-display" style="background: #fce7f3; color: #c85a7c; padding: 6px 10px; border-radius: 6px; font-size: 13px; font-weight: bold;"></span>
            </div>

            <div style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 32px;">
              ${formattedDesc}
            </div>

            <div style="margin-bottom: 24px;">
              <h3 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; text-align: center; color: #111;">BUNDLE & ÉCONOMIES</h3>
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

        <!-- Extra Sections (Full Width) -->
        <div style="max-width: 1000px; margin: 0 auto; padding: 20px 5%;">
          ${featuresHtml}
          ${howToUseHtml}
          ${reviewsHtml}
          ${faqHtml}
        </div>
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
        
        // 2. Create the Snippet
        const snippetContent = `
{% if template contains 'product' %}
<style>
  .dropx-shopify-payment-btn { margin-top: 10px; width: 100%; }
  .dropx-shopify-payment-btn .shopify-payment-button { width: 100%; }
  .dropx-option-btn { display: inline-block; padding: 8px 16px; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; color: #333; background: #fff; transition: all 0.2s; margin: 4px; }
  .dropx-option-btn:hover { border-color: #111; }
  .dropx-option-btn.active { border-color: #111; background: #111; color: #fff; }
</style>
<div id="dropx-liquid-form-container" style="display:none; width: 100%;">
  {% form 'product', product %}
    <input type="hidden" name="id" id="dropx-hidden-variant-id" value="{{ product.variants.first.id }}">
    <button type="submit" name="add" id="dropx-native-add" style="background: #111; color: #fff; width: 100%; padding: 18px; border-radius: 12px; font-weight: bold; font-size: 16px; border: none; cursor: pointer; transition: opacity 0.2s;">
      Ajouter au Panier
    </button>
    <div class="dropx-shopify-payment-btn">
      {{ form | payment_button }}
    </div>
  {% endform %}
</div>
<script>
(function() {
  var productVariants = {{ product.variants | json }};
  var productOptions = {{ product.options_with_values | json }};
  
  function attemptDropxOverride() {
    try {
      var dropxUI = document.getElementById('dropx-full-page-container');
      if(!dropxUI) return false;
      if(dropxUI.getAttribute('data-injected') === 'true') return true;

      var mainContainer = document.querySelector('main') || document.querySelector('#MainContent') || document.querySelector('.main-content');
      if(!mainContainer) return false;

      var baseP = parseFloat(dropxUI.getAttribute('data-base-price')) || 0;
      var safeC = parseFloat(dropxUI.getAttribute('data-safe-compare')) || 0;
      var currencyStr = (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || "USD";

      var bundlesData = [
        { title: "Pack D\\u00e9couverte (1 Unit\\u00e9)", tag: "", price: baseP, oldPrice: safeC },
        { title: "2 Achet\\u00e9s = 1 OFFERT", tag: "Le plus populaire", price: baseP * 2, oldPrice: safeC * 3 },
        { title: "3 Achet\\u00e9s = 2 OFFERTS", tag: "Meilleure vente", price: baseP * 3, oldPrice: safeC * 5 }
      ];

      function formatPrice(price) {
        if (currencyStr === 'XOF' || currencyStr === 'FCFA') {
          return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(price).replace('XOF', 'FCFA');
        }
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currencyStr }).format(price);
      }

      var selectedBundleIndex = 0;
      
      var extraOptions = [];
      var selectedOptions = {};
      if (productOptions && productOptions.length > 0) {
        productOptions.forEach(function(opt) {
          if (opt.name !== 'Offres Limit\\u00e9es') {
            extraOptions.push({ name: opt.name, values: opt.values });
            selectedOptions[opt.name] = opt.values[0];
          }
        });
      }

      function findVariantId() {
        var bundleTitle = bundlesData[selectedBundleIndex].title;
        var match = productVariants.find(function(v) {
          if (!v.options || !v.options.includes(bundleTitle)) return false;
          for (var optName in selectedOptions) {
            if (!v.options.includes(selectedOptions[optName])) return false;
          }
          return true;
        });
        return match ? match.id : (productVariants[0] ? productVariants[0].id : null);
      }

      function updateVariantId() {
        var vid = findVariantId();
        var hiddenInput = document.getElementById('dropx-hidden-variant-id');
        if (hiddenInput && vid) hiddenInput.value = vid;
      }

      mainContainer.innerHTML = '';
      dropxUI.style.display = 'block';
      dropxUI.setAttribute('data-injected', 'true');
      mainContainer.appendChild(dropxUI);

      var placeholder = document.getElementById('dropx-form-placeholder');
      var liquidForm = document.getElementById('dropx-liquid-form-container');
      if(placeholder && liquidForm) {
         placeholder.appendChild(liquidForm);
         liquidForm.style.display = 'block';
      }

      function renderOptions() {
        var optContainer = document.getElementById('dropx-options-container');
        if (!optContainer) {
          optContainer = document.createElement('div');
          optContainer.id = 'dropx-options-container';
          optContainer.style.marginBottom = '20px';
          var bundlesContainer = document.getElementById('dropx-bundles-container');
          if (bundlesContainer && bundlesContainer.parentNode) {
            bundlesContainer.parentNode.insertBefore(optContainer, bundlesContainer);
          }
        }
        optContainer.innerHTML = '';

        extraOptions.forEach(function(opt) {
          var label = document.createElement('div');
          label.style.fontWeight = '600';
          label.style.fontSize = '13px';
          label.style.color = '#111';
          label.style.marginBottom = '8px';
          label.style.marginTop = '12px';
          label.innerText = opt.name + ' : ' + selectedOptions[opt.name];
          optContainer.appendChild(label);

          var row = document.createElement('div');
          row.style.display = 'flex';
          row.style.flexWrap = 'wrap';
          row.style.gap = '0px';

          opt.values.forEach(function(val) {
            var btn = document.createElement('span');
            btn.className = 'dropx-option-btn' + (selectedOptions[opt.name] === val ? ' active' : '');
            btn.innerText = val;
            btn.onclick = function() {
              selectedOptions[opt.name] = val;
              renderOptions();
              updateVariantId();
            };
            row.appendChild(btn);
          });

          optContainer.appendChild(row);
        });
      }

      function renderBundles() {
        var container = document.getElementById('dropx-bundles-container');
        if(!container) return;
        container.innerHTML = '';
        
        var activeBundle = bundlesData[selectedBundleIndex];
        if(activeBundle) {
          var priceEl = document.getElementById('dropx-price-display');
          if(priceEl) priceEl.innerText = formatPrice(activeBundle.price);
          var oldPriceEl = document.getElementById('dropx-oldprice-display');
          if(oldPriceEl) oldPriceEl.innerText = formatPrice(activeBundle.oldPrice);
          var savingsEl = document.getElementById('dropx-savings-display');
          if(savingsEl) {
             var savingPct = activeBundle.oldPrice > 0 ? Math.round((1 - activeBundle.price / activeBundle.oldPrice) * 100) : 0;
             savingsEl.innerText = '\\u00c9conomisez ' + (savingPct || 0) + '%';
          }
        }

        bundlesData.forEach(function(b, index) {
          var isSelected = (index === selectedBundleIndex);
          var box = document.createElement('div');
          box.style.border = isSelected ? '2px solid #16a34a' : '1px solid #eaeaea';
          box.style.background = isSelected ? '#fdf2f8' : '#fff';
          box.style.borderRadius = '8px';
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
            tag.style.background = '#c85a7c';
            tag.style.color = '#fff';
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
          radioContainer.style.border = isSelected ? '2px solid #111' : '1px solid #ccc';
          radioContainer.style.display = 'flex';
          radioContainer.style.alignItems = 'center';
          radioContainer.style.justifyContent = 'center';
          if(isSelected) {
             var dot = document.createElement('div');
             dot.style.width = '8px';
             dot.style.height = '8px';
             dot.style.background = '#111';
             dot.style.borderRadius = '50%';
             radioContainer.appendChild(dot);
          }
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
          titleTxt.style.color = '#111';
          var subtitleTxt = document.createElement('div');
          subtitleTxt.style.fontSize = '12px';
          subtitleTxt.style.color = '#666';
          var saveP = b.oldPrice > 0 ? Math.round((1 - b.price / b.oldPrice) * 100) : 0;
          if(index === 0) subtitleTxt.innerText = '\\u00c9CONOMISEZ ' + saveP + '%';
          else if(index === 1) subtitleTxt.innerText = 'VOUS RECEVEZ 3 UNIT\\u00c9S AU TOTAL !';
          else subtitleTxt.innerText = 'VOUS RECEVEZ 5 UNIT\\u00c9S AU TOTAL !';
          t1.appendChild(titleTxt);
          t1.appendChild(subtitleTxt);

          var t2 = document.createElement('div');
          t2.style.textAlign = 'right';
          var p1 = document.createElement('div');
          p1.innerText = formatPrice(b.price);
          p1.style.fontWeight = '800';
          p1.style.fontSize = '15px';
          p1.style.color = '#111';
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
            updateVariantId();
          };

          container.appendChild(box);
        });
      }

      if (extraOptions.length > 0) renderOptions();
      renderBundles();
      updateVariantId();

      var nativeBtn = document.getElementById('dropx-native-add');
      if(nativeBtn) {
         nativeBtn.onclick = function(e) {
            var vid = findVariantId();
            if(!vid) {
               e.preventDefault();
               alert('Erreur: Variante introuvable ou produit non disponible.');
            }
         }
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
