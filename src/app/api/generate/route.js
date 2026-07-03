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

    const { productName, productFeatures, targetAudience } = await req.json();

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
      You are an expert dropshipping copywriter and marketing strategist.
      I have a product called "${productName}". 
      Features: ${productFeatures}.
      Target Audience: ${targetAudience || 'General audience'}.

      Please generate the following in JSON format:
      1. "title": A catchy, high-converting product title.
      2. "description": A highly engaging, realistic product description that doesn't sound like AI. Include bullet points.
      3. "pricing": Suggest a competitive retail price and a "compare at" price.
      4. "bundles": Two bundle deal ideas (e.g., "Buy 2 Get 1 Free").
      5. "reviews": 3 realistic customer reviews (name, rating, comment).

      Return ONLY valid JSON matching this structure:
      {
        "title": "string",
        "description": "string",
        "pricing": { "retail": "number", "compareAt": "number" },
        "bundles": [ { "name": "string", "offer": "string" } ],
        "reviews": [ { "author": "string", "rating": "number", "text": "string" } ]
      }
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);

    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: 'PRODUCT_GENERATE',
        description: `Generated AI Listing for "${productName}"`,
        metadata: result
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('OpenAI Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI content. ' + error.message },
      { status: 500 }
    );
  }
}
