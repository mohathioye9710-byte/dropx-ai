import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ error: 'URL invalide' }, { status: 400 });
    }

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Impossible d'accéder à la page (${response.status})` }, { status: 400 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract product details
    const title = 
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('h1').first().text().trim() ||
      $('title').text().trim();

    const description = 
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('.product-description, .product__description, [data-product-description]').first().text().trim() ||
      '';

    let image = 
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('img[src*="products"]').first().attr('src') ||
      $('img').first().attr('src') ||
      '';

    if (image && image.startsWith('//')) {
      image = 'https:' + image;
    }

    // Detect price
    let price = '';
    const priceMeta = $('meta[property="product:price:amount"]').attr('content') ||
                      $('meta[property="og:price:amount"]').attr('content');
    if (priceMeta) {
      price = priceMeta;
    } else {
      const priceText = $('.price, .product-price, [data-price]').first().text().trim();
      if (priceText) {
        price = priceText.replace(/[^\d.,]/g, '').trim();
      }
    }

    return NextResponse.json({
      title: title.replace(/[\n\r\t]+/g, ' ').substring(0, 120),
      description: description.replace(/[\n\r\t]+/g, ' ').substring(0, 500),
      image,
      price,
      url
    });

  } catch (err) {
    console.error('Scrape error:', err);
    return NextResponse.json({ error: 'Erreur lors de l\'analyse de la page: ' + err.message }, { status: 500 });
  }
}
