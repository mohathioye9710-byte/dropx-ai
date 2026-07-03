"use client";

import { useState, useEffect } from 'react';
import { Store, Link2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ShopifySync() {
  const [storeUrl, setStoreUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [status, setStatus] = useState('loading'); // loading, disconnected, connecting, connected
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Vérifier l'état de la connexion au chargement
    fetch('/api/integrations/shopify')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'connected') {
          setStatus('connected');
          setStoreUrl(data.shopUrl || '');
          setClientId(data.clientId || '');
          setClientSecret(data.clientSecret || '');
        } else {
          setStatus('disconnected');
        }
      })
      .catch(err => {
        console.error(err);
        setStatus('disconnected');
      });
  }, []);

  const handleConnect = async () => {
    setStatus('connecting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/integrations/shopify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopUrl: storeUrl,
          clientId,
          clientSecret
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (clientSecret.startsWith('shpat_')) {
          // It's already an admin token, no OAuth needed
          setStatus('connected');
        } else {
          // Dev Dashboard flow (shpss_) -> redirect to OAuth
          const redirectUri = encodeURIComponent(`http://localhost:3000/api/shopify/callback`);
          const cleanShop = storeUrl.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
          window.location.href = `https://${cleanShop}/admin/oauth/authorize?client_id=${clientId}&scope=read_products,write_products&redirect_uri=${redirectUri}`;
        }
      } else {
        setStatus('disconnected');
        setErrorMsg(data.error || "Une erreur est survenue lors de la connexion.");
      }
    } catch (err) {
      console.error(err);
      setStatus('disconnected');
      setErrorMsg("Impossible de joindre le serveur.");
    }
  };

  return (
    <div style={{maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px'}}>
      <div>
        <h1 style={{fontSize: '32px', fontWeight: '800', marginBottom: '8px'}}>Shopify Integration</h1>
        <p style={{color: 'var(--text-secondary)'}}>Connect your store to enable 1-click publishing for AI-generated products.</p>
      </div>

      <div className="glass-panel" style={{padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '24px', borderBottom: '1px solid var(--panel-border)'}}>
          <Store size={32} style={{color: '#95bf47'}} />
          <div>
            <h2 style={{fontSize: '20px', fontWeight: '600'}}>Store Connection</h2>
            <p style={{color: 'var(--text-secondary)', fontSize: '14px'}}>Status: 
              <span style={{
                color: status === 'connected' ? '#10b981' : (status === 'disconnected' ? '#f59e0b' : '#3b82f6'),
                marginLeft: '6px',
                fontWeight: '600'
              }}>
                {status.toUpperCase()}
              </span>
            </p>
          </div>
        </div>

        {errorMsg && (
          <div style={{padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '14px'}}>
            {errorMsg}
          </div>
        )}

        <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <label style={{fontSize: '14px', fontWeight: '600'}}>Shopify Store URL (e.g., mystore.myshopify.com)</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="mystore.myshopify.com"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              disabled={status === 'connected' || status === 'loading'}
            />
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <label style={{fontSize: '14px', fontWeight: '600'}}>Clé API (ID Client)</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ex: 748e66352e49b7ff..."
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={status === 'connected' || status === 'loading'}
            />
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <label style={{fontSize: '14px', fontWeight: '600'}}>Clé Secrète (Client Secret) OU Jeton Admin (shpat_...)</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="shpss_... ou shpat_..."
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              disabled={status === 'connected' || status === 'loading'}
            />
            <p style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Si vous utilisez le Dev Dashboard (shpss_), nous allons vous rediriger vers Shopify pour autoriser l'application.</p>
          </div>
        </div>

        <div style={{display: 'flex', gap: '16px'}}>
          <button 
            className="primary-button" 
            onClick={handleConnect}
            disabled={status === 'connected' || status === 'loading' || status === 'connecting' || !storeUrl || !clientSecret}
            style={{
              flex: 1,
              background: status === 'connected' ? '#10b981' : undefined,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {status === 'connected' ? <CheckCircle2 size={20} /> : (status === 'connecting' || status === 'loading' ? <Loader2 size={20} className="animate-spin" /> : <Link2 size={20} />)}
            {status === 'connected' ? 'Store Connected' : (status === 'connecting' ? 'Connecting...' : 'Connect Store')}
          </button>
          
          {status === 'connected' && (
            <button 
              onClick={() => setStatus('disconnected')}
              style={{
                padding: '0 24px',
                background: 'transparent',
                color: '#ef4444',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Modifier
            </button>
          )}
        </div>

        {/* Lien de secours si la redirection automatique échoue */}
        {clientSecret && clientSecret.startsWith('shpss_') && status === 'connected' && (
          <div style={{ marginTop: '16px', padding: '16px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #f59e0b' }}>
            <p style={{ fontSize: '14px', color: '#b45309', marginBottom: '12px' }}>
              <strong>Étape Finale Requise :</strong> Shopify a besoin de votre autorisation pour finaliser la connexion de cette application Dev Dashboard.
            </p>
            <a 
              href={`https://${storeUrl.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')}/admin/oauth/authorize?client_id=${clientId}&scope=read_products,write_products&redirect_uri=${encodeURIComponent('http://localhost:3000/api/shopify/callback')}`}
              style={{
                display: 'inline-block',
                background: '#f59e0b',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 'bold',
                textDecoration: 'none',
                fontSize: '14px'
              }}
            >
              👉 Cliquez ici pour autoriser l'application
            </a>
          </div>
        )}
      </div>

      <div className="glass-panel" style={{padding: '32px'}}>
        <h2 style={{fontSize: '20px', fontWeight: '600', marginBottom: '16px'}}>Publish Queue</h2>
        {status === 'connected' ? (
          <div style={{textAlign: 'center', color: 'var(--text-secondary)', padding: '32px 0'}}>
            No products in the queue. Go to AI Generator to create products.
          </div>
        ) : (
          <div style={{display: 'flex', alignItems: 'center', gap: '12px', color: '#f59e0b', padding: '16px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px'}}>
            <AlertCircle size={20} />
            <span>Connect your store above to view and publish products.</span>
          </div>
        )}
      </div>
    </div>
  );
}
