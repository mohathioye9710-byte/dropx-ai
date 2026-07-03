"use client";

import { useState } from 'react';
import { Camera, Target, LayoutTemplate, KeyRound, CheckCircle2 } from 'lucide-react';

const platforms = [
  { id: 'tiktok', name: 'TikTok Ads Manager', icon: Camera, color: '#000000', gradient: 'linear-gradient(45deg, #00f2fe 0%, #4facfe 100%)' },
  { id: 'meta', name: 'Meta Business Suite', icon: Target, color: '#1877f2', gradient: 'linear-gradient(45deg, #1877f2 0%, #00c6ff 100%)' },
  { id: 'pinterest', name: 'Pinterest Ads', icon: LayoutTemplate, color: '#e60023', gradient: 'linear-gradient(45deg, #e60023 0%, #ff4b2b 100%)' }
];

export default function SocialMedia() {
  const [keys, setKeys] = useState({ tiktok: '', meta: '', pinterest: '' });
  const [saved, setSaved] = useState({ tiktok: false, meta: false, pinterest: false });

  const handleSave = (id) => {
    setSaved({ ...saved, [id]: true });
    setTimeout(() => {
      setSaved({ ...saved, [id]: false });
    }, 2000);
  };

  return (
    <div style={{maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px'}}>
      <div>
        <h1 style={{fontSize: '32px', fontWeight: '800', marginBottom: '8px'}}>Social Media Accounts</h1>
        <p style={{color: 'var(--text-secondary)'}}>Link your ad accounts to allow DropX AI to automatically draft ad campaigns.</p>
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
        {platforms.map(platform => {
          const Icon = platform.icon;
          const isSaved = saved[platform.id];
          
          return (
            <div key={platform.id} className="glass-panel" style={{padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px', 
                  background: platform.gradient, display: 'flex', 
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon size={24} color="#fff" />
                </div>
                <h2 style={{fontSize: '20px', fontWeight: '600'}}>{platform.name}</h2>
              </div>
              
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <div style={{position: 'relative', flex: 1}}>
                  <KeyRound size={18} style={{position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)'}} />
                  <input 
                    type="password" 
                    className="input-field" 
                    style={{paddingLeft: '40px'}}
                    placeholder={`Enter ${platform.name} API Key`}
                    value={keys[platform.id]}
                    onChange={(e) => setKeys({...keys, [platform.id]: e.target.value})}
                  />
                </div>
                <button 
                  className="primary-button" 
                  style={{
                    background: isSaved ? '#10b981' : undefined,
                    minWidth: '120px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onClick={() => handleSave(platform.id)}
                  disabled={!keys[platform.id]}
                >
                  {isSaved ? <><CheckCircle2 size={18} /> Saved</> : 'Save Key'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
