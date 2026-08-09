import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { platform, domain, token } = await req.json();

    if (platform !== 'shopify') {
      return NextResponse.json({ error: 'Platform not supported yet' }, { status: 400 });
    }

    if (!domain || !token) {
      return NextResponse.json({ error: 'Domain and token are required' }, { status: 400 });
    }

    // Clean domain
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').trim();

    // Store in DB
    const keyDataStr = JSON.stringify({ domain: cleanDomain, token });

    const integration = await prisma.integration.upsert({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: 'shopify'
        }
      },
      update: {
        keyData: keyDataStr,
        status: 'connected'
      },
      create: {
        userId: session.user.id,
        platform: 'shopify',
        keyData: keyDataStr,
        status: 'connected'
      }
    });

    return NextResponse.json({ success: true, integration });
  } catch (error) {
    console.error("Integration saving error:", error);
    return NextResponse.json({ error: "Failed to save integration" }, { status: 500 });
  }
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const integration = await prisma.integration.findUnique({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: 'shopify'
        }
      }
    });

    if (!integration) {
      return NextResponse.json({ connected: false });
    }

    const keyData = JSON.parse(integration.keyData || '{}');
    return NextResponse.json({ 
      connected: true, 
      domain: keyData.domain 
    });

  } catch (error) {
    console.error("Integration fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch integration" }, { status: 500 });
  }
}
