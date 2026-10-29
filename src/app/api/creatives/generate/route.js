import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req) {
  try {
    const { productName, description, price, targetMarket = 'senegal' } = await req.json();

    if (!productName) {
      return NextResponse.json({ error: 'Le nom du produit est requis' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Clé OpenAI non configurée' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const isSenegal = targetMarket === 'senegal';

    const systemPrompt = `Tu es un expert mondial en création de publicités vidéo TikTok, Instagram Reels et Facebook Ads (spécialiste comme Creatify.ai).
Tu conçois des créatives vidéos publicitaires ultra-captivantes au format vertical 9:16 (durée 25-30 secondes) optimisées pour un taux de conversion maximal en e-commerce dropshipping.
${isSenegal ? 'Le marché cible est le SÉNÉGAL (Dakar & régions). Les arguments de réassurance indispensables sont : Paiement à la livraison (COD), Wave, Orange Money, Espèces, et Livraison express 24h/48h. Le ton doit être direct, dynamique, chaleureux et percutant en français.' : 'Le marché cible est international (France / Europe / Global).'}

Génère 3 variations de vidéos avec des angles marketing différents :
1. "problem_solver" : Attaque directe sur le problème frustrant du client, démonstration choc, soulagement immédiat.
2. "viral_ugc" : Style créateur TikTok / avis client authentique, effet waouh, démonstration en direct.
3. "urgency_offer" : Offre spéciale irrésistible, stock limité, accent fort sur la facilité de commande et paiement à la livraison.

Pour CHAQUE variation, fournis :
- "angleId": string (ex: "problem_solver", "viral_ugc", "urgency_offer")
- "angleTitle": string (ex: "Problème & Solution Choc", "TikTok Viral UGC", "Offre Spéciale COD")
- "viralityScore": number (ex: 96)
- "hookLine": phrase d'accroche des 3 premières secondes
- "fullVoiceover": texte complet lu par la voix off. RÈGLES STRICTES car il est lu par une synthèse vocale :
  * 55 à 65 mots maximum (la vidéo dure moins de 25 secondes)
  * français oral naturel de France, comme un vrai créateur TikTok qui parle à un ami (phrases courtes, rythme vivant, vouvoiement)
  * TOUS les chiffres écrits en toutes lettres (ex: "treize mille cinq cents francs CFA", "vingt-quatre heures", "cinq secondes")
  * jamais de symboles ni d'abréviations (écris "francs CFA" et jamais "FCFA", "pour cent" et jamais "%")
  * aucun emoji, aucun hashtag, aucune parenthèse, aucune didascalie
  * commence par une accroche choc qui arrête le scroll, termine par un appel à l'action
- "scenes": tableau de 5 scènes chronologiques (durée totale 25-30s) :
  Chaque scène doit contenir :
  - "time": string (ex: "0-3s", "3-8s", "8-16s", "16-22s", "22-28s")
  - "title": string (ex: "Accroche / Hook", "Le Problème", "La Démonstration", "Réassurance", "Appel à l'action")
  - "caption": texte court affiché en gros caractères animés au centre de l'écran (style TikTok)
  - "spoken": ce que la voix off dit exactement pendant cette scène
  - "visual": description visuelle détaillée de ce qu'on voit à l'écran
- "metaAdCopy":
  - "primaryText": texte principal pour Facebook/Instagram Ads (avec emojis et arguments de vente)
  - "headline": titre accrocheur (court)
  - "callToAction": "Commander" ou "Acheter"

Réponds UNIQUEMENT avec un objet JSON contenant la clé "variations" qui est un tableau de 3 objets correspondant à cette structure exacte :
{
  "variations": [
    {
      "angleId": "string",
      "angleTitle": "string",
      "viralityScore": 95,
      "hookLine": "string",
      "fullVoiceover": "string",
      "scenes": [...],
      "metaAdCopy": { ... }
    }
  ]
}`;

    const userPrompt = `Produit : "${productName}"
Description : "${description || 'Produit tendance innovant et indispensable'}"
Prix : "${price || (isSenegal ? '15.000 FCFA' : '29.99 €')}"
Marché : ${isSenegal ? 'Sénégal (Paiement à la livraison / Wave / Orange Money / Livraison 24h Dakar)' : 'Global'}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const result = JSON.parse(completion.choices[0].message.content);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Creative Generate error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la créative : ' + error.message },
      { status: 500 }
    );
  }
}
