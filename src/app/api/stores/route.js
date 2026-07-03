import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Récupérer les intégrations (boutiques Shopify)
    const integrations = await prisma.integration.findMany({
      where: {
        userId: session.user.id
      }
    });

    const connectedStores = integrations.map(integration => {
      let url = "";
      try {
        const parsed = JSON.parse(integration.keyData);
        url = parsed.shopUrl || "";
      } catch(e) {}

      return {
        id: integration.id,
        name: url.split('.')[0] || integration.platform, // Ex: crmyvn-vi
        platform: integration.platform.charAt(0).toUpperCase() + integration.platform.slice(1),
        url: url,
        status: integration.status === 'connected' ? 'Active' : 'Disconnected',
        revenue: "0 €", // Données réelles à intégrer plus tard via API Shopify
        orders: 0
      };
    });

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
