"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, ArrowLeft, Check, Globe, Home, Users, Target, Droplets, Wind, BrainCircuit, Wand2, Link as LinkIcon } from 'lucide-react';

const LANGUAGES = [
  { id: 'en', label: 'Anglais', flag: '🇺🇸' },
  { id: 'fr', label: 'Français', flag: '🇫🇷' },
  { id: 'de', label: 'Allemand', flag: '🇩🇪' },
  { id: 'es', label: 'Espagnol', flag: '🇪🇸' },
  { id: 'it', label: 'Italien', flag: '🇮🇹' },
];

const PERSONAS = [
  { id: 'parent', icon: '👨‍👩‍👧‍👦', title: 'Parent de Famille', desc: 'Recherche un air sain et frais pour sa famille.' },
  { id: 'homeowner', icon: '🏠', title: 'Propriétaire de Maison', desc: 'Vise à améliorer son espace de vie et à éliminer l\'humidité.' },
  { id: 'worker', icon: '💼', title: 'Travailleur à Domicile', desc: 'Souhaite un environnement de travail sain et productif.' },
  { id: 'allergic', icon: '🤧', title: 'Personne Allergique', desc: 'Désire un air pur pour éviter les allergies et les problèmes respiratoires.' },
];

const ANGLES = [
  { id: 'air_quality', icon: <Wind size={20} color="#a1a1aa" />, title: 'Qualité de l\'air intérieur', desc: 'Pour les parents soucieux de la santé de leur famille, un air pur est essentiel.' },
  { id: 'comfort', icon: <Home size={20} color="#a1a1aa" />, title: 'Confort à la maison', desc: 'Créer un espace confortable à la maison est primordial pour le bien-être familial.' },
  { id: 'humidity', icon: <Droplets size={20} color="#a1a1aa" />, title: 'Lutte contre l\'humidité', desc: 'Les parents veulent protéger leur famille des effets néfastes de l\'humidité.' },
  { id: 'deodorize', icon: <Target size={20} color="#a1a1aa" />, title: 'Déodorisation efficace', desc: 'Un environnement frais et sain est crucial pour le bonheur de la famille.' },
];

export default function Analyzer() {
  const [url, setUrl] = useState('');
  const [state, setState] = useState('idle'); // idle, loading, results, select_language, select_persona, select_angle, select_photos, generating_store, generation_complete
  const [importMethod, setImportMethod] = useState('link'); // 'link', 'scratch'
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  
  const [loadingStep, setLoadingStep] = useState(0);
  const [activeStep, setActiveStep] = useState(null);
  const router = useRouter();

  // Funnel selections
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[1]);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [selectedAngle, setSelectedAngle] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([0]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState(0);
  
  // AI thinking state
  const [isAiThinking, setIsAiThinking] = useState(null); // 'persona', 'angle'

  // Layout linear progress
  const getProgressPercentage = () => {
    switch (state) {
      case 'idle': return 10;
      case 'loading': return 25;
      case 'results': return 40;
      case 'select_language': return 55;
      case 'select_persona': return 70;
      case 'select_angle': return 85;
      case 'select_photos': return 95;
      default: return 0;
    }
  };

  const handleAnalyze = async () => {
    if (!url) return;
    setState('loading');
    setLoadingStep(0);
    setError('');

    const timer = setInterval(() => {
      setLoadingStep(prev => prev < 4 ? prev + 1 : prev);
    }, 1500);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await res.json();
      clearInterval(timer);
      
      if (!res.ok) throw new Error(data.error || 'Failed to analyze product');
      
      setLoadingStep(5);
      setResult(data);
      if (data?.product?.images) {
        setSelectedPhotos(data.product.images.map((_, i) => i));
      }
      setState('results');
    } catch (err) {
      clearInterval(timer);
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
              landingPage: result.landingPage || {},
              persona: selectedPersona?.id === 'auto' ? (result?.landingPage?.personas?.[0] || selectedPersona) : selectedPersona,
              angle: selectedAngle?.id === 'auto' ? (result?.landingPage?.angles?.[0] || selectedAngle) : selectedAngle,
            };
            localStorage.setItem('dropx_preview_product', JSON.stringify(storeData));
          }

          fetch('/api/store/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productName: result?.product?.title, storeData })
          }).catch(err => console.error('Failed to log generation:', err));

          setTimeout(() => router.push('/preview'), 500);
          return 100;
        }
        
        if (prev > 20 && generationStep < 1) setGenerationStep(1);
        if (prev > 50 && generationStep < 2) setGenerationStep(2);
        if (prev > 80 && generationStep < 3) setGenerationStep(3);
        if (prev > 95 && generationStep < 4) setGenerationStep(4);
        
        return prev + 1;
      });
    }, 100);
  };

  // COMMON TWO-COLUMN LAYOUT FOR SELECTION SCREENS
  const renderSelectionLayout = (title, subtitle, leftContent, rightContent, onBack, onContinue) => (
    <div style={{display: 'flex', height: '100%', width: '100%', background: '#000000', overflow: 'hidden'}}>
      
      {/* Top Linear Progress */}
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#111', zIndex: 50}}>
        <div style={{height: '100%', background: '#fff', width: `${getProgressPercentage()}%`, transition: 'width 0.3s ease'}}></div>
      </div>

      {/* Left Column */}
      <div style={{flex: 1, padding: '60px 40px', display: 'flex', flexDirection: 'column', overflowY: 'auto', maxWidth: '700px', margin: '0 auto', position: 'relative', zIndex: 10}}>
        
        <div style={{display: 'flex', alignItems: 'center', marginBottom: '48px'}}>
          <button onClick={onBack} style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '12px', marginRight: '24px', transition: 'background 0.2s'}}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{fontSize: '28px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px'}}>{title}</h2>
            {subtitle && <p style={{color: '#a1a1aa', fontSize: '15px', marginTop: '4px'}}>{subtitle}</p>}
          </div>
        </div>
        
        <div style={{flex: 1}}>
          {leftContent}
        </div>

        {onContinue && (
          <button 
            onClick={onContinue}
            style={{
              width: '100%', padding: '18px', fontSize: '16px', fontWeight: '700', 
              marginTop: '48px', background: '#ffffff', color: '#000000', borderRadius: '14px', border: 'none', cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#e5e5e5'}
            onMouseOut={(e) => e.target.style.background = '#ffffff'}
          >
            Continuer
          </button>
        )}
      </div>

      {/* Right Column (Preview/Abstract) */}
      <div style={{
        flex: 1, background: '#050505', borderLeft: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px'
      }}>
        {rightContent}
      </div>
    </div>
  );

  const isFullScreen = state !== 'idle';

  return (
    <div style={{height: '100vh', width: '100vw', background: '#000000', color: '#ffffff', fontFamily: 'var(--font-family)', overflow: 'hidden', position: 'fixed', inset: 0, zIndex: 9999}}>
      
      {state === 'idle' && (
        <div style={{height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
          
          <button onClick={() => router.push('/')} style={{position: 'absolute', top: '40px', left: '40px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: '600'}}>
            <ArrowLeft size={16} /> Retour
          </button>

          <div style={{maxWidth: '600px', width: '100%', padding: '20px'}}>
            <h1 style={{fontSize: '36px', fontWeight: '800', letterSpacing: '-1px', marginBottom: '16px', textAlign: 'center'}}>Comment veux-tu démarrer ?</h1>
            <p style={{color: '#a1a1aa', fontSize: '16px', textAlign: 'center', marginBottom: '48px'}}>
              L'IA génère ta boutique complète en quelques minutes.
            </p>

            <div style={{display: 'flex', gap: '16px', marginBottom: '32px'}}>
              <button 
                onClick={() => setImportMethod('link')}
                style={{flex: 1, padding: '24px', background: importMethod === 'link' ? '#111' : '#050505', border: importMethod === 'link' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s'}}
              >
                <div style={{background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px'}}>
                  <LinkIcon size={24} color="#fff" />
                </div>
                <span style={{fontSize: '16px', fontWeight: '600', color: '#fff'}}>Importer un produit</span>
              </button>
              
              <button 
                onClick={() => setImportMethod('scratch')}
                style={{flex: 1, padding: '24px', background: importMethod === 'scratch' ? '#111' : '#050505', border: importMethod === 'scratch' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s'}}
              >
                <div style={{background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px'}}>
                  <Wand2 size={24} color="#fff" />
                </div>
                <span style={{fontSize: '16px', fontWeight: '600', color: '#fff'}}>Créer de A à Z</span>
              </button>
            </div>

            {importMethod === 'link' && (
              <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                <input 
                  type="text" 
                  placeholder="Colle ton lien fournisseur (AliExpress, Amazon, CJDropshipping...)" 
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)} 
                  style={{width: '100%', padding: '18px 24px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: '#fff', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s'}}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button 
                  onClick={handleAnalyze}
                  style={{width: '100%', padding: '18px', fontSize: '16px', fontWeight: '700', background: '#ffffff', color: '#000000', borderRadius: '14px', border: 'none', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}
                  onMouseOver={(e) => e.target.style.background = '#e5e5e5'}
                  onMouseOut={(e) => e.target.style.background = '#ffffff'}
                >
                  <Sparkles size={18} /> Générer ma boutique
                </button>
              </div>
            )}
            {importMethod === 'scratch' && (
              <p style={{color: '#a1a1aa', textAlign: 'center', fontSize: '15px'}}>La création de A à Z (sans produit existant) arrive bientôt.</p>
            )}

            {error && (
              <div style={{marginTop: '16px', padding: '16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', textAlign: 'center', fontSize: '14px'}}>
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {(state === 'loading' || state === 'results') && renderSelectionLayout(
        "Ton produit", "L'IA analyse le produit et ses possibilités",
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
              <div key={idx} onClick={() => state === 'results' && setActiveStep(isExpanded ? null : idx)}
                    style={{
                      display: 'flex', flexDirection: 'column', background: '#111', 
                      borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)',
                      cursor: state === 'results' ? 'pointer' : 'default', transition: 'border-color 0.2s'
                    }}
                    onMouseOver={(e) => { if(state==='results') e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
                    onMouseOut={(e) => { if(state==='results') e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}
              >
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                    <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: (isComplete || isCurrent) ? '#fff' : 'rgba(255,255,255,0.2)'}}></div>
                    <span style={{color: (isComplete || isCurrent) ? '#fff' : '#a1a1aa', fontWeight: 600, fontSize: '15px'}}>
                      {step.label}
                    </span>
                  </div>
                  {isComplete && <Check size={18} color="#a1a1aa" />}
                  {isCurrent && state === 'loading' && <div style={{width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>}
                </div>
                {isExpanded && result?.analysis?.details && result.analysis.details[step.key] && (
                  <div style={{padding: '0 20px 20px 46px', color: '#a1a1aa', fontSize: '14px', lineHeight: 1.6}}>
                    {result.analysis.details[step.key]}
                  </div>
                )}
              </div>
            );
          })}
        </div>,
        <div style={{width: '100%', maxWidth: '360px'}}>
          <div style={{
            width: '100%', aspectRatio: '1/1', background: '#111',
            borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '24px'
          }}>
            {state === 'results' && result?.product?.image ? (
              <img src={result.product.image} alt="Product" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            ) : (
              <div style={{textAlign: 'center', color: '#a1a1aa'}}>
                <Sparkles size={40} style={{margin: '0 auto', marginBottom: '16px', opacity: 0.5}} />
                <p style={{fontSize: '14px'}}>{state === 'loading' ? 'Analyse...' : 'Aucune image'}</p>
              </div>
            )}
          </div>
          {state === 'results' && result?.product?.title && (
            <>
              <h3 style={{color: '#fff', fontSize: '18px', fontWeight: '700', textAlign: 'center', lineHeight: '1.4', marginBottom: '24px'}}>
                {result.product.title}
              </h3>
              
              {result.analysis && result.analysis.score !== undefined && (
                <div style={{width: '100%'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                    <span style={{fontSize: '15px', fontWeight: '600', color: '#fff'}}>Ton score produit</span>
                    <span style={{fontSize: '20px', fontWeight: '800', color: '#fff'}}>{result.analysis.score}</span>
                  </div>
                  <div style={{display: 'flex', gap: '2px', background: '#111', padding: '8px', borderRadius: '12px'}}>
                    {Array.from({ length: 40 }).map((_, i) => {
                      const isActive = (i / 40) * 100 <= result.analysis.score;
                      // Color gradient from blue (start) to green (end)
                      const r = Math.round(59 + (i / 40) * (16 - 59));
                      const g = Math.round(130 + (i / 40) * (185 - 130));
                      const b = Math.round(246 + (i / 40) * (129 - 246));
                      const color = `rgb(${r}, ${g}, ${b})`;
                      return (
                        <div 
                          key={i} 
                          style={{
                            flex: 1, 
                            height: '24px', 
                            borderRadius: '2px', 
                            background: isActive ? color : 'rgba(255,255,255,0.05)'
                          }} 
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>,
        () => setState('idle'),
        state === 'results' ? () => setState('select_language') : null
      )}

      {state === 'select_language' && renderSelectionLayout(
        "Langue de ta boutique", "Choisis la langue principale de ta boutique",
        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
          {LANGUAGES.map(lang => (
            <button key={lang.id} onClick={() => setSelectedLanguage(lang)} style={{
              display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: '#111',
              border: selectedLanguage?.id === lang.id ? '2px solid #fff' : '2px solid transparent', borderRadius: '14px', color: '#fff', cursor: 'pointer', transition: 'all 0.2s'
            }}>
              <span style={{fontSize: '24px'}}>{lang.flag}</span>
              <span style={{fontSize: '16px', fontWeight: '600'}}>{lang.label}</span>
            </button>
          ))}
        </div>,
        <div style={{background: '#111', border: '1px solid rgba(255,255,255,0.05)', padding: '48px', borderRadius: '24px', textAlign: 'center', width: '300px'}}>
          <div style={{fontSize: '64px', marginBottom: '24px'}}>{selectedLanguage?.flag || '🌍'}</div>
          <h3 style={{fontSize: '24px', color: '#fff', fontWeight: '700', marginBottom: '8px'}}>{selectedLanguage?.label || 'Sélectionner'}</h3>
        </div>,
        () => setState('results'),
        () => setState('select_persona')
      )}

      {state === 'select_persona' && (() => {
        const dynamicPersonas = result?.landingPage?.personas?.map((p, i) => ({ id: `dyn_p_${i}`, ...p })) || PERSONAS.slice(0, 4);
        const allPersonas = [
          { id: 'auto', icon: '🤖', title: 'Laisser l\'IA décider', desc: 'L\'IA croise les avis et les tendances pour trouver l\'audience la plus rentable.' },
          ...dynamicPersonas
        ];
        
        const currentPersona = selectedPersona || allPersonas[0];
        const previewPersona = currentPersona.id === 'auto' ? (dynamicPersonas[0] || PERSONAS[0]) : currentPersona;

        const handleSelectPersona = (p) => {
          if (p.id === 'auto') {
            setIsAiThinking('persona');
            setTimeout(() => {
              setIsAiThinking(null);
              setSelectedPersona(dynamicPersonas[0] || PERSONAS[0]);
            }, 2000);
          } else {
            setSelectedPersona(p);
          }
        };

        return renderSelectionLayout(
          "À qui tu vends ?", "Choisis le profil qui correspond à ton acheteur",
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            {allPersonas.map(p => (
              <button key={p.id} onClick={() => handleSelectPersona(p)} disabled={isAiThinking !== null} style={{
                display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', background: '#111',
                border: currentPersona?.id === p.id && !isAiThinking ? '2px solid #fff' : '2px solid transparent', 
                borderRadius: '16px', color: '#fff', cursor: isAiThinking ? 'not-allowed' : 'pointer', textAlign: 'left', position: 'relative',
                opacity: isAiThinking && p.id !== 'auto' ? 0.5 : 1
              }}>
                <span style={{fontSize: '32px'}}>{p.icon}</span>
                <div>
                  <span style={{fontSize: '16px', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    {p.title}
                    {p.id === 'auto' && <span style={{fontSize: '10px', background: '#fff', color: '#000', padding: '2px 6px', borderRadius: '100px'}}>Recommandé</span>}
                  </span>
                  {p.desc && <span style={{fontSize: '14px', color: '#a1a1aa', lineHeight: 1.5}}>{p.desc}</span>}
                </div>
              </button>
            ))}
          </div>,
          <div style={{background: '#111', border: '1px solid rgba(255,255,255,0.05)', padding: '48px', borderRadius: '24px', textAlign: 'center', width: '320px'}}>
            {isAiThinking === 'persona' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
                <h3 style={{fontSize: '18px', color: '#fff', fontWeight: '700', marginTop: '16px'}}>Analyse en cours...</h3>
                <p style={{color: '#a1a1aa', fontSize: '13px', lineHeight: 1.5}}>L'IA croise les données du marché pour identifier l'audience la plus rentable.</p>
              </div>
            ) : (
              <>
                <div style={{fontSize: '64px', marginBottom: '24px'}}>{previewPersona?.icon || '👤'}</div>
                <h3 style={{fontSize: '24px', color: '#fff', fontWeight: '700', marginBottom: '12px'}}>{previewPersona?.title || 'Persona'}</h3>
                <p style={{color: '#a1a1aa', fontSize: '15px', lineHeight: 1.5}}>{previewPersona?.desc || 'Ton profil acheteur unique'}</p>
              </>
            )}
          </div>,
          () => setState('select_language'),
          () => setState('select_angle')
        );
      })()}

      {state === 'select_angle' && (() => {
        const dynamicAngles = result?.landingPage?.angles?.map((a, i) => ({ id: `dyn_a_${i}`, ...a })) || ANGLES.slice(0, 4);
        const allAngles = [
          { id: 'auto', icon: <BrainCircuit size={28} color="#fff" />, title: 'Laisser l\'IA décider', desc: 'L\'IA analyse le marché pour créer l\'angle marketing parfait.' },
          ...dynamicAngles
        ];

        const currentAngle = selectedAngle || allAngles[0];
        const previewAngle = currentAngle.id === 'auto' ? (dynamicAngles[0] || ANGLES[0]) : currentAngle;

        const handleSelectAngle = (a) => {
          if (a.id === 'auto') {
            setIsAiThinking('angle');
            setTimeout(() => {
              setIsAiThinking(null);
              setSelectedAngle(dynamicAngles[0] || ANGLES[0]);
            }, 2000);
          } else {
            setSelectedAngle(a);
          }
        };

        return renderSelectionLayout(
          "Comment tu veux le vendre ?", "Choisis un angle qui accroche tes clients",
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            {allAngles.map(a => (
              <button key={a.id} onClick={() => handleSelectAngle(a)} disabled={isAiThinking !== null} style={{
                display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', background: '#111',
                border: currentAngle?.id === a.id && !isAiThinking ? '2px solid #fff' : '2px solid transparent', 
                borderRadius: '16px', color: '#fff', cursor: isAiThinking ? 'not-allowed' : 'pointer', textAlign: 'left',
                opacity: isAiThinking && a.id !== 'auto' ? 0.5 : 1
              }}>
                <div style={{width: '48px', height: '48px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  {a.icon}
                </div>
                <div style={{flex: 1}}>
                  <span style={{fontSize: '16px', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    {a.title}
                    {a.id === 'auto' && <span style={{fontSize: '10px', background: '#fff', color: '#000', padding: '2px 6px', borderRadius: '100px'}}>Recommandé</span>}
                  </span>
                  <span style={{fontSize: '14px', color: '#a1a1aa', lineHeight: 1.5}}>{a.desc}</span>
                </div>
              </button>
            ))}
          </div>,
          <div style={{background: '#111', border: '1px solid rgba(255,255,255,0.05)', padding: '48px', borderRadius: '24px', textAlign: 'center', width: '320px'}}>
            {isAiThinking === 'angle' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
                <h3 style={{fontSize: '18px', color: '#fff', fontWeight: '700', marginTop: '16px'}}>Génération de l'angle...</h3>
                <p style={{color: '#a1a1aa', fontSize: '13px', lineHeight: 1.5}}>{`L'IA analyse le persona "${currentPersona?.title || 'choisi'}" pour formuler un argumentaire irrésistible.`}</p>
              </div>
            ) : (
              <>
                <div style={{width: '80px', height: '80px', margin: '0 auto', marginBottom: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  {previewAngle?.icon || <Target size={32} color="#fff" />}
                </div>
                <h3 style={{fontSize: '24px', color: '#fff', fontWeight: '700', marginBottom: '12px'}}>{previewAngle?.title || 'Angle marketing'}</h3>
                <p style={{color: '#a1a1aa', fontSize: '15px', lineHeight: 1.5}}>{previewAngle?.desc || 'Ton angle marketing unique'}</p>
              </>
            )}
          </div>,
          () => setState('select_persona'),
          () => setState('select_photos')
        );
      })()}

      {state === 'select_photos' && (
        <div style={{height: '100%', width: '100%', background: '#000000', padding: '60px 40px', display: 'flex', flexDirection: 'column', position: 'relative'}}>
          <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#111', zIndex: 50}}>
            <div style={{height: '100%', background: '#fff', width: '95%'}}></div>
          </div>
          
          <div style={{display: 'flex', alignItems: 'center', marginBottom: '48px', maxWidth: '1200px', margin: '0 auto 48px auto', width: '100%'}}>
            <button onClick={() => setState('select_angle')} style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '12px', marginRight: '24px'}}>
              <ArrowLeft size={20} />
            </button>
            <div style={{flex: 1}}>
              <h2 style={{fontSize: '28px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px', marginBottom: '4px'}}>Sélectionne tes photos</h2>
              <p style={{color: '#a1a1aa', fontSize: '15px'}}>Choisis les images à importer dans ta boutique.</p>
            </div>
          </div>
          
          <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap', maxWidth: '1200px', margin: '0 auto', width: '100%', overflowY: 'auto', paddingBottom: '120px'}}>
            {(result?.product?.images || [result?.product?.image]).map((imgUrl, i) => {
              const isSelected = selectedPhotos.includes(i);
              
              const toggleSelection = () => {
                setSelectedPhotos(prev => {
                  if (prev.includes(i)) {
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
                    width: 'calc(25% - 15px)', aspectRatio: '1/1', minWidth: '200px',
                    background: '#111', borderRadius: '16px', 
                    border: isSelected ? '3px solid #fff' : '3px solid transparent',
                    overflow: 'hidden', cursor: 'pointer', padding: 0, position: 'relative',
                    transition: 'border-color 0.2s'
                  }}
                >
                  <img src={imgUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80"} alt={`Photo ${i + 1}`} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  <div style={{position: 'absolute', top: '16px', right: '16px', width: '28px', height: '28px', borderRadius: '8px', background: isSelected ? '#fff' : 'rgba(0,0,0,0.5)', border: isSelected ? 'none' : '2px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'}}>
                    {isSelected && <Check size={18} color="#000" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{position: 'fixed', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, #000 70%, transparent)', padding: '40px', display: 'flex', justifyContent: 'center'}}>
            <button onClick={startGenerationLoader} style={{width: '100%', maxWidth: '400px', padding: '20px', fontSize: '16px', fontWeight: '700', background: '#fff', color: '#000', borderRadius: '16px', border: 'none', cursor: 'pointer', boxShadow: '0 10px 30px rgba(255,255,255,0.1)'}}>
              Générer ma boutique
            </button>
          </div>
        </div>
      )}

      {state === 'generating_store' && (
        <div style={{height: '100%', width: '100%', background: '#000000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          
          <div style={{position: 'relative', width: '140px', height: '140px', marginBottom: '48px'}}>
            <svg style={{width: '100%', height: '100%', transform: 'rotate(-90deg)'}}>
              <circle cx="70" cy="70" r="66" fill="none" stroke="#111" strokeWidth="6" />
              <circle cx="70" cy="70" r="66" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeDasharray="414" strokeDashoffset={414 - (414 * Math.min(100, Math.max(0, generationProgress))) / 100} style={{transition: 'stroke-dashoffset 0.1s linear'}} />
            </svg>
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <span style={{fontSize: '32px', fontWeight: '800', color: '#fff'}}>{generationProgress}%</span>
            </div>
          </div>

          <h2 style={{fontSize: '32px', fontWeight: '800', color: '#fff', marginBottom: '40px', textAlign: 'center', letterSpacing: '-1px'}}>Préparation de ta<br/>boutique IA</h2>

          <div style={{width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '24px'}}>
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
                  <span style={{color: isDone || isActive ? '#fff' : '#a1a1aa', fontSize: '15px', fontWeight: isActive || isDone ? '600' : '400', transition: 'color 0.3s'}}>
                    {step}
                  </span>
                  {isActive && <div style={{width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>}
                  {isDone && <Check size={20} color="#fff" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
