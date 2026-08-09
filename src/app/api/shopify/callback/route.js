import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.redirect(new URL('/login?error=unauthorized', req.url));
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const shop = searchParams.get('shop');
    
    if (!code || !shop) {
      return NextResponse.redirect(new URL('/settings?error=missing_params', req.url));
    }

    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Missing SHOPIFY_CLIENT_ID or SHOPIFY_CLIENT_SECRET env vars");
      return NextResponse.redirect(new URL('/settings?error=server_config', req.url));
    }

    // Exchange the authorization code for an access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("[Shopify Auth Error]:", tokenData);
      return NextResponse.redirect(new URL('/settings?error=token_exchange_failed', req.url));
    }

    // Clean the shop domain for storage
    const cleanDomain = shop.replace(/^https?:\/\//, '').replace(/\/$/, '').trim();

    // Save the real access token (shpat_...) in the database
    await prisma.integration.upsert({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: 'shopify'
        }
      },
      update: {
        status: 'connected',
        keyData: JSON.stringify({
          domain: cleanDomain,
          token: tokenData.access_token
        })
      },
      create: {
        userId: session.user.id,
        platform: 'shopify',
        status: 'connected',
        keyData: JSON.stringify({
          domain: cleanDomain,
          token: tokenData.access_token
        })
      }
    });

    return NextResponse.redirect(new URL('/settings?shopify=connected', req.url));

  } catch (error) {
    console.error("Callback Error:", error);
    return NextResponse.redirect(new URL('/settings?error=server_error', req.url));
  }
}
