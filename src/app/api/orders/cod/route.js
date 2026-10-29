import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// Helper for local file persistence as a high-reliability fallback
const DATA_DIR = path.join(process.cwd(), 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'cod_orders.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([]), 'utf8');
  }
}

function getLocalOrders() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveLocalOrder(order) {
  ensureDataFile();
  try {
    const orders = getLocalOrders();
    orders.unshift(order);
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
  } catch (e) {
    console.error("[COD Local Save Error]:", e);
  }
}

// CORS Headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// POST: Create a new COD Order (from Shopify storefront or preview)
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      shopDomain,
      customerName = '',
      customerPhone = '',
      customerCity = 'Dakar',
      customerAddress = '',
      paymentMethod = 'Espèces à la livraison',
      productTitle = 'Produit',
      bundleTitle = '1 Unité',
      variantId,
      quantity = 1,
      unitPrice = 0,
      totalPrice = 0,
      currency = 'XOF',
      merchantPhone = '+221770000000',
      note = ''
    } = body;

    if (!customerPhone && !customerName) {
      return NextResponse.json(
        { error: 'Nom et numéro de téléphone requis' },
        { status: 400, headers: corsHeaders }
      );
    }

    const orderId = `COD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const orderRecord = {
      id: orderId,
      shopifyOrderId: null,
      shopifyOrderNumber: null,
      shopDomain: shopDomain || 'inconnu',
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerCity: customerCity.trim(),
      customerAddress: customerAddress.trim(),
      paymentMethod: paymentMethod || 'Espèces à la livraison',
      productTitle,
      bundleTitle,
      variantId: variantId || null,
      quantity: Number(quantity) || 1,
      unitPrice: Number(unitPrice) || 0,
      totalPrice: Number(totalPrice) || 0,
      currency: currency || 'XOF',
      status: 'NOUVEAU', // NOUVEAU, CONFIRME, EN_LIVRAISON, LIVRE, ANNULE
      note: note || '',
      merchantPhone,
      createdAt: now,
      updatedAt: now
    };

    // Attempt to push to Shopify if shopDomain or credentials exist
    let shopifySuccess = false;
    try {
      // Find shopify integration
      let integration = null;
      try {
        const integrations = await prisma.integration.findMany({
          where: { platform: 'shopify', status: 'connected' }
        });
        if (integrations && integrations.length > 0) {
          integration = integrations[0];
        }
      } catch (dbErr) {
        console.warn("[Prisma DB Warning]:", dbErr.message);
      }

      if (integration && integration.keyData) {
        const creds = JSON.parse(integration.keyData);
        const shopUrl = (creds.shopUrl || creds.domain || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
        const adminToken = creds.accessToken || creds.clientSecret || creds.token || '';

        if (shopUrl && adminToken) {
          const names = (customerName || 'Client').trim().split(' ');
          const firstName = names[0] || 'Client';
          const lastName = names.slice(1).join(' ') || 'Sénégal';

          const lineItem = {
            quantity: Number(quantity) || 1,
            price: (Number(unitPrice) || Number(totalPrice) || 0).toString(),
            title: `${productTitle} - ${bundleTitle}`
          };
          if (variantId && !isNaN(Number(variantId))) {
            lineItem.variant_id = Number(variantId);
          }

          const shopifyPayload = {
            order: {
              line_items: [lineItem],
              customer: {
                first_name: firstName,
                last_name: lastName,
                phone: customerPhone,
                note: `Mode de paiement: ${paymentMethod}`
              },
              shipping_address: {
                first_name: firstName,
                last_name: lastName,
                phone: customerPhone,
                address1: customerAddress || customerCity,
                city: customerCity || 'Dakar',
                country: 'Senegal',
                country_code: 'SN'
              },
              billing_address: {
                first_name: firstName,
                last_name: lastName,
                phone: customerPhone,
                address1: customerAddress || customerCity,
                city: customerCity || 'Dakar',
                country: 'Senegal',
                country_code: 'SN'
              },
              financial_status: 'pending',
              gateway: `COD - ${paymentMethod}`,
              note: `[EASYSELL DROPX - COMMANDE SÉNÉGAL]\nNom: ${customerName}\nTéléphone WhatsApp: ${customerPhone}\nRégion/Ville: ${customerCity}\nQuartier/Adresse: ${customerAddress}\nOffre: ${bundleTitle}\nMode: ${paymentMethod}\nTotal: ${totalPrice} ${currency}`,
              tags: 'COD, Senegal, EasySell, Paiement-Livraison, DropX'
            }
          };

          const shopifyRes = await fetch(`https://${shopUrl}/admin/api/2024-04/orders.json`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': adminToken
            },
            body: JSON.stringify(shopifyPayload)
          });

          if (shopifyRes.ok) {
            const shopifyData = await shopifyRes.json();
            if (shopifyData && shopifyData.order) {
              orderRecord.shopifyOrderId = shopifyData.order.id;
              orderRecord.shopifyOrderNumber = shopifyData.order.order_number || shopifyData.order.name;
              shopifySuccess = true;
              console.log("[Shopify Order Created]:", orderRecord.shopifyOrderNumber);
            }
          } else {
            const errBody = await shopifyRes.text();
            console.warn("[Shopify Order Creation Warn]:", errBody);
          }
        }
      }
    } catch (shopifyErr) {
      console.error("[Shopify Sync Error]:", shopifyErr);
    }

    // Save to local storage for instant dashboard access
    saveLocalOrder(orderRecord);

    // Build prefilled WhatsApp message for merchant
    const waText = encodeURIComponent(
      `Bonjour ShopX ! Je viens de passer une commande pour : ${productTitle} (${bundleTitle}).\n` +
      `Montant total : ${totalPrice} ${currency}.\n` +
      `Nom : ${customerName}\n` +
      `Téléphone : ${customerPhone}\n` +
      `Ville / Quartier : ${customerCity} - ${customerAddress}\n` +
      `Paiement : ${paymentMethod}.\n` +
      `Merci de confirmer la livraison !`
    );

    const cleanMerchantPhone = (merchantPhone || '221770000000').replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanMerchantPhone}?text=${waText}`;

    return NextResponse.json({
      success: true,
      message: 'Commande validée avec succès !',
      order: orderRecord,
      shopifySuccess,
      whatsappUrl
    }, { status: 201, headers: corsHeaders });

  } catch (error) {
    console.error("[COD Order API Error]:", error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement de la commande.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// GET: Fetch COD orders for DropX dashboard
export async function GET(req) {
  try {
    const orders = getLocalOrders();
    return NextResponse.json({
      success: true,
      orders
    }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// PATCH: Update order status (Nouveau, Confirmé, En Livraison, Livré, Annulé)
export async function PATCH(req) {
  try {
    const { orderId, status } = await req.json();
    ensureDataFile();
    const orders = getLocalOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      orders[idx].status = status;
      orders[idx].updatedAt = new Date().toISOString();
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
      return NextResponse.json({ success: true, order: orders[idx] }, { headers: corsHeaders });
    }
    return NextResponse.json({ error: 'Commande introuvable' }, { status: 404, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
