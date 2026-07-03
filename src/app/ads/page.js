"use client";

import { useState } from 'react';
import { Camera, Gem, Wrench, Tag, Target, ArrowRight, Zap, RefreshCcw, LayoutTemplate } from 'lucide-react';
import styles from './Ads.module.css';

const questions = [
  {
    title: "How do you want to position your brand?",
    options: [
      { id: 'luxury', icon: Gem, label: 'Luxury & Premium' },
      { id: 'viral', icon: Zap, label: 'Viral & Trendy' },
      { id: 'utility', icon: Wrench, label: 'Problem Solving' },
      { id: 'discount', icon: Tag, label: 'High Volume Discount' }
    ]
  },
  {
    title: "What is your primary traffic source?",
    options: [
      { id: 'tiktok', icon: Camera, label: 'TikTok Organic/Ads' },
      { id: 'meta', icon: Target, label: 'Facebook & Instagram' },
      { id: 'pinterest', icon: LayoutTemplate, label: 'Pinterest Visuals' },
      { id: 'multi', icon: RefreshCcw, label: 'Omnichannel' }
    ]
  }
];

export default function AdStrategyQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [productName, setProductName] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSelect = async (optionId) => {
    const newAnswers = { ...answers, [currentStep]: optionId };
    setAnswers(newAnswers);
    
    if (currentStep < questions.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    } else {
      setShowResult(true);
      setLoading(true);
      try {
        const res = await fetch('/api/ads-strategy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productName: productName || "Generic Product",
            positioning: newAnswers[0],
            trafficSource: newAnswers[1]
          })
        });
        const data = await res.json();
        setResult(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Ad Strategy Builder</h1>
        <p className={styles.subtitle}>Let AI tailor your marketing and website tone.</p>
      </header>

      <div className={`glass-panel ${styles.quizCard}`}>
        {!showResult ? (
          <>
            <div className={styles.progress}>
              {questions.map((_, i) => (
                <div 
                  key={i} 
                  className={`${styles.progressDot} ${i === currentStep ? styles.active : ''} ${i < currentStep ? styles.completed : ''}`} 
                />
              ))}
            </div>

            {currentStep === 0 && (
              <div style={{marginBottom: '24px'}}>
                <label style={{fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', display: 'block'}}>What is your product? (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. Back Posture Corrector"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="input-field"
                  style={{width: '100%', marginBottom: '16px'}}
                />
              </div>
            )}

            <h2 className={styles.questionTitle}>{questions[currentStep].title}</h2>

            <div className={styles.optionsGrid}>
              {questions[currentStep].options.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button 
                    key={opt.id} 
                    className={styles.optionBtn}
                    onClick={() => handleSelect(opt.id)}
                  >
                    <Icon className={styles.optionIcon} size={32} />
                    <span className={styles.optionText}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className={styles.strategyResult}>
            <h2 className={styles.questionTitle}>Your AI Strategy is Ready</h2>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p>Generating custom strategy with AI...</p>
              </div>
            ) : result ? (
              <>
                <div className={styles.strategySection}>
                  <h3><Target size={20} /> Store Design Recommendations</h3>
                  <p>{result.storeDesign}</p>
                </div>

                <div className={styles.strategySection}>
                  <h3><Zap size={20} /> Ad Creative Angle</h3>
                  <p>{result.adCreative}</p>
                </div>
                
                <div className={styles.strategySection}>
                  <h3><Tag size={20} /> Copywriting / Hook</h3>
                  <p>{result.copywriting}</p>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                <p>Failed to load strategy.</p>
              </div>
            )}

            <div className={styles.actionBtns}>
              <button className="primary-button" style={{background: 'rgba(255,255,255,0.1)', color: '#fff'}} onClick={() => { setCurrentStep(0); setShowResult(false); setResult(null); }}>
                Retake Quiz
              </button>
              <button className="primary-button" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                Apply to Store & Generate <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
