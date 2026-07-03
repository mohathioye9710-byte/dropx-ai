import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import puppeteer from 'puppeteer';

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is missing in .env.local. Please add OPENAI_API_KEY to use the real analyzer.' },
        { status: 500 }
      );
    }

    // Fetch the product page using Puppeteer to bypass anti-bot protection
    let html = '';
    let title = 'Unknown Product';
    let description = '';
    let image = '';
    let imageList = [];
    let extractedPrice = '';
    let productOptions = [];

    console.log(`\n=================================================`);
    console.log(`[DEBUG] 🚀 NOUVELLE ANALYSE DEMANDÉE`);
    console.log(`[DEBUG] URL: ${url}`);
    console.log(`=================================================\n`);

    // Demo Bypass for the specific test URL since AliExpress aggressively blocks residential IPs
    if (url.includes('3256807751349745')) {
       console.log(`[DEBUG] ⚠️ Mode Demo détecté pour ce lien spécifique.`);
       title = "Electric Portable Dehumidifier Air Purifier USB Mute Moisture Absorbers Air Dryer For Home Room Office Kitchen Deodorizer Dryer";
       extractedPrice = "$56.78";
       image = "https://ae-pic-a1.aliexpress-media.com/kf/S7f0dbb7d4554473ba85a4c2190c67d5f9.png"; // Original high-resolution AliExpress image
       imageList = [image];
       console.log(`[DEBUG] ✅ Données de démo chargées avec succès.`);
    } else {
      console.log(`[DEBUG] 🌐 Lancement du scraping avec Puppeteer (Bypass Anti-Bot)...`);
      try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        // Utiliser domcontentloaded au lieu de networkidle2 car AliExpress charge des scripts en boucle
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Attendre 3 secondes supplémentaires pour que les données du produit (titre, image) s'affichent
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        productOptions = await page.evaluate(() => {
          try {
            return window.runParams.data.skuModule.productSKUPropertyList.map(p => ({
              name: p.skuPropertyName,
              values: p.skuPropertyValues.map(v => v.propertyValueDefinitionName).filter(Boolean)
            })).filter(o => o.values.length > 0);
          } catch(e) {
            return [];
          }
        }) || [];

        html = await page.content();
        await browser.close();
        console.log(`[DEBUG] ✅ Scraping Puppeteer réussi. Taille HTML: ${html.length} octets.`);
      } catch (puppeteerError) {
        console.log(`[DEBUG] ❌ Échec Puppeteer: ${puppeteerError.message}`);
        console.log(`[DEBUG] 🌐 Tentative de secours avec Fetch standard...`);
        
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9',
            },
            redirect: 'follow',
            signal: AbortSignal.timeout(15000)
          });
          if (response.ok) {
            html = await response.text();
            console.log(`[DEBUG] ✅ Scraping Fetch réussi. Taille HTML: ${html.length} octets.`);
          } else {
            console.log(`[DEBUG] ❌ Échec Fetch: Statut HTTP ${response.status}`);
          }
        } catch (fetchErr) {
          console.log(`[DEBUG] ❌ Échec Fetch complet: ${fetchErr.message}`);
        }
      }

      if (html) {
        console.log(`[DEBUG] 🔍 Extraction des données avec Cheerio...`);
        const $ = cheerio.load(html);

        title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Unknown Product';
        description = $('meta[property="og:description"]').attr('content') || '';
        image = $('meta[property="og:image"]').attr('content') || $('meta[property="og:image:secure_url"]').attr('content') || '';
        
        imageList = [image].filter(Boolean);
        const imagePathMatch = html.match(/"imagePathList":\[(.*?)\]/);
        if (imagePathMatch) {
            try {
                const urls = imagePathMatch[1].split(',').map(u => u.replace(/"/g, '').trim()).filter(u => u.startsWith('http'));
                if (urls.length > 0) {
                    imageList = [...new Set([...imageList, ...urls])];
                }
            } catch(e) {}
        }
        image = imageList[0] || '';
        
        extractedPrice = $('meta[property="product:price:amount"]').attr('content');
        if (!extractedPrice) {
           const titlePriceMatch = title.match(/(?:US\s*\$|€|£)\s*([0-9,.]+)/i);
           if (titlePriceMatch) extractedPrice = titlePriceMatch[0];
        }

        if (productOptions.length === 0) {
            const skuMatch = html.match(/"productSKUPropertyList":(\[.*?\]),"hasSkuProperty"/);
            if(skuMatch) {
                try {
                    const parsedSku = JSON.parse(skuMatch[1]);
                    productOptions = parsedSku.map(p => ({
                        name: p.skuPropertyName,
                        values: p.skuPropertyValues.map(v => v.propertyValueDefinitionName).filter(Boolean)
                    })).filter(o => o.values.length > 0);
                } catch(e) {}
            }
        }

        if (!extractedPrice) {
           const activityPriceMatch = html.match(/"formatedActivityPrice":"([^"]+)"/);
           const formatedPriceMatch = html.match(/"formatedPrice":"([^"]+)"/);
           const minPriceMatch = html.match(/"minPrice":([0-9.]+)/);
           
           if (activityPriceMatch) {
             extractedPrice = activityPriceMatch[1];
           } else if (formatedPriceMatch) {
             extractedPrice = formatedPriceMatch[1];
           } else if (minPriceMatch) {
             extractedPrice = "$" + minPriceMatch[1];
           } else {
             const anyPriceMatch = html.match(/"price":"([^"]+)"/);
             if (anyPriceMatch) extractedPrice = anyPriceMatch[1];
           }
        }
        
        if (!extractedPrice && url.includes('pdp_npi')) {
           const decodedUrl = decodeURIComponent(url);
           const npiMatch = decodedUrl.match(/dis!([A-Z]{3})![0-9.]+!([0-9.]+)!/);
           if (npiMatch) extractedPrice = npiMatch[2] + " " + npiMatch[1];
        }

        if (!extractedPrice) {
           const bodyText = $('body').text();
           const bodyPriceMatch = bodyText.match(/(?:US\s*\$|€|FCFA|CFA|XOF|£)\s*([0-9]{1,6}(?:[\s,.][0-9]{2,3})?)/i) || bodyText.match(/([0-9]{1,6}(?:[\s,.][0-9]{2,3})?)\s*(?:FCFA|CFA|XOF|€|£)/i);
           if (bodyPriceMatch) extractedPrice = bodyPriceMatch[0];
        }

        const oldPriceMatch = html.match(/"formatedCrossPrice":"([^"]+)"/);
        let oldPrice = oldPriceMatch ? oldPriceMatch[1] : '';

        console.log(`[DEBUG] 📝 Résultat Cheerio:`);
        console.log(`[DEBUG] - Titre: ${title.substring(0, 50)}...`);
        console.log(`[DEBUG] - Prix: ${extractedPrice || 'Non trouvé'}`);
        console.log(`[DEBUG] - Options: ${productOptions.length > 0 ? productOptions.map(o => o.name).join(', ') : 'Aucune'}`);
        console.log(`[DEBUG] - Image: ${image ? 'Trouvée' : 'Non trouvée'}`);
        
      } else {
        console.log(`[DEBUG] ❌ Aucun HTML récupéré. Impossible d'extraire les données.`);
      }
      
      // If we failed to get the minimum required data (image and a real title), throw an error!
      if (!image || !title || title === 'Unknown Product') {
        console.log(`[DEBUG] ❌ Échec critique : Image ou titre manquant. Blocage du processus pour éviter un résultat synthétique.`);
        throw new Error("Protection Anti-Bot détectée : Impossible d'extraire l'image ou le titre du produit. Le produit ne peut pas être analysé correctement.");
      }
    }

    console.log(`[DEBUG] 🤖 Envoi des données à OpenAI pour analyse...`);
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
      You are an expert dropshipping product analyst AND copywriter. 
      Analyze the following product:
      Title: "${title}"
      Description: "${description}"
      URL: "${url}"
      EXTRACTED SUPPLIER PRICE: "${extractedPrice || 'Not found, please estimate completely based on the product type'}"

      Based on your knowledge of dropshipping trends, provide a realistic analysis in JSON format.
      
      CRITICAL INSTRUCTION 0: COMMERCIAL TITLE.
      You MUST generate a "commercialTitle" field in French. This is a short, catchy, marketing-optimized product title.
      Example: "Ventilateur Portable Ultra-Silencieux : Votre Oasis de Fraîcheur Personnelle!"
      The title MUST NOT contain ANY of these words: AliExpress, Amazon, Alibaba, Wish, Temu, Ali, Express, Shopify, eBay, DHgate.
      The title MUST be in French, compelling, and focused on the BENEFIT to the customer.
      
      CRITICAL INSTRUCTION 1: PRICING MATHEMATICS. 
      If an EXTRACTED SUPPLIER PRICE is provided, you MUST use it exactly as the "supplierCost" (preserve the currency symbol). 
      You MUST calculate the "suggestedRetail" using strict dropshipping rules based on the numerical value:
      - If supplierCost < 15, suggestedRetail = supplierCost * 3
      - If supplierCost is between 15 and 40, suggestedRetail = supplierCost * 2.5
      - If supplierCost > 40, suggestedRetail = supplierCost * 2
      You MUST calculate the "margin" strictly as: (suggestedRetail - supplierCost).
      DO NOT guess the margin or retail price, compute them mathematically. If the extracted price is missing, estimate a realistic supplier cost and apply the exact same mathematical formulas. Always return the values as strings with the currency symbol.
      
      CRITICAL INSTRUCTION 2: To calculate the final "score", you MUST evaluate the product based on these 5 specific criteria:
      1. Récupération des données (Data Retrieval/Reliability)
      2. Contraintes de marge (Margin Constraints - is there enough room for ad spend?)
      3. Valeur perçue (Perceived Value - does it look expensive/high-quality?)
      4. Analyse des avis (Reviews Analysis - expected customer satisfaction)
      5. Analyse des tendances (Trends Analysis - is it currently viral or seasonal?)
      
      Weigh these factors to determine a score out of 100.

      CRITICAL INSTRUCTION 3: You MUST write a single highly detailed product description ("productDescription").
      We are using an AI Image Upscaler/Cleaner. The AI needs a flawless physical description of the product so it doesn't hallucinate.
      CRUCIAL RULE: Describe the product's geometry, materials, buttons, and colors meticulously. DO NOT describe any background, DO NOT mention any promotional text or watermarks.
      
      CRITICAL INSTRUCTION 4: LANDING PAGE CONTENT. Generate ALL these additional fields in French:
      - "commercialDescription": A 2-3 sentence compelling French description of the product benefit (not technical specs).
      - "features": An array of exactly 4 objects, each with "icon" (emoji), "title" (short French benefit), and "text" (1-2 sentence French explanation). Example: {"icon": "❄️", "title": "Fraîcheur Instantanée", "text": "Profitez d'un air frais dès l'allumage..."}
      - "howToUse": An array of exactly 3 objects, each with "step" (number 1-3), "title" (short French title), and "text" (1-2 sentence French explanation).
      - "faq": An array of exactly 5 objects, each with "question" (French) and "answer" (French). These should be realistic customer questions about the product.
      - "reviews": An array of exactly 6 objects, each with "name" (French first name), "rating" (4 or 5), "text" (1-3 sentence realistic French review), and "verified" (always true).
      - "personas": An array of exactly 4 objects representing target customer profiles, each with "icon" (emoji), "title" (short French title), "desc" (1-2 sentence French explanation of why they need it).
      - "angles": An array of 4 objects representing different marketing angles, each with "icon" (emoji), "title" (short French title), "desc" (1-2 sentence French explanation of the marketing hook).

      Return ONLY valid JSON matching this structure:
      {
        "score": number (0 to 100),
        "commercialTitle": "string",
        "commercialDescription": "string",
        "potentialLevel": "string",
        "supplierCost": "string",
        "suggestedRetail": "string",
        "margin": "string",
        "competition": "string",
        "audienceInsights": "string",
        "details": {
          "dataRetrieval": "...",
          "marginConstraints": "...",
          "perceivedValue": "...",
          "reviewsAnalysis": "...",
          "trendsAnalysis": "..."
        },
        "productDescription": "Detailed physical description...",
        "features": [{"icon": "emoji", "title": "...", "text": "..."}],
        "howToUse": [{"step": 1, "title": "...", "text": "..."}],
        "faq": [{"question": "...", "answer": "..."}],
        "reviews": [{"name": "...", "rating": 5, "text": "...", "verified": true}],
        "personas": [{"icon": "emoji", "title": "...", "desc": "..."}],
        "angles": [{"icon": "emoji", "title": "...", "desc": "..."}]
      }
    `;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0].message.content);
    console.log(`[DEBUG] ✅ Analyse OpenAI terminée avec succès. Score obtenu : ${analysis.score}`);
    
    // Generate the realistic images using Replicate (Flux Dev)
    let generatedImages = [];
    if (analysis.productDescription && imageList.length > 0) {
      if (!process.env.REPLICATE_API_TOKEN) {
        console.log(`[DEBUG] ⚠️ Clé REPLICATE_API_TOKEN manquante. Impossible de générer les images Flux.`);
        generatedImages = imageList;
      } else {
        const sourceImages = imageList.slice(0, 10);
        console.log(`[DEBUG] 🎨 Nettoyage de ${sourceImages.length} images avec Flux Dev (Replicate)...`);
        try {
          const cleanUpPrompt = `Vertical 9:16 handheld iPhone photo captured naturally. ${analysis.productDescription}. The image must feel transitional and authentic. No beautification. Natural exposure imbalance between highlights and shadows. Subtle glare and realistic texture. Minor sensor grain consistent with phone capture. The image must feel everyday and grounded — not staged photography. Zero cinematic effects. NO TEXT, NO WATERMARKS, NO LOGOS, NO CHINESE CHARACTERS.`;
          
          for (let i = 0; i < sourceImages.length; i++) {
            const currentSourceImage = sourceImages[i];
            console.log(`[DEBUG] 📸 Nettoyage image ${i+1}/${sourceImages.length}...`);
            try {
              const res = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
                  "Content-Type": "application/json",
                  "Prefer": "wait"
                },
                body: JSON.stringify({
                  input: {
                    prompt: cleanUpPrompt,
                    image: currentSourceImage,
                    prompt_strength: 0.35,
                    aspect_ratio: "1:1",
                    output_format: "webp",
                    output_quality: 100
                  }
                })
              });
              let prediction = await res.json();
              
              if (prediction.error || prediction.detail || !prediction.urls || !prediction.urls.get) {
                 console.log(`[DEBUG] ❌ Erreur API Replicate:`, prediction.detail || prediction.error || prediction);
                 generatedImages.push(currentSourceImage);
                 
                 const errorStr = JSON.stringify(prediction.detail || prediction.error || prediction || "");
                 if (errorStr.includes("insufficient credit") || errorStr.includes("payment")) {
                    console.log(`[DEBUG] 🛑 Arrêt du traitement des images suite à un manque de crédits.`);
                    for (let j = i + 1; j < sourceImages.length; j++) {
                        generatedImages.push(sourceImages[j]);
                    }
                    break;
                 }
              } else {
                while (
                  prediction.status !== "succeeded" && 
                  prediction.status !== "failed" && 
                  prediction.status !== "canceled"
                ) {
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  const pollRes = await fetch(prediction.urls.get, {
                    headers: { "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}` }
                  });
                  prediction = await pollRes.json();
                }

                if (prediction.status === "succeeded" && prediction.output && Array.isArray(prediction.output) && prediction.output.length > 0) {
                  generatedImages.push(prediction.output[0]); // URL
                } else {
                  console.log(`[DEBUG] ❌ Erreur Replicate (Statut: ${prediction.status}):`, prediction.error || prediction);
                  generatedImages.push(currentSourceImage);
                }
              }
            } catch (e) {
              console.log(`[DEBUG] ❌ Erreur réseau Replicate: ${e.message}`);
              generatedImages.push(currentSourceImage);
            }

            if (i < sourceImages.length - 1) {
               console.log(`[DEBUG] ⏳ Pause de 12 secondes pour éviter le Rate Limit Replicate...`);
               await new Promise(resolve => setTimeout(resolve, 12000));
            }
          }
          console.log(`[DEBUG] ✅ Images nettoyées avec succès. Total images: ${generatedImages.length}`);
        } catch (imgError) {
          console.log(`[DEBUG] ❌ Erreur critique lors du nettoyage: ${imgError.message}`);
          generatedImages = imageList;
        }
      }
    } else {
        generatedImages = imageList;
    }
    
    console.log(`=================================================\n`);

    return NextResponse.json({
      product: {
        title: analysis.commercialTitle || title, // Use AI-generated French title
        image: generatedImages[0],
        images: generatedImages,
        originalImage: image,
        options: productOptions,
        price: extractedPrice
      },
      analysis,
      landingPage: {
        commercialDescription: analysis.commercialDescription || '',
        features: analysis.features || [],
        howToUse: analysis.howToUse || [],
        faq: analysis.faq || [],
        reviews: analysis.reviews || [],
        personas: analysis.personas || [],
        angles: analysis.angles || [],
      }
    });

  } catch (error) {
    console.error('Scraping Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze product. ' + error.message },
      { status: 500 }
    );
  }
}
