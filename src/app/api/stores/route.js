import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

async function fetchShopifyStats(domain, token, days = 30) {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);

  const shopifyUrl = `https://${domain}/admin/api/2024-01/orders.json?status=any&created_at_min=${dateLimit.toISOString()}&fields=total_price`;

  const res = await fetch(shopifyUrl, {
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    console.error(`Shopify stats error for ${domain}:`, await res.text());
    return { revenue: 0, orders: 0 };
  }

  const data = await res.json();
  const orders = data.orders || [];
  const revenue = orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
  return { revenue, orders: orders.length };
}

function formatRevenue(amount) {
  if (!amount) return '0 FCFA';
  const val = Math.round(Number(amount) < 500 ? Number(amount) * 600 : Number(amount));
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(val) + ' FCFA';
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    let integrations = [];

    if (session?.user?.id) {
      integrations = await prisma.integration.findMany({
        where: { userId: session.user.id },
      });
    }

    if (integrations.length === 0) {
      integrations = await prisma.integration.findMany({
        where: { platform: 'shopify', status: 'connected' },
      });
    }

    const connectedStores = await Promise.all(
      integrations.map(async (integration) => {
        let url = '';
        let token = '';
        let shopName = 'ShopX';
        try {
          const parsed = JSON.parse(integration.keyData);
          url = parsed.domain || parsed.shopUrl || 'sen-shopx.myshopify.com';
          token = parsed.accessToken || parsed.token || parsed.clientSecret || '';
          shopName = parsed.shopName || 'ShopX';
        } catch (e) {}

        let revenue = 0;
        let orders = 0;
        if (integration.status === 'connected' && url && token) {
          const stats = await fetchShopifyStats(url, token);
          revenue = stats.revenue;
          orders = stats.orders;
        }

        return {
          id: integration.id,
          name: shopName,
          platform: 'Shopify',
          url,
          status: integration.status === 'connected' ? 'Active' : 'Disconnected',
          revenue: formatRevenue(revenue),
          orders,
        };
      })
    );

    // Récupérer les boutiques générées (depuis l'historique d'activités)
    const activities = await prisma.activity.findMany({
      where: {
        userId: session.user.id,
        type: 'PRODUCT_GENERATE'
      },
      orderBy: { createdAt: 'desc' }
    });

    const generatedStores = activities.map(act => {
      let name = act.description.replace('Boutique générée pour ', '').replace(/"/g, '');
      return {
        id: act.id,
        name: name,
        niche: "Produit Généré IA",
        status: "Publié sur Shopify",
        createdAt: act.createdAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
        products: 1,
        metadata: act.metadata
      };
    });

    return NextResponse.json({ 
      connectedStores,
      generatedStores
    }, { status: 200 });

  } catch (error) {
    console.error("Stores API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
