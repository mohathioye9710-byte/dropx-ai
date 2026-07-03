import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const integration = await prisma.integration.findUnique({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: "shopify"
        }
      }
    });

    if (!integration) {
      return NextResponse.json({ status: "disconnected" }, { status: 200 });
    }

    const creds = JSON.parse(integration.keyData);
    
    return NextResponse.json({ 
      status: "connected",
      shopUrl: creds.shopUrl || "",
      clientId: creds.clientId || "",
      clientSecret: creds.clientSecret || ""
    }, { status: 200 });

  } catch (error) {
    console.error("Shopify GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { shopUrl, clientId, clientSecret } = body;

    if (!shopUrl || !clientId || !clientSecret) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const creds = JSON.stringify({
      shopUrl,
      clientId,
      clientSecret
    });

    await prisma.integration.upsert({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: "shopify"
        }
      },
      update: {
        keyData: creds,
        status: "connected"
      },
      create: {
        userId: session.user.id,
        platform: "shopify",
        keyData: creds,
        status: "connected"
      }
    });

    return NextResponse.json({ success: true, message: "Shopify integration saved successfully" }, { status: 200 });

  } catch (error) {
    console.error("Shopify POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
