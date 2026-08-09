import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Enable CORS so the pixel can send data from any Shopify store domain
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req) {
  try {
    const data = await req.json();
    const { shop, event, visitorId, path, url } = data;

    if (!shop || !event || !visitorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders });
    }

    // Clean shop domain just in case
    const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '').trim();

    // Store the event in the database
    await prisma.trafficEvent.create({
      data: {
        shopDomain: cleanShop,
        eventType: event, // 'page_view', 'add_to_cart', etc.
        visitorId: visitorId,
        path: path || null,
        url: url || null,
      }
    });

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Tracking Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
}
