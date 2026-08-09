import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const { searchParams } = new URL(req.url);
    const shop = searchParams.get('shop');

    if (!shop) {
      return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    // Clean the shop domain
    const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '').trim();

    const clientId = process.env.SHOPIFY_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: 'SHOPIFY_CLIENT_ID not configured' }, { status: 500 });
    }

    // Determine the base URL for the redirect
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const redirectUri = `${baseUrl}/api/shopify/callback`;

    // Scopes needed for analytics
    const scopes = 'read_orders,read_products';

    // Build the Shopify OAuth authorization URL
    const authUrl = `https://${cleanShop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return NextResponse.redirect(authUrl);

  } catch (error) {
    console.error("Shopify Auth Error:", error);
    return NextResponse.json({ error: "Failed to initiate Shopify auth" }, { status: 500 });
  }
}
