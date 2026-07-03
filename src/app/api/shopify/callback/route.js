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
      return NextResponse.redirect(new URL('/shopify?error=missing_params', req.url));
    }

    // Récupérer temporairement les identifiants stockés
    const integration = await prisma.integration.findUnique({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: "shopify"
        }
      }
    });

    if (!integration) {
      return NextResponse.redirect(new URL('/shopify?error=no_integration_found', req.url));
    }

    const creds = JSON.parse(integration.keyData || "{}");
    const clientId = creds.clientId;
    const clientSecret = creds.clientSecret;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/shopify?error=missing_credentials', req.url));
    }

    // Échanger le code contre le jeton d'accès
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
      return NextResponse.redirect(new URL('/shopify?error=token_exchange_failed', req.url));
    }

    // Sauvegarder le vrai token (shpat_...)
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        status: 'connected',
        keyData: JSON.stringify({
          shopUrl: shop,
          clientId: clientId,
          clientSecret: clientSecret,
          accessToken: tokenData.access_token // LE FAMEUX shpat_ !
        })
      }
    });

    return NextResponse.redirect(new URL('/shopify?success=true', req.url));

  } catch (error) {
    console.error("Callback Error:", error);
    return NextResponse.redirect(new URL('/shopify?error=server_error', req.url));
  }
}
