(function() {
  // DropX Tracking Pixel
  // This script runs on the Shopify store to send traffic and cart data to DropX AI.

  // Helper to generate a random visitor ID if not present
  function getOrCreateVisitorId() {
    let vid = localStorage.getItem('dropx_visitor_id');
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now();
      localStorage.setItem('dropx_visitor_id', vid);
    }
    return vid;
  }

  const visitorId = getOrCreateVisitorId();
  // Get the shop domain from the script tag (e.g. ?shop=xxx.myshopify.com)
  const scriptTag = document.currentScript;
  let shopDomain = '';
  
  if (scriptTag && scriptTag.src) {
    const urlParams = new URL(scriptTag.src).searchParams;
    shopDomain = urlParams.get('shop');
  }

  if (!shopDomain && window.Shopify && window.Shopify.shop) {
    shopDomain = window.Shopify.shop;
  }

  // The base URL of your DropX API
  const DROPX_API_URL = 'https://dropx-ai.vercel.app/api/track';

  function sendEvent(eventName) {
    if (!shopDomain) return; // Cannot track without shop domain
    
    fetch(DROPX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        shop: shopDomain,
        event: eventName,
        visitorId: visitorId,
        path: window.location.pathname,
        url: window.location.href
      })
    }).catch(err => {
      // Silently fail if pixel cannot reach DropX
      // console.error('DropX Pixel Error:', err);
    });
  }

  // Track Page View
  sendEvent('page_view');

  // Track Add to Cart
  // Shopify often uses form actions or AJAX for add to cart.
  // We can listen to clicks on any button that looks like "Add to cart"
  document.addEventListener('click', function(e) {
    const target = e.target.closest('button, input[type="submit"], a');
    if (!target) return;
    
    const text = target.innerText || target.value || '';
    const name = target.name || '';
    
    if (
      text.toLowerCase().includes('ajouter au panier') || 
      text.toLowerCase().includes('add to cart') ||
      name.toLowerCase().includes('add')
    ) {
      sendEvent('add_to_cart');
    }
  });

})();
