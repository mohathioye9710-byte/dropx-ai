"use client";

import { useState } from 'react';
import { Sparkles, Loader2, PackageOpen, DollarSign, Star, ShoppingBag } from 'lucide-react';
import styles from './Generate.module.css';

export default function Generate() {
  const [formData, setFormData] = useState({ productName: '', productFeatures: '', targetAudience: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!formData.productName) return;
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputSection}>
        <div className={styles.header}>
          <h1>AI Content Generator</h1>
          <p>Let AI decide the best angles, descriptions, and pricing for your product.</p>
        </div>

        <div className={`glass-panel`} style={{padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px'}}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Product Name</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Posture Corrector Pro"
              value={formData.productName}
              onChange={e => setFormData({...formData, productName: e.target.value})}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Key Features (Optional)</label>
            <textarea 
              className={`input-field ${styles.textarea}`} 
              placeholder="e.g. Adjustable straps, breathable material, invisible under clothes..."
              value={formData.productFeatures}
              onChange={e => setFormData({...formData, productFeatures: e.target.value})}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Target Audience (Optional)</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Office workers, gamers..."
              value={formData.targetAudience}
              onChange={e => setFormData({...formData, targetAudience: e.target.value})}
            />
          </div>

          <button 
            className={`primary-button ${styles.generateBtn}`} 
            onClick={handleGenerate}
            disabled={loading || !formData.productName}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            {loading ? 'AI is thinking...' : 'Let AI Decide'}
          </button>
          
          {error && <div className={styles.errorBox}>{error}</div>}
        </div>
      </div>

      <div className={styles.resultSection}>
        <div className={`glass-panel ${styles.resultCard}`} style={{minHeight: '400px'}}>
          {!result && !loading ? (
            <div className={styles.placeholder}>
              <Sparkles size={48} style={{opacity: 0.5}} />
              <h3>Awaiting AI Input</h3>
              <p>Fill out the details on the left and click "Let AI Decide" to generate a full product listing.</p>
            </div>
          ) : loading ? (
            <div className={styles.placeholder}>
              <Loader2 className="animate-spin" size={48} style={{color: 'var(--accent-color)'}} />
              <h3>Crafting the perfect listing...</h3>
            </div>
          ) : result && (
            <>
              <h2 className={styles.generatedTitle}>{result.title}</h2>
              
              <div className={styles.pricingBlock}>
                <DollarSign size={24} style={{color: '#10b981'}} />
                <div className={styles.priceItem}>
                  <span className={styles.label}>Suggested Retail</span>
                  <span className={styles.retailPrice}>${result.pricing.retail}</span>
                </div>
                <div className={styles.priceItem}>
                  <span className={styles.label}>Compare At</span>
                  <span className={styles.comparePrice}>${result.pricing.compareAt}</span>
                </div>
              </div>

              <div>
                <h3 className={styles.sectionTitle}><PackageOpen size={18} /> Optimized Description</h3>
                <div className={styles.description}>{result.description}</div>
              </div>

              <div>
                <h3 className={styles.sectionTitle}><ShoppingBag size={18} /> Bundle Strategies</h3>
                <div className={styles.bundleList}>
                  {result.bundles.map((bundle, idx) => (
                    <div key={idx} className={styles.bundleItem}>
                      <div className={styles.bundleName}>{bundle.name}</div>
                      <div style={{color: 'var(--text-secondary)', fontSize: '14px'}}>{bundle.offer}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className={styles.sectionTitle}><Star size={18} /> AI-Generated Reviews</h3>
                <div className={styles.reviewsList}>
                  {result.reviews.map((review, idx) => (
                    <div key={idx} className={styles.reviewItem}>
                      <div className={styles.reviewHeader}>
                        <span className={styles.reviewAuthor}>{review.author}</span>
                        <span className={styles.stars}>{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</span>
                      </div>
                      <p style={{color: 'var(--text-secondary)', fontSize: '14px'}}>"{review.text}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
