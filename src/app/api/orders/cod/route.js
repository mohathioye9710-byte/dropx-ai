import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import fs from 'fs';
import path from 'path';
import { getDeliveryFeeByZone, getWaveFee, normalizePriceFCFA, calculateOrderFinances } from '@/lib/senegalCod';

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
      merchantPhone = '+221775447866',
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

    const normalizedRevenue = normalizePriceFCFA(totalPrice, currency);
    const calculatedDeliveryFee = body.deliveryFee !== undefined ? Number(body.deliveryFee) : getDeliveryFeeByZone(customerCity);
    const waveFee = getWaveFee(normalizedRevenue);
    const supplierCost = body.supplierCost ? normalizePriceFCFA(body.supplierCost, currency) : Math.round((normalizedRevenue * 0.28) / 100) * 100;
    const netProfit = normalizedRevenue - supplierCost - calculatedDeliveryFee - waveFee;
    const marginPct = normalizedRevenue > 0 ? Math.round((netProfit / normalizedRevenue) * 100) : 0;

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
      normalizedRevenue,
      deliveryFee: calculatedDeliveryFee,
      deliveryZone: customerCity.trim(),
      waveFee,
      supplierCost,
      netProfit,
      marginPct,
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

          const rawPrice = Number(totalPrice) || Number(unitPrice) || 0;
          // If Shopify store is USD and price is in FCFA (> 500), convert for Shopify API so it is not $31,400
          const shopifyItemPrice = rawPrice > 500 ? (rawPrice / 600).toFixed(2) : rawPrice.toString();

          const lineItem = {
            quantity: Number(quantity) || 1,
            price: shopifyItemPrice,
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
              phone: customerPhone,
              financial_status: 'pending',
              gateway: `COD - ${paymentMethod}`,
              note: `[EASYSELL DROPX - COMMANDE SÉNÉGAL]\nNom: ${customerName}\nTéléphone WhatsApp: ${customerPhone}\nRégion/Ville: ${customerCity}\nQuartier/Adresse: ${customerAddress}\nOffre: ${bundleTitle}\nMode: ${paymentMethod}\nLivraison: ${calculatedDeliveryFee} FCFA\nTotal: ${totalPrice} ${currency}`,
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
              orderRecord.shopifyOrderNumber = shopifyData.order.order_number ? `#${shopifyData.order.order_number}` : (shopifyData.order.name || `#${shopifyData.order.id}`);
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

    const cleanMerchantPhone = (merchantPhone && !merchantPhone.includes('770000000') ? merchantPhone : '221775447866').replace(/[^0-9]/g, '');
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

// GET: Fetch real orders (Shopify connected store + real COD orders)
export async function GET(req) {
  try {
    let shopifyOrders = [];
    let connectedShopDomain = null;

    try {
      const session = await getServerSession(authOptions);
      let integration = null;

      if (session?.user?.id) {
        integration = await prisma.integration.findFirst({
          where: { userId: session.user.id, platform: 'shopify' }
        });
      }
      if (!integration) {
        integration = await prisma.integration.findFirst({
          where: { platform: 'shopify', status: 'connected' }
        }) || await prisma.integration.findFirst({
          where: { platform: 'shopify' }
        });
      }

      if (integration?.keyData) {
        const creds = JSON.parse(integration.keyData);
        const shopUrl = (creds.domain || creds.shopUrl || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
        const adminToken = creds.token || creds.accessToken || creds.clientSecret || '';

        if (shopUrl && adminToken) {
          connectedShopDomain = shopUrl;
          const shopifyRes = await fetch(`https://${shopUrl}/admin/api/2024-04/orders.json?status=any&limit=50`, {
            headers: {
              'X-Shopify-Access-Token': adminToken,
              'Content-Type': 'application/json'
            },
            cache: 'no-store'
          });

          if (shopifyRes.ok) {
            const shopifyData = await shopifyRes.json();
            const rawOrders = shopifyData.orders || [];

            shopifyOrders = rawOrders.map(so => {
              let status = "NOUVEAU";
              if (so.cancelled_at) {
                status = "ANNULE";
              } else if (so.fulfillment_status === "fulfilled") {
                status = "LIVRE";
              } else if (so.fulfillment_status === "partial" || so.financial_status === "paid") {
                status = "EN_LIVRAISON";
              } else if (so.financial_status === "authorized" || so.confirmed) {
                status = "CONFIRME";
              }

              const customer = so.customer || {};
              const shipping = so.shipping_address || {};
              const customerName = (
                `${customer.first_name || ''} ${customer.last_name || ''}`.trim() ||
                `${shipping.first_name || ''} ${shipping.last_name || ''}`.trim() ||
                'Client Boutique'
              );
              const customerPhone = customer.phone || shipping.phone || so.billing_address?.phone || '-';
              const customerCity = shipping.city || shipping.province || 'Sénégal';
              const customerAddress = [shipping.address1, shipping.address2].filter(Boolean).join(', ') || '-';

              const lineItems = so.line_items || [];
              const productTitle = lineItems.map(li => li.title).join(', ') || 'Produit Boutique';
              const totalQty = lineItems.reduce((acc, li) => acc + (li.quantity || 1), 0) || 1;
              const bundleTitle = lineItems.length > 0 ? `${totalQty} article(s)` : '1 Unité';

              const totalPrice = parseFloat(so.total_price || 0);

              return {
                id: `SHOPIFY-${so.id}`,
                shopifyOrderId: so.id,
                shopifyOrderNumber: so.order_number ? `#${so.order_number}` : (so.name || `#${so.id}`),
                shopDomain: shopUrl,
                customerName,
                customerPhone,
                customerCity,
                customerAddress,
                paymentMethod: so.gateway || (so.payment_gateway_names && so.payment_gateway_names.join(', ')) || 'Paiement Shopify',
                productTitle,
                bundleTitle,
                quantity: totalQty,
                unitPrice: totalPrice / (totalQty || 1),
                totalPrice: totalPrice,
                currency: so.currency || 'XOF',
                status,
                note: so.note || '',
                createdAt: so.created_at || new Date().toISOString(),
                updatedAt: so.updated_at || new Date().toISOString(),
                source: 'shopify'
              };
            });
          }
        }
      }
    } catch (shopifyErr) {
      console.warn("[Orders API Shopify Fetch Warning]:", shopifyErr.message);
    }

    // Get real local orders (excluding old mock demo IDs)
    const localOrders = getLocalOrders().filter(o => !String(o.id).startsWith('COD-1729000100'));

    // Deduplicate if any local order already has shopifyOrderId matching a shopifyOrder
    const existingShopifyIds = new Set(shopifyOrders.map(o => String(o.shopifyOrderId)));
    const uniqueLocalOrders = localOrders.filter(o => !o.shopifyOrderId || !existingShopifyIds.has(String(o.shopifyOrderId)));

// Helper for order overrides (custom Alibaba cost, status) for both Shopify and COD orders
const OVERRIDES_FILE = path.join(DATA_DIR, 'order_overrides.json');

function getOrderOverrides() {
  if (!fs.existsSync(OVERRIDES_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

function saveOrderOverride(orderId, patchData) {
  ensureDataFile();
  const overrides = getOrderOverrides();
  overrides[orderId] = { ...(overrides[orderId] || {}), ...patchData, updatedAt: new Date().toISOString() };
  fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(overrides, null, 2), 'utf8');
  return overrides[orderId];
}

    // Combined real orders sorted newest first
    const allOrders = [...shopifyOrders, ...uniqueLocalOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const overrides = getOrderOverrides();

    // Enrich all real orders with exact financial breakdown (Alibaba, Delivery by zone, Wave fee, Net Profit)
    const enrichedOrders = allOrders.map(order => {
      const override = overrides[order.id] || overrides[order.shopifyOrderId] || overrides[order.shopifyOrderNumber] || {};
      const effectiveStatus = override.status || order.status;
      const customSupplierCost = override.supplierCost !== undefined ? Number(override.supplierCost) : (order.supplierCost || null);

      const finances = calculateOrderFinances(order, customSupplierCost);
      return {
        ...order,
        status: effectiveStatus,
        normalizedRevenue: finances.revenue,
        deliveryFee: finances.deliveryFee,
        deliveryZone: finances.zone,
        waveFee: finances.waveFee,
        supplierCost: finances.supplierCost,
        netProfit: finances.netProfit,
        marginPct: finances.marginPct
      };
    });

    const activeOrders = enrichedOrders.filter(o => o.status !== "ANNULE");
    const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.normalizedRevenue || 0), 0);
    const totalSupplierCost = activeOrders.reduce((sum, o) => sum + (o.supplierCost || 0), 0);
    const totalDeliveryFees = activeOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
    const totalWaveFees = activeOrders.reduce((sum, o) => sum + (o.waveFee || 0), 0);
    const totalNetProfit = activeOrders.reduce((sum, o) => sum + (o.netProfit || 0), 0);
    const averageMarginPct = totalRevenue > 0 ? Math.round((totalNetProfit / totalRevenue) * 100) : 0;

    return NextResponse.json({
      success: true,
      orders: enrichedOrders,
      shopDomain: connectedShopDomain,
      count: enrichedOrders.length,
      finances: {
        totalRevenue,
        totalSupplierCost,
        totalDeliveryFees,
        totalWaveFees,
        totalNetProfit,
        averageMarginPct,
        currency: 'XOF'
      }
    }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// PATCH: Update order status or supplier cost (Alibaba/AliExpress)
export async function PATCH(req) {
  try {
    const { orderId, status, supplierCost } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: 'orderId requis' }, { status: 400, headers: corsHeaders });
    }

    const patchData = {};
    if (status) patchData.status = status;
    if (supplierCost !== undefined && !isNaN(Number(supplierCost))) {
      patchData.supplierCost = Number(supplierCost);
    }

    saveOrderOverride(orderId, patchData);

    ensureDataFile();
    const orders = getLocalOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      if (status) orders[idx].status = status;
      if (supplierCost !== undefined) {
        orders[idx].supplierCost = Number(supplierCost);
        const fin = calculateOrderFinances(orders[idx], Number(supplierCost));
        orders[idx].netProfit = fin.netProfit;
        orders[idx].marginPct = fin.marginPct;
      }
      orders[idx].updatedAt = new Date().toISOString();
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
    }

    return NextResponse.json({ success: true, orderId, updated: patchData }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

