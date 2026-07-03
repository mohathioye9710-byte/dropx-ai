import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productName, storeData } = await req.json();

    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: 'PRODUCT_GENERATE',
        description: `Boutique générée pour "${productName || 'Produit inconnu'}"`,
        metadata: storeData || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Store generation logging error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    const activity = await prisma.activity.findUnique({
      where: {
        id: id,
      }
    });

    if (!activity || activity.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ activity }, { status: 200 });
  } catch (error) {
    console.error('Store retrieval error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
