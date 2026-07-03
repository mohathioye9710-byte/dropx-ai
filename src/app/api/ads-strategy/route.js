import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productName, positioning, trafficSource } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
      You are an expert digital marketing consultant for dropshipping stores.
      I am building an ad strategy for my product.
      Product Name: "${productName}"
      Brand Positioning: "${positioning}"
      Primary Traffic Source: "${trafficSource}"

      Based on these choices, generate a targeted strategy in JSON format:
      1. "storeDesign": A 2-3 sentence recommendation on how the store should look (colors, layout, trust signals).
      2. "adCreative": A 3-4 sentence strategy for the ad creative (hook, visual style, pacing) specifically tailored to the traffic source and product.
      3. "copywriting": A short, punchy ad caption or text overlay idea.

      Return ONLY valid JSON matching this structure:
      {
        "storeDesign": "string",
        "adCreative": "string",
        "copywriting": "string"
      }
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);

    // Save Activity to Database
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: 'AD_STRATEGY',
        description: `Generated Ad Strategy for "${productName}"`,
        metadata: result
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('OpenAI/Prisma Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI strategy. ' + error.message },
      { status: 500 }
    );
  }
}
