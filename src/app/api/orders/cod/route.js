import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import fs from 'fs';
import path from 'path';
import { getDeliveryFeeByZone, getWaveFee, normalizePriceFCFA, calculateOrderFinances } from '@/lib/senegalCod';

// Helper for local file persistence as a high-reliability fallback
const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(process.cwd(), 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'cod_orders.json');

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify([]), 'utf8');
    }
  } catch (e) {
    console.warn("[EnsureDataFile Warn]:", e.message);
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

// Reliable Shopify credentials resolver:
// 1. Process Environment Variables (SHOPIFY_ACCESS_TOKEN, SHOPIFY_SHOP_URL)
// 2. Prisma DB if connected
async function resolveShopifyCredentials(requestedDomain) {
  // 1. Check Environment Variables (Production Vercel & local .env)
  const envToken = process.env.SHOPIFY_ACCESS_TOKEN;
  const envShop = process.env.SHOPIFY_SHOP_URL || '98fny6-w1.myshopify.com';
  if (envToken) {
    return {
      shopUrl: envShop.trim().replace(/^https?:\/\//, '').replace(/\/$/, ''),
      adminToken: envToken.trim()
    };
  }

  // 2. Try Prisma DB if available
  try {
    const integrations = await prisma.integration.findMany({
      where: { platform: 'shopify', status: 'connected' }
    });
    if (integrations && integrations.length > 0) {
      for (const integ of integrations) {
        if (integ.keyData) {
          try {
            const creds = JSON.parse(integ.keyData);
            const shopUrl = (creds.shopUrl || creds.domain || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
            const adminToken = creds.accessToken || creds.clientSecret || creds.token || '';
            if (shopUrl && adminToken) {
              if (requestedDomain && (shopUrl.includes(requestedDomain) || requestedDomain.includes(shopUrl))) {
                return { shopUrl, adminToken };
              }
              return { shopUrl, adminToken };
            }
          } catch (e) {}
        }
      }
    }
  } catch (dbErr) {
    console.warn("[Prisma DB Warning in COD]:", dbErr.message);
  }

  return null;
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
      productUrl = '',
      productImageUrl = '',
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
      productUrl: productUrl || '',
      productImageUrl: productImageUrl || '',
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

    // Attempt to push to Shopify if credentials exist
    let shopifySuccess = false;
    try {
      const creds = await resolveShopifyCredentials(shopDomain);
      if (creds && creds.shopUrl && creds.adminToken) {
        const names = (customerName || 'Client').trim().split(' ');
        const firstName = names[0] || 'Client';
        const lastName = names.slice(1).join(' ') || 'Sénégal';

        const rawPrice = Number(totalPrice) || Number(unitPrice) || 0;

        const lineItem = {
          quantity: Number(quantity) || 1,
          price: rawPrice.toString(),
          title: `${productTitle} - ${bundleTitle}`
        };
        if (variantId && !isNaN(Number(variantId))) {
          lineItem.variant_id = Number(variantId);
        }

        const shopifyPayload = {
          order: {
            currency: 'XOF',
            line_items: [lineItem],
            customer: {
              first_name: firstName,
              last_name: lastName,
              phone: customerPhone,
              note: `Client COD - Mode: ${paymentMethod}`
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
            gateway: `Paiement à la livraison (${paymentMethod})`,
            note: `[COMMANDE DROPX - PAIEMENT À LA LIVRAISON (COD)]\nClient : ${customerName}\nTéléphone WhatsApp : ${customerPhone}\nRégion/Ville : ${customerCity}\nQuartier/Adresse : ${customerAddress}\nOffre choisie : ${bundleTitle}\nMode de règlement : ${paymentMethod}\nFrais de livraison : Offerts (Gratuit)\nTotal à encaisser : ${rawPrice} FCFA` + (productUrl ? `\nLien Produit : ${productUrl}` : '') + (productImageUrl ? `\nPhoto Produit : ${productImageUrl}` : ''),
            note_attributes: [
              { name: "Mode de paiement", value: paymentMethod },
              { name: "Pack choisi", value: bundleTitle },
              { name: "Ville / Région", value: customerCity },
              { name: "Quartier / Adresse", value: customerAddress },
              { name: "Total FCFA", value: `${rawPrice} FCFA` },
              { name: "Lien Produit", value: productUrl || "-" },
              { name: "Photo Produit", value: productImageUrl || "-" },
              { name: "Source", value: "DropX Landing Page COD" }
            ],
            tags: 'COD, Senegal, Paiement-Livraison, DropX, 1-Clic'
          }
        };

        const shopifyRes = await fetch(`https://${creds.shopUrl}/admin/api/2024-04/orders.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': creds.adminToken
          },
          body: JSON.stringify(shopifyPayload)
        });

        if (shopifyRes.ok) {
          const shopifyData = await shopifyRes.json();
          if (shopifyData && shopifyData.order) {
            orderRecord.shopifyOrderId = shopifyData.order.id;
            orderRecord.shopifyOrderNumber = shopifyData.order.order_number ? `#${shopifyData.order.order_number}` : (shopifyData.order.name || `#${shopifyData.order.id}`);
            shopifySuccess = true;
            console.log("[Shopify Order Created Successfully]:", orderRecord.shopifyOrderNumber, "ID:", orderRecord.shopifyOrderId);
          }
        } else {
          const errBody = await shopifyRes.text();
          console.warn("[Shopify Order Creation Warn]:", errBody);
        }
      }
    } catch (shopifyErr) {
      console.error("[Shopify Sync Error]:", shopifyErr);
    }

    // Save to local storage for instant dashboard access
    saveLocalOrder(orderRecord);

    // Build prefilled WhatsApp message for merchant with clean text and article link (no emojis)
    const formattedPrice = new Intl.NumberFormat('fr-FR').format(totalPrice) + ' FCFA';
    const linkLine = productUrl ? `Lien de l'article : ${productUrl}\n\n` : '';

    const waText = encodeURIComponent(
      `Bonjour ShopX ! Je viens de passer une commande pour : ${productTitle} (${bundleTitle}).\n\n` +
      linkLine +
      `Montant total à régler : ${formattedPrice}\n` +
      `Frais de livraison : GRATUITE (Offerte)\n` +
      `Nom : ${customerName}\n` +
      `Téléphone : ${customerPhone}\n` +
      `Ville / Quartier : ${customerCity} - ${customerAddress}\n` +
      `Mode de paiement : ${paymentMethod}.\n\n` +
      `Merci de me confirmer la livraison !`
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
      const creds = await resolveShopifyCredentials();
      if (creds && creds.shopUrl && creds.adminToken) {
        connectedShopDomain = creds.shopUrl;
        const shopifyRes = await fetch(`https://${creds.shopUrl}/admin/api/2024-04/orders.json?status=any&limit=50`, {
          headers: {
            'X-Shopify-Access-Token': creds.adminToken,
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
                shopDomain: creds.shopUrl,
                customerName,
                customerPhone,
                customerCity,
                customerAddress,
                paymentMethod: so.gateway || (so.payment_gateway_names && so.payment_gateway_names.join(', ')) || 'Paiement à la livraison',
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
      } catch (shopifyErr) {
      console.warn("[Orders API Shopify Fetch Warning]:", shopifyErr.message);
    }

    // Get real local orders (excluding old mock demo IDs)
    const localOrders = getLocalOrders().filter(o => !String(o.id).startsWith('COD-1729000100'));

    // Deduplicate if any local order already has shopifyOrderId matching a shopifyOrder
    const existingShopifyIds = new Set(shopifyOrders.map(o => String(o.shopifyOrderId)));
    const uniqueLocalOrders = localOrders.filter(o => !o.shopifyOrderId || !existingShopifyIds.has(String(o.shopifyOrderId)));

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

// DELETE: Delete an order by orderId (from Shopify if connected, and from local files), or all orders
export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const queryId = url.searchParams.get('orderId');
    let bodyId = null;
    try {
      const body = await req.json();
      bodyId = body?.orderId;
    } catch (e) {}

    const orderId = bodyId || queryId;
    if (!orderId) {
      return NextResponse.json({ error: 'orderId requis' }, { status: 400, headers: corsHeaders });
    }

    // Get Shopify credentials
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

    let shopUrl = null;
    let adminToken = null;
    if (integration && integration.keyData) {
      const creds = JSON.parse(integration.keyData);
      shopUrl = (creds.domain || creds.shopUrl || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
      adminToken = creds.token || creds.accessToken || creds.clientSecret || '';
    }

    // CASE 1: Wipe all orders
    if (orderId === "ALL") {
      if (shopUrl && adminToken) {
        try {
          const shopifyRes = await fetch(`https://${shopUrl}/admin/api/2024-04/orders.json?status=any&limit=100`, {
            headers: { 'X-Shopify-Access-Token': adminToken, 'Content-Type': 'application/json' }
          });
          if (shopifyRes.ok) {
            const data = await shopifyRes.json();
            for (const so of data.orders || []) {
              try {
                if (!so.cancelled_at) {
                  await fetch(`https://${shopUrl}/admin/api/2024-04/orders/${so.id}/cancel.json`, {
                    method: 'POST',
                    headers: { 'X-Shopify-Access-Token': adminToken, 'Content-Type': 'application/json' }
                  });
                }
                await fetch(`https://${shopUrl}/admin/api/2024-04/orders/${so.id}.json`, {
                  method: 'DELETE',
                  headers: { 'X-Shopify-Access-Token': adminToken, 'Content-Type': 'application/json' }
                });
              } catch (delErr) {
                console.warn("[Shopify Delete Warning]:", delErr.message);
              }
            }
          }
        } catch (sErr) {
          console.warn("[Shopify Wipe Error]:", sErr.message);
        }
      }

      ensureDataFile();
      fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), 'utf8');
      fs.writeFileSync(OVERRIDES_FILE, JSON.stringify({}, null, 2), 'utf8');

      return NextResponse.json({
        success: true,
        message: 'Toutes les commandes ont été supprimées avec succès'
      }, { headers: corsHeaders });
    }

    // CASE 2: Delete specific order
    let shopifyId = null;
    if (String(orderId).startsWith('SHOPIFY-')) {
      shopifyId = String(orderId).replace('SHOPIFY-', '');
    } else if (!isNaN(Number(orderId)) && String(orderId).length > 8) {
      shopifyId = String(orderId);
    }

    let shopifyDeleted = false;
    if (shopifyId && shopUrl && adminToken) {
      try {
        await fetch(`https://${shopUrl}/admin/api/2024-04/orders/${shopifyId}/cancel.json`, {
          method: 'POST',
          headers: { 'X-Shopify-Access-Token': adminToken, 'Content-Type': 'application/json' }
        });
        const delRes = await fetch(`https://${shopUrl}/admin/api/2024-04/orders/${shopifyId}.json`, {
          method: 'DELETE',
          headers: { 'X-Shopify-Access-Token': adminToken, 'Content-Type': 'application/json' }
        });
        if (delRes.ok || delRes.status === 200 || delRes.status === 204) {
          shopifyDeleted = true;
        }
      } catch (sErr) {
        console.warn("[Shopify Delete Order Warn]:", sErr.message);
      }
    }

    // Remove from local files
    ensureDataFile();
    const orders = getLocalOrders();
    const filteredOrders = orders.filter(o => 
      String(o.id) !== String(orderId) && 
      (!shopifyId || String(o.shopifyOrderId) !== String(shopifyId))
    );
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(filteredOrders, null, 2), 'utf8');

    // Remove override
    const overrides = getOrderOverrides();
    delete overrides[orderId];
    if (shopifyId) delete overrides[shopifyId];
    fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(overrides, null, 2), 'utf8');

    return NextResponse.json({
      success: true,
      message: 'Commande supprimée avec succès',
      orderId,
      shopifyDeleted
    }, { headers: corsHeaders });

  } catch (error) {
    console.error("[Delete Order Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}


