"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, ArrowLeft, Check, Globe, Home, Users, Target, Droplets, Wind, BrainCircuit } from 'lucide-react';
import styles from './Analyzer.module.css';

const LANGUAGES = [
  { id: 'en', label: 'Anglais', flag: '🇺🇸' },
  { id: 'fr', label: 'Français', flag: '🇫🇷' },
  { id: 'de', label: 'Allemand', flag: '🇩🇪' },
  { id: 'es', label: 'Espagnol', flag: '🇪🇸' },
  { id: 'it', label: 'Italien', flag: '🇮🇹' },
  { id: 'pt', label: 'Portugais', flag: '🇵🇹' },
  { id: 'nl', label: 'Néerlandais', flag: '🇳🇱' },
  { id: 'pl', label: 'Polonais', flag: '🇵🇱' },
];

const PERSONAS = [
  { id: 'parent', icon: '👨‍👩‍👧‍👦', title: 'Parent de Famille', desc: 'Recherche un air sain et frais pour sa famille.' },
  { id: 'homeowner', icon: '🏠', title: 'Propriétaire de Maison', desc: 'Vise à améliorer son espace de vie et à éliminer l\'humidité.' },
  { id: 'worker', icon: '💼', title: 'Travailleur à Domicile', desc: 'Souhaite un environnement de travail sain et productif.' },
  { id: 'allergic', icon: '🤧', title: 'Personne Allergique', desc: 'Désire un air pur pour éviter les allergies et les problèmes respiratoires.' },
  { id: 'custom', icon: '✏️', title: 'Écris ta propre persona', desc: '' },
];

const ANGLES = [
  { id: 'air_quality', icon: <Wind size={20} color="#3b82f6" />, title: 'Qualité de l\'air intérieur', desc: 'Pour les parents soucieux de la santé de leur famille, un air pur est essentiel.' },
  { id: 'comfort', icon: <Home size={20} color="#f59e0b" />, title: 'Confort à la maison', desc: 'Créer un espace confortable à la maison est primordial pour le bien-être familial.' },
  { id: 'humidity', icon: <Droplets size={20} color="#10b981" />, title: 'Lutte contre l\'humidité', desc: 'Les parents veulent protéger leur famille des effets néfastes de l\'humidité.' },
  { id: 'deodorize', icon: <Target size={20} color="#ef4444" />, title: 'Déodorisation efficace', desc: 'Un environnement frais et sain est crucial pour le bonheur de la famille.' },
  { id: 'auto', icon: <BrainCircuit size={20} color="#d946ef" />, title: 'Laisser l\'IA décider', desc: 'On choisira le meilleur angle marketing pour ton produit.' },
];

export default function Analyzer() {
  const [url, setUrl] = useState('');
  const [state, setState] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const [barProgress, setBarProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(null);
  const router = useRouter();

  // Funnel selections
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[1]);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [selectedAngle, setSelectedAngle] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([0]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const historyId = params.get('id');
    if (historyId) {
      setState('loading');
      fetch(`/api/store/generate?id=${historyId}`)
        .then(res => res.json())
        .then(data => {
          if (data.activity && data.activity.metadata) {
            const meta = data.activity.metadata;
            const fakeResult = {
              product: {
                title: meta.title,
                image: meta.image,
                images: meta.images
              },
              analysis: {
                suggestedRetail: meta.price,
                commercialDescription: meta.description
              },
              landingPage: meta.landingPage || {}
            };
            setResult(fakeResult);
            setSelectedPhotos(meta.images ? meta.images.map((_, i) => i) : [0]);
            localStorage.setItem('dropx_preview_product', JSON.stringify(meta));
            setState('generation_complete');
          } else {
            setState('idle');
          }
        })
        .catch(err => {
          console.error('Failed to load history', err);
          setState('idle');
        });
    }
  }, []);

  useEffect(() => {
    if (state === 'results' && result?.analysis?.score) {
      const targetBars = Math.round((result.analysis.score / 100) * 50);
      
      const shrinkTimer = setInterval(() => {
        setBarProgress(prev => {
          if (prev <= targetBars) {
            clearInterval(shrinkTimer);
            return targetBars;
          }
          return prev - 1;
        });
      }, 40);
      return () => clearInterval(shrinkTimer);
    }
  }, [state, result]);

  const handleAnalyze = async () => {
    if (!url) return;
    setState('loading');
    setLoadingStep(0);
    setBarProgress(0);
    setError('');

    const timer = setInterval(() => {
      setLoadingStep(prev => prev < 4 ? prev + 1 : prev);
    }, 1500);

    const barTimer = setInterval(() => {
      setBarProgress(prev => prev < 45 ? prev + 1 : prev);
    }, 600);
    
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await res.json();
      clearInterval(timer);
      clearInterval(barTimer);
      
      if (!res.ok) throw new Error(data.error || 'Failed to analyze product');
      
      setLoadingStep(5);
      setBarProgress(50);
      setResult(data);
      if (data?.product?.images) {
        setSelectedPhotos(data.product.images.map((_, i) => i));
      }
      setState('results');
    } catch (err) {
      clearInterval(timer);
      clearInterval(barTimer);
      setError(err.message);
      setState('idle');
    }
  };

  const startGenerationLoader = () => {
    setState('generating_store');
    setGenerationProgress(0);
    setGenerationStep(0);

    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          
          let storeData = null;
          if (result?.product) {
            const availableImages = result.product.images && result.product.images.length > 0 ? result.product.images : [result.product.image];
            const chosenImages = selectedPhotos.map(idx => availableImages[idx]).filter(Boolean);
            
            storeData = {
              title: result.product.title,
              image: chosenImages[0] || result.product.image,
              images: chosenImages.length > 0 ? chosenImages : availableImages,
              price: result.analysis?.suggestedRetail || result.product.price || '49.99',
              compareAtPrice: result.product.compareAtPrice,
              options: result.product.options || [],
              description: result.analysis?.commercialDescription || '',
              landingPage: result.landingPage || {}
            };
            localStorage.setItem('dropx_preview_product', JSON.stringify(storeData));
          }

          // Log generation to database
          fetch('/api/store/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productName: result?.product?.title, storeData })
          }).catch(err => console.error('Failed to log generation:', err));

          setTimeout(() => setState('generation_complete'), 500);
          return 100;
        }
        
        // Update checklist steps based on progress
        if (prev > 20 && generationStep < 1) setGenerationStep(1);
        if (prev > 50 && generationStep < 2) setGenerationStep(2);
        if (prev > 80 && generationStep < 3) setGenerationStep(3);
        if (prev > 95 && generationStep < 4) setGenerationStep(4);
        
        return prev + 1;
      });
    }, 100);
  };

  const renderBarChart = (score) => {
    const bars = 50;
    const progress = barProgress;
    
    return (
      <div style={{display: 'flex', gap: '3px', marginTop: '16px', marginBottom: '32px', height: '40px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px'}}>
        {Array.from({length: bars}).map((_, i) => {
          let color = '#3b82f6';
          if (i > 10) color = '#10b981';
          if (i > 30) color = '#f59e0b';
          if (i > 40) color = '#ef4444';
          const isFilled = i < progress;
          return (
            <div key={i} style={{
                flex: 1, backgroundColor: isFilled ? color : 'rgba(255,255,255,0.05)',
                borderRadius: '2px', transition: 'background-color 0.1s ease',
                boxShadow: isFilled ? `0 0 8px ${color}80` : 'none'
              }} 
            />
          );
        })}
      </div>
    );
  };

  // COMMON TWO-COLUMN LAYOUT FOR SELECTION SCREENS
  const renderSelectionLayout = (title, subtitle, leftContent, rightContent, onBack, onContinue) => (
        <div style={{display: 'flex', height: '100%', width: '100%', background: '#090a0f', overflow: 'hidden'}}>
      {/* Left Column */}
      <div style={{flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', overflowY: 'auto', maxWidth: '600px', margin: '0 auto'}}>
        <button onClick={onBack} style={{background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', width: 'fit-content', marginBottom: '32px'}}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{fontSize: '24px', fontWeight: 'bold', color: '#fff', marginBottom: '8px'}}>{title}</h2>
        {subtitle && <p style={{color: 'rgba(255,255,255,0.5)', marginBottom: '32px'}}>{subtitle}</p>}
        
        <div style={{flex: 1}}>
          {leftContent}
        </div>

        <button 
          onClick={onContinue}
          style={{
            width: '100%', padding: '16px', fontSize: '16px', fontWeight: '600', 
            marginTop: '32px', background: '#fff', color: '#000', borderRadius: '8px', border: 'none', cursor: 'pointer'
          }}
        >
          Continuer
        </button>
      </div>

      {/* Right Column (Preview) */}
      <div style={{
        flex: 1, background: '#040508', borderLeft: '1px solid rgba(255,255,255,0.05)',
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
        backgroundSize: '24px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px'
      }}>
        {rightContent}
      </div>
    </div>
  );

  const isFullScreen = state !== 'idle';

  return (
    <div className={styles.container} style={isFullScreen ? { position: 'fixed', inset: 0, zIndex: 9999, background: '#090a0f', maxWidth: 'none', margin: 0, padding: 0 } : {}}>
      {state === 'idle' && (
        <>
          <header className={styles.header}>
            <h1 className={styles.title}>Générer ma boutique</h1>
            <p className={styles.subtitle}>Colle un lien AliExpress, Shopify ou concurrent pour générer ta boutique.</p>
          </header>
          <div className={styles.searchBox}>
            <input type="text" placeholder="https://fr.aliexpress.com/item/100500..." className={styles.input} value={url} onChange={(e) => setUrl(e.target.value)} />
            <button className={`primary-button ${styles.analyzeBtn}`} onClick={handleAnalyze}>
              <Search size={20} />
              Générer ma boutique
            </button>
          </div>
        </>
      )}

      {(state === 'loading' || state === 'results') && (
        <div style={{display: 'flex', height: '100%', width: '100%', background: '#090a0f', overflow: 'hidden'}}>
          <div style={{flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', maxWidth: '600px', margin: '0 auto'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px'}}>
              <button onClick={() => setState('idle')} style={{background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex'}}><ArrowLeft size={24} /></button>
              <h2 style={{fontSize: '24px', fontWeight: '600', color: '#fff', flex: 1, textAlign: 'center'}}>Ton score produit</h2>
              <span style={{fontSize: '32px', fontWeight: 'bold', color: '#fff'}}>{state === 'results' ? result?.analysis?.score : '--'}</span>
            </div>
            {renderBarChart(result?.analysis?.score)}
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px', flex: 1}}>
              {[
                { label: "Récupération des données", key: "dataRetrieval" },
                { label: "Contraintes de marge", key: "marginConstraints" },
                { label: "Valeur perçue", key: "perceivedValue" },
                { label: "Analyse des avis", key: "reviewsAnalysis" },
                { label: "Analyse des tendances", key: "trendsAnalysis" }
              ].map((step, idx) => {
                const isComplete = loadingStep > idx;
                const isCurrent = loadingStep === idx;
                const isExpanded = activeStep === idx;
                return (
                  <div key={idx} onDoubleClick={() => state === 'results' && setActiveStep(isExpanded ? null : idx)}
                       style={{
                         display: 'flex', flexDirection: 'column', background: isExpanded ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)', 
                         borderRadius: '8px', border: isExpanded ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255,255,255,0.02)',
                         cursor: state === 'results' ? 'pointer' : 'default', transition: 'all 0.3s ease'
                       }}>
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <div style={{width: '8px', height: '8px', borderRadius: '50%', backgroundColor: (isComplete || isCurrent) ? '#10b981' : 'rgba(255,255,255,0.2)'}}></div>
                        <span style={{color: (isComplete || isCurrent) ? '#fff' : 'rgba(255,255,255,0.4)', textDecoration: isComplete ? 'line-through' : 'none', transition: 'color 0.3s', fontWeight: 500}}>
                          {step.label}
                        </span>
                      </div>
                      {isComplete && <Check size={18} color="#10b981" />}
                      {isCurrent && state === 'loading' && <div className={styles.spinner} style={{width: '16px', height: '16px', borderWidth: '2px'}}></div>}
                    </div>
                    {isExpanded && result?.analysis?.details && result.analysis.details[step.key] && (
                      <div style={{padding: '0 16px 16px 36px', color: '#9ca3af', fontSize: '14px', lineHeight: 1.5}}>
                        {result.analysis.details[step.key]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {state === 'results' && (
              <button onClick={() => setState('select_language')} style={{width: '100%', padding: '16px', fontSize: '16px', fontWeight: '600', marginTop: '32px', background: '#fff', color: '#000', borderRadius: '8px', border: 'none', cursor: 'pointer'}}>
                Continuer
              </button>
            )}
          </div>
          <div style={{
            flex: 1, background: '#040508', borderLeft: '1px solid rgba(255,255,255,0.05)',
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
            backgroundSize: '24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px'
          }}>
            <div style={{
              width: '100%', maxWidth: '400px', aspectRatio: '1/1', background: 'rgba(255,255,255,0.02)',
              borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
              {state === 'results' && result?.product?.image ? (
                <img src={result.product.image} alt="Product preview" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              ) : (
                <div style={{textAlign: 'center', color: 'rgba(255,255,255,0.3)'}}>
                  <Sparkles size={48} style={{margin: '0 auto', marginBottom: '16px', opacity: 0.5}} />
                  <p>{state === 'loading' ? 'Analyse visuelle en cours...' : 'Aucune image'}</p>
                </div>
              )}
            </div>
            
            <p style={{color: '#8b5cf6', fontFamily: 'monospace', marginTop: '32px', fontSize: '14px', letterSpacing: '2px', textAlign: 'center'}}>
              {state === 'loading' ? 'Analyse en cours...' : 'Analyse terminée'}
            </p>
            
            {state === 'results' && result?.product?.title && (
              <h3 style={{color: '#fff', fontSize: '16px', fontWeight: '500', textAlign: 'center', marginTop: '16px', maxWidth: '400px', opacity: 0.8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
                {result.product.title}
              </h3>
            )}
          </div>
        </div>
      )}

      {state === 'select_language' && renderSelectionLayout(
        "Langue de ta boutique", null,
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
          {LANGUAGES.map(lang => (
            <button key={lang.id} onClick={() => setSelectedLanguage(lang)} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: selectedLanguage?.id === lang.id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)',
              border: selectedLanguage?.id === lang.id ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: '#fff', cursor: 'pointer', transition: 'all 0.2s'
            }}>
              <span style={{fontSize: '20px'}}>{lang.flag}</span>
              <span style={{fontSize: '16px', fontWeight: '500'}}>{lang.label}</span>
            </button>
          ))}
          <button style={{
            gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: '#fff', cursor: 'pointer', marginTop: '8px'
          }}>
            <Globe size={20} color="rgba(255,255,255,0.5)" />
            <div style={{textAlign: 'left'}}>
              <span style={{fontSize: '16px', fontWeight: '500', display: 'block'}}>Autre langue</span>
              <span style={{fontSize: '12px', color: 'rgba(255,255,255,0.4)'}}>Rechercher parmi 30+ langues</span>
            </div>
          </button>
        </div>,
        <div style={{background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '48px', borderRadius: '24px', textAlign: 'center', width: '300px'}}>
          <div style={{fontSize: '48px', marginBottom: '16px'}}>{selectedLanguage?.flag || '🌍'}</div>
          <h3 style={{fontSize: '20px', color: '#fff', fontWeight: '600', marginBottom: '8px'}}>{selectedLanguage?.label || 'Sélectionner'}</h3>
          <p style={{color: 'rgba(255,255,255,0.4)', fontSize: '14px'}}>Langue de la boutique</p>
        </div>,
        () => setState('results'),
        () => setState('select_persona')
      )}

      {state === 'select_persona' && (() => {
        const dynamicPersonas = result?.landingPage?.personas?.map((p, i) => ({ id: `dyn_p_${i}`, ...p })) || PERSONAS.slice(0, 4);
        const allPersonas = [
          ...dynamicPersonas,
          { id: 'auto', icon: '🤖', title: 'Laisser l\'IA décider', desc: 'On choisira la meilleure audience pour ton produit.' },
          { id: 'custom', icon: '✏️', title: 'Écris ta propre persona', desc: '' }
        ];
        
        // Auto-select first if null
        const currentPersona = selectedPersona || allPersonas[0];

        return renderSelectionLayout(
          "À qui tu vends ?", "Choisis le profil qui correspond à ton acheteur",
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            {allPersonas.map(p => (
              <button key={p.id} onClick={() => setSelectedPersona(p)} style={{
                display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: currentPersona?.id === p.id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)',
                border: currentPersona?.id === p.id ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: '#fff', cursor: 'pointer', textAlign: 'left'
              }}>
                <span style={{fontSize: '24px'}}>{p.icon}</span>
                <div>
                  <span style={{fontSize: '16px', fontWeight: '500', display: 'block', marginBottom: '4px'}}>{p.title}</span>
                  {p.desc && <span style={{fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4}}>{p.desc}</span>}
                </div>
              </button>
            ))}
          </div>,
          <div style={{background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '48px', borderRadius: '24px', textAlign: 'center', width: '300px'}}>
            <div style={{fontSize: '48px', marginBottom: '16px'}}>{currentPersona?.icon || '👤'}</div>
            <h3 style={{fontSize: '20px', color: '#fff', fontWeight: '600', marginBottom: '8px'}}>{currentPersona?.title || 'Persona'}</h3>
            <p style={{color: 'rgba(255,255,255,0.4)', fontSize: '14px'}}>Ton profil acheteur unique</p>
          </div>,
          () => setState('select_language'),
          () => setState('select_angle')
        );
      })()}

      {state === 'select_angle' && (() => {
        const dynamicAngles = result?.landingPage?.angles?.map((a, i) => ({ id: `dyn_a_${i}`, ...a })) || ANGLES.slice(0, 4);
        const allAngles = [
          ...dynamicAngles,
          { id: 'auto', icon: <BrainCircuit size={20} color="#d946ef" />, title: 'Laisser l\'IA décider', desc: 'On choisira le meilleur angle marketing pour ton produit.' }
        ];

        // Auto-select first if null
        const currentAngle = selectedAngle || allAngles[0];

        return renderSelectionLayout(
          "Comment tu veux le vendre ?", "Choisis un angle qui accroche tes clients",
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
            {allAngles.map(a => (
              <button key={a.id} onClick={() => setSelectedAngle(a)} style={{
                display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', background: currentAngle?.id === a.id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)',
                border: currentAngle?.id === a.id ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: '#fff', cursor: 'pointer', textAlign: 'left',
                gridColumn: a.id === 'auto' ? '1 / -1' : 'auto'
              }}>
                <div style={{fontSize: typeof a.icon === 'string' ? '24px' : 'inherit'}}>{a.icon}</div>
                <span style={{fontSize: '16px', fontWeight: '500', display: 'block'}}>{a.title}</span>
                <span style={{fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4}}>{a.desc}</span>
              </button>
            ))}
          </div>,
          <div style={{background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '48px', borderRadius: '24px', textAlign: 'center', width: '300px'}}>
            <div style={{fontSize: typeof currentAngle?.icon === 'string' ? '48px' : 'inherit', marginBottom: '16px'}}>
              {currentAngle?.icon || '🎯'}
            </div>
            <h3 style={{fontSize: '20px', color: '#fff', fontWeight: '600', marginBottom: '8px'}}>{currentAngle?.title || 'Angle marketing'}</h3>
            <p style={{color: 'rgba(255,255,255,0.4)', fontSize: '14px'}}>Ton angle marketing unique</p>
          </div>,
          () => setState('select_persona'),
          () => setState('select_photos')
        );
      })()}

      {state === 'select_photos' && (
        <div style={{height: '100%', width: '100%', background: '#090a0f', padding: '40px', display: 'flex', flexDirection: 'column', backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '24px 24px'}}>
          <div style={{display: 'flex', alignItems: 'center', marginBottom: '40px'}}>
            <button onClick={() => setState('select_angle')} style={{background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex'}}><ArrowLeft size={24} /></button>
            <div style={{flex: 1, textAlign: 'center'}}>
              <h2 style={{fontSize: '24px', fontWeight: 'bold', color: '#fff', marginBottom: '8px'}}>Tes images gratuites générées par IA</h2>
              <p style={{color: 'rgba(255,255,255,0.5)'}}>Sélectionne les images IA que tu veux utiliser dans ta boutique</p>
            </div>
            <div style={{width: 24}}></div>
          </div>
          
          {/* Photo Grid */}
          <div style={{display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 'auto'}}>
            {(result?.product?.images || [result?.product?.image]).map((imgUrl, i) => {
              const isSelected = selectedPhotos.includes(i);
              
              const toggleSelection = () => {
                setSelectedPhotos(prev => {
                  if (prev.includes(i)) {
                    // Prevent deselecting if it's the only one selected
                    if (prev.length === 1) return prev;
                    return prev.filter(idx => idx !== i);
                  } else {
                    return [...prev, i];
                  }
                });
              };
              
              return (
                <button 
                  key={i} 
                  onClick={toggleSelection}
                  style={{
                    width: '200px', height: '200px', 
                    background: 'rgba(255,255,255,0.05)', 
                    borderRadius: '12px', 
                    border: isSelected ? '3px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    padding: 0,
                    position: 'relative'
                  }}
                >
                  <img 
                    src={imgUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80"} 
                    alt={`Variante IA ${i + 1}`} 
                    style={{width: '100%', height: '100%', objectFit: 'cover'}} 
                  />
                  {isSelected && (
                    <div style={{position: 'absolute', top: '8px', right: '8px', background: '#10b981', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <Check size={14} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button onClick={startGenerationLoader} style={{width: '100%', maxWidth: '400px', margin: '0 auto', padding: '16px', fontSize: '18px', fontWeight: 'bold', background: '#fff', color: '#000', borderRadius: '12px', border: 'none', cursor: 'pointer'}}>
            Générer ma boutique
          </button>
        </div>
      )}

      {state === 'generating_store' && (
        <div style={{height: '100%', width: '100%', background: '#090a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '24px 24px'}}>
          {/* Circular Progress */}
          <div style={{position: 'relative', width: '160px', height: '160px', marginBottom: '40px'}}>
            <svg style={{width: '100%', height: '100%', transform: 'rotate(-90deg)'}}>
              <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle cx="80" cy="80" r="70" fill="none" stroke="#fff" strokeWidth="8" strokeDasharray="440" strokeDashoffset={440 - (440 * generationProgress) / 100} style={{transition: 'stroke-dashoffset 0.1s linear', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))'}} />
            </svg>
            <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
              <span style={{fontSize: '36px', fontWeight: 'bold', color: '#fff'}}>{generationProgress}</span>
              <span style={{fontSize: '12px', color: 'rgba(255,255,255,0.5)'}}>Terminé</span>
            </div>
            {/* Fake glow behind the circle */}
            <div style={{position: 'absolute', inset: -20, background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)', zIndex: -1, borderRadius: '50%'}}></div>
          </div>

          <h2 style={{fontSize: '28px', fontWeight: 'bold', color: '#fff', marginBottom: '8px', textAlign: 'center'}}>Préparation de ta boutique<br/>IA</h2>
          <p style={{color: 'rgba(255,255,255,0.6)', marginBottom: '40px'}}>Import des données produit</p>

          {/* Checklist */}
          <div style={{width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px'}}>
            {[
              "Import des données produit...",
              "L'IA fait une étude de marché...",
              "L'IA rédige le contenu de vente...",
              "L'IA crée le thème de la boutique...",
              "Finalisation de la boutique..."
            ].map((step, idx) => {
              const isActive = generationStep === idx;
              const isDone = generationStep > idx;
              return (
                <div key={idx} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                  <span style={{color: isDone || isActive ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: '14px', transition: 'color 0.3s'}}>
                    {step}
                  </span>
                  {isActive && <div className={styles.spinner} style={{width: '14px', height: '14px', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#fff'}}></div>}
                  {isDone && <Check size={16} color="#fff" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {state === 'generation_complete' && (
        <div style={{height: '100%', width: '100%', background: '#090a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <Sparkles size={64} color="#10b981" style={{marginBottom: '24px'}} />
          <h2 style={{fontSize: '32px', fontWeight: 'bold', color: '#fff', marginBottom: '16px'}}>Ta boutique est prête !</h2>
          <p style={{color: 'rgba(255,255,255,0.6)', marginBottom: '40px'}}>Le thème, le copywriting et les images ont été configurés.</p>
          <button onClick={() => router.push('/preview')} style={{padding: '16px 32px', fontSize: '18px', fontWeight: 'bold', background: '#10b981', color: '#fff', borderRadius: '12px', border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'}}>
            Voir ma boutique
          </button>
        </div>
      )}
    </div>
  );
}
