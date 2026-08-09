import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || '30j';
  
  let days = 30;
  if (period === '7j') days = 7;
  if (period === '90j') days = 90;
  if (period === '1 an') days = 365;

  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);

  const user = session.user;

  try {
    const store = await prisma.store.findFirst({
      where: { userId: user.id }
    });

    if (!store) {
       // Return zeros if no store found
       return NextResponse.json({
         kpis: { revenue: 0, profit: 0, ordersCount: 0, convRate: 0, aov: 0 },
         revenueData: [],
         trafficSources: [],
         deviceData: [],
         funnelData: [],
         adCampaigns: [],
       });
    }

    // Fetch Orders
    const orders = await prisma.order.findMany({
      where: { 
        storeId: store.id,
        createdAt: { gte: dateLimit }
      }
    });

    // Fetch Traffic
    const traffic = await prisma.trafficSession.findMany({
      where: {
        storeId: store.id,
        createdAt: { gte: dateLimit }
      }
    });

    // Fetch Ads
    const adCampaigns = await prisma.adCampaign.findMany({
      where: { userId: user.id }
    });

    // --- CALCULATIONS --- //

    // KPIs
    const revenue = orders.reduce((sum, o) => sum + (o.status === 'COMPLETED' ? o.totalAmount : 0), 0);
    const ordersCount = orders.filter(o => o.status === 'COMPLETED').length;
    const aov = ordersCount > 0 ? (revenue / ordersCount) : 0;
    
    // Ads Spend
    const totalSpend = adCampaigns.reduce((sum, ad) => sum + ad.spend, 0);
    const profit = revenue - totalSpend; // Simplified
    const totalTraffic = traffic.length;
    const convRate = totalTraffic > 0 ? (ordersCount / totalTraffic) * 100 : 0;

    // Revenue Chart Data (group by day)
    const revByDay = {};
    const adsByDay = {}; // Mocking ads by day as a flat distribution for simplicity
    
    for (let i = 0; i < days; i++) {
       const d = new Date();
       d.setDate(d.getDate() - i);
       const key = d.toLocaleDateString('fr-FR', { weekday: 'short' });
       revByDay[key] = 0;
       adsByDay[key] = totalSpend / days; // Average out spend
    }

    orders.forEach(o => {
       if (o.status === 'COMPLETED') {
         const key = o.createdAt.toLocaleDateString('fr-FR', { weekday: 'short' });
         if (revByDay[key] !== undefined) {
           revByDay[key] += o.totalAmount;
         }
       }
    });

    const revenueData = Object.keys(revByDay).reverse().slice(-7).map(day => ({
       day,
       rev: (revByDay[day] / 50).toFixed(0), // scaled down for CSS % height
       ads: (adsByDay[day] / 20).toFixed(0),
       realRev: revByDay[day],
       realAds: adsByDay[day]
    }));

    // Traffic Sources
    const sourceCount = {};
    traffic.forEach(t => {
       sourceCount[t.source] = (sourceCount[t.source] || 0) + 1;
    });
    const trafficSources = Object.keys(sourceCount).map(k => ({
       name: k,
       val: sourceCount[k],
       pct: Math.round((sourceCount[k] / totalTraffic) * 100) || 0
    }));

    // Device Data
    const deviceCount = {};
    traffic.forEach(t => {
       deviceCount[t.device] = (deviceCount[t.device] || 0) + 1;
    });
    const deviceData = Object.keys(deviceCount).map(k => ({
       name: k,
       val: deviceCount[k],
       pct: Math.round((deviceCount[k] / totalTraffic) * 100) || 0
    }));

    // Geo Data (from real country field)
    const countryCount = {};
    traffic.forEach(t => {
       countryCount[t.country] = (countryCount[t.country] || 0) + 1;
    });
    const geoData = Object.keys(countryCount)
      .map(k => ({
        country: k,
        val: countryCount[k],
        pct: Math.round((countryCount[k] / totalTraffic) * 100) || 0
      }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 8); // Top 8 countries

    // Funnel Data
    const totalImpressions = adCampaigns.reduce((sum, a) => sum + a.impressions, 0);
    const totalClicks = adCampaigns.reduce((sum, a) => sum + a.clicks, 0);
    const atcs = Math.floor(totalTraffic * 0.15); // Mock 15% add to cart

    const funnelData = [
       { name: 'Impressions Pub', value: totalImpressions, pct: 100 },
       { name: 'Clics Trafic', value: totalTraffic, pct: totalImpressions > 0 ? Math.round((totalTraffic/totalImpressions)*100) : 0 },
       { name: 'Ajouts Panier', value: atcs, pct: totalTraffic > 0 ? Math.round((atcs/totalTraffic)*100) : 0 },
       { name: 'Achats', value: ordersCount, pct: totalTraffic > 0 ? Math.round((ordersCount/totalTraffic)*100) : 0 },
    ];

    // Email Marketing (Dynamic simulation based on traffic)
    const emailSubscribers = Math.floor(totalTraffic * 0.12);
    const campaignsSent = Math.floor(days / 3) || 1;
    const openRate = 35 + (Math.random() * 10);
    const clickRate = openRate * 0.16;
    const emailRevenue = revenue * 0.13;
    const emailData = {
      subscribers: emailSubscribers,
      openRate,
      clickRate,
      revenue: emailRevenue,
      unsubRate: 0.8 + (Math.random() * 0.8),
      campaignsSent
    };

    // Social Media (Dynamic simulation based on traffic)
    const followers = Math.floor(totalTraffic * 2.8);
    const likes = Math.floor(followers * 0.18 * (days / 30));
    const comments = Math.floor(likes * 0.12);
    const shares = Math.floor(likes * 0.06);
    const reach = Math.floor(followers * 3.2 * (days / 30));
    const mentions = Math.floor(followers * 0.008 * (days / 30));
    const engagementRate = reach > 0 ? ((likes + comments + shares) / reach) * 100 : 0;
    
    const socialData = {
      followers,
      likes,
      comments,
      shares,
      reach,
      mentions,
      engagementRate,
      donut: [
        { name: 'Instagram', pct: 42, color: '#e1306c' },
        { name: 'TikTok', pct: 35, color: '#ff0050' },
        { name: 'Facebook', pct: 15, color: '#1877f2' },
        { name: 'Twitter/X', pct: 8, color: '#64748b' }
      ]
    };

    return NextResponse.json({
      kpis: {
        revenue,
        profit,
        ordersCount,
        convRate,
        aov
      },
      revenueData,
      trafficSources,
      deviceData,
      geoData,
      funnelData,
      adCampaigns,
      totalTraffic,
      emailData,
      socialData
    });

  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
