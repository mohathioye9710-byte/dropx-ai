"use client";

import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Play, 
  Pause, 
  Volume2, 
  Download, 
  RotateCcw, 
  Zap, 
  Copy, 
  Check, 
  Sliders, 
  Link2, 
  Loader2,
  Video,
  Music,
  Upload,
  Maximize2,
  Film,
  X
} from 'lucide-react';
import styles from './Ads.module.css';

const VOICES = [
  { id: 'victoria', name: 'Victoria', desc: 'Sérieuse & rassurante' },
  { id: 'leo', name: 'Léo', desc: 'Dynamique & vendeur' },
  { id: 'charlotte', name: 'Charlotte', desc: 'Chaleureuse & UGC' },
  { id: 'paul', name: 'Paul', desc: 'Posé & premium' },
  { id: 'marcus', name: 'Marcus', desc: 'Énergique & jeune' },
  { id: 'sarah', name: 'Sarah', desc: 'Narratrice pro' },
];

const AVATARS = [
  {
    id: 'aminata_kitchen',
    name: 'Aminata',
    role: 'Créatrice Bien-être & Maison (Sénégal)',
    image: '/avatars/aminata_ems.jpg',
    defaultVoice: 'charlotte'
  },
  {
    id: 'moussa_living',
    name: 'Moussa',
    role: 'Entrepreneur & Tech (Dakar)',
    image: '/avatars/moussa.jpg',
    defaultVoice: 'marcus'
  },
  {
    id: 'victoria_paris',
    name: 'Victoria',
    role: 'Influenceuse Beauté & Style (France)',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    defaultVoice: 'victoria'
  },
  {
    id: 'leo_office',
    name: 'Léo',
    role: 'Testeur Gadgets & E-commerce',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
    defaultVoice: 'leo'
  }
];

const DEFAULT_ANGLES = [
  {
    angleTitle: 'Angle 1 • Problème / Solution (Version Complète 35s)',
    viralityScore: 99,
    hookLine: 'Si tu as les pieds douloureux ou les jambes lourdes après une longue journée, regarde absolument ça !',
    fullVoiceover: "Si tu as les pieds douloureux ou les jambes lourdes après une longue journée, regarde absolument ça ! Ce tapis de massage électrique EMS diffuse des micro-impulsions relaxantes pour détendre les muscles et relancer la circulation. Tu poses simplement tes pieds dessus quinze minutes le soir : avec huit modes et dix-neuf intensités, toutes les tensions disparaissent ! En ce moment, il est en promo à seulement treize mille cinq cents Francs CFA avec livraison offerte au Sénégal. Tu ne payes rien d'avance : commande en un clic et règle en cash ou Wave à la livraison. Clique vite sur le bouton en bas pour recevoir le tien !",
    scenes: [
      { visualPrompt: 'Aminata présentant le tapis de massage EMS noir avec son boîtier digital', caption: 'Pieds douloureux le soir ?' },
      { visualPrompt: 'Gros plan sur le tapis de massage EMS et les micro-impulsions de relaxation', caption: 'Technologie EMS relaxante 8 modes' },
      { visualPrompt: 'Pieds posés confortablement sur le tapis devant la télévision', caption: 'Soulagement profond en 15 min' },
      { visualPrompt: 'Bouton de commande avec badge Livraison Offerte et Paiement COD', caption: '13 500 FCFA • Paiement à la livraison' }
    ]
  },
  {
    angleTitle: 'Angle 2 • Témoignage UGC Client Dakar',
    viralityScore: 96,
    hookLine: 'Honnêtement, je ne pensais pas qu’un petit tapis pouvait faire autant de bien…',
    fullVoiceover: "Honnêtement, après une journée complète debout à courir à Dakar, mes pieds étaient en feu. En posant mes pieds dessus 15 minutes devant la télé, toutes les tensions disparaissent. En plus j'ai payé au livreur quand il est arrivé !",
    scenes: [
      { visualPrompt: 'Selfie vidéo naturelle dans son salon en train de tester le tapis de massage', caption: 'Mon rituel du soir après le boulot' },
      { visualPrompt: 'Démonstration des 8 modes de massage avec télécommande', caption: '8 modes de stimulation au choix' },
      { visualPrompt: 'Sourire de soulagement et pieds détendus', caption: 'Adieu courbatures et jambes lourdes' }
    ]
  },
  {
    angleTitle: 'Angle 3 • Offre Flash & Livraison Gratuite COD',
    viralityScore: 97,
    hookLine: 'Offre exclusive : 13 500 FCFA au lieu de 20 000 FCFA avec Livraison Gratuite !',
    fullVoiceover: "Offre spéciale aujourd'hui : votre Tapis de Massage Électrique EMS à seulement 13 500 FCFA au lieu de 20 000 FCFA ! Livraison 100% gratuite à Dakar et régions. Vous ne payez rien d'avance, réglez en cash ou par Wave à la livraison !",
    scenes: [
      { visualPrompt: 'Tapis déplié avec boîte d’origine et câble de recharge USB', caption: 'Pack complet Tapis EMS rechargeable' },
      { visualPrompt: 'Animation de la promotion 13 500 FCFA avec badge Livraison Gratuite', caption: '13 500 FCFA (au lieu de 20 000 F)' },
      { visualPrompt: 'Livreur souriant remettant le colis avec paiement à la livraison', caption: 'Paiement à la livraison 100% sécurisé' }
    ]
  }
];

export default function CreativeStudioPage() {
  // Input states
  const [url, setUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [productName, setProductName] = useState('WLX Tapis de Massage Électrique des Pieds EMS');
  const [description, setDescription] = useState('Tapis de massage chauffant stimulateur musculaire pour pieds EMS. Soulage fatigue, courbatures et jambes lourdes en 15 minutes.');
  const [price, setPrice] = useState('13 500 FCFA');
  const [image, setImage] = useState('https://s.alicdn.com/@sc04/kf/H983ebf9446f24e95bf0a0d9f4857b2feV.jpg');
  const [targetMarket, setTargetMarket] = useState('senegal');
  const [selectedVoice, setSelectedVoice] = useState('charlotte');

  // Generator states
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(DEFAULT_ANGLES);
  const [activeAngleIndex, setActiveAngleIndex] = useState(0);

  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  // Avatar Video states
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [avatarVideoUrl, setAvatarVideoUrl] = useState('/renders/9b0e2a4598bd.mp4');
  const [generatingAvatarVideo, setGeneratingAvatarVideo] = useState(false);
  const [avatarProgressText, setAvatarProgressText] = useState('');
  const [avatarProgress, setAvatarProgress] = useState(0);
  const [avatarQuality, setAvatarQuality] = useState('std');
  const [displayMode, setDisplayMode] = useState('avatar');
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Background Music states
  const [musicTracks, setMusicTracks] = useState([]);
  const [selectedMusic, setSelectedMusic] = useState('papaoutai_afrosoul');
  const [musicVolume, setMusicVolume] = useState(0.18);
  const [previewingMusicId, setPreviewingMusicId] = useState(null);
  const [remixingMusic, setRemixingMusic] = useState(false);
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [searchingMusic, setSearchingMusic] = useState(false);
  const [downloadingVideo, setDownloadingVideo] = useState(false);

  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const previewAudioRef = useRef(null);

  useEffect(() => {
    fetch('/api/creatives/music')
      .then((r) => r.json())
      .then((d) => {
        if (d?.tracks) setMusicTracks(d.tracks);
      })
      .catch((e) => console.error('Erreur chargement musiques:', e));

    try {
      const stored = localStorage.getItem('dropx_preview_product');
      if (stored) {
        const prod = JSON.parse(stored);
        if (prod.title) setProductName(prod.title);
        if (prod.description) setDescription(prod.description);
        if (prod.price) setPrice(prod.price);
        if (prod.images && prod.images[0]) setImage(prod.images[0]);
        if (prod.url) setUrl(prod.url);
      }
    } catch (e) {
      console.error('Erreur lecture produit stocké:', e);
    }
  }, []);

  const handleToggleMusicPreview = (track) => {
    if (!track.audioUrl) {
      if (previewAudioRef.current) previewAudioRef.current.pause();
      setPreviewingMusicId(null);
      return;
    }
    if (previewingMusicId === track.id) {
      if (previewAudioRef.current) previewAudioRef.current.pause();
      setPreviewingMusicId(null);
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.src = track.audioUrl;
        previewAudioRef.current.currentTime = track.startOffset || 0;
        previewAudioRef.current.volume = musicVolume;
        previewAudioRef.current.play().catch(() => {});
      }
      setPreviewingMusicId(track.id);
    }
  };

  const handleUploadCustomMusic = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('name', file.name.replace(/\.[^/.]+$/, ''));
    try {
      const res = await fetch('/api/creatives/music', {
        method: 'POST',
        body: form
      });
      const data = await res.json();
      if (res.ok && data?.track) {
        setMusicTracks((prev) => [...prev, data.track]);
        setSelectedMusic(data.track.id);
      } else {
        alert('Erreur: ' + (data?.error || 'Échec upload'));
      }
    } catch (err) {
      alert('Erreur upload: ' + err.message);
    }
  };

  const handleDownloadVideo = async (e) => {
    if (e) e.preventDefault();
    if (!avatarVideoUrl) return;
    setDownloadingVideo(true);
    try {
      const cleanName = (productName || 'ads-video').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const filename = `dropx-${cleanName}.mp4`;
      
      const response = await fetch(avatarVideoUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn("Direct blob download fallback:", err);
      window.open(avatarVideoUrl, '_blank');
    } finally {
      setDownloadingVideo(false);
    }
  };

  const handleRemixMusic = async () => {
    if (!avatarVideoUrl) return;
    const m = /\/render\/([a-f0-9]+)/.exec(avatarVideoUrl);
    if (!m) return;
    const videoId = m[1];
    const track = musicTracks.find((t) => t.id === selectedMusic);
    setRemixingMusic(true);
    try {
      const res = await fetch('/api/creatives/remix-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          musicId: selectedMusic,
          musicVolume,
          startOffset: track?.startOffset || 0
        })
      });
      const data = await res.json();
      if (res.ok && data?.videoUrl) {
        setAvatarVideoUrl(data.videoUrl);
      } else {
        alert('Erreur mixage: ' + (data?.error || 'Échec'));
      }
    } catch (err) {
      alert('Erreur: ' + err.message);
    } finally {
      setRemixingMusic(false);
    }
  };

  const handleSearchMusic = async (e) => {
    e?.preventDefault();
    if (!musicSearchQuery.trim()) return;
    setSearchingMusic(true);
    try {
      const res = await fetch('/api/creatives/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search: musicSearchQuery.trim() })
      });
      const data = await res.json();
      if (res.ok && data?.track) {
        setMusicTracks((prev) => [data.track, ...prev]);
        setSelectedMusic(data.track.id);
        setMusicSearchQuery('');
      } else {
        alert('Erreur: ' + (data?.error || 'Morceau non trouvé'));
      }
    } catch (err) {
      alert('Erreur recherche: ' + err.message);
    } finally {
      setSearchingMusic(false);
    }
  };

  const handleScrape = async () => {
    if (!url) return;
    setScraping(true);
    try {
      const res = await fetch('/api/creatives/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.title) setProductName(data.title);
        if (data.description) setDescription(data.description);
        if (data.image) setImage(data.image);
        if (data.price) setPrice(data.price + (targetMarket === 'senegal' ? ' FCFA' : ' €'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setScraping(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setAudioUrl(null);
    setIsPlaying(false);
    setCurrentSceneIndex(0);

    try {
      const res = await fetch('/api/creatives/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          description,
          price,
          targetMarket
        })
      });

      const data = await res.json();
      if (res.ok && data) {
        const list = data.variations || data.angles || (Array.isArray(data) ? data : [data]);
        setResult(list);
        setActiveAngleIndex(0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handlePlayVoiceover = async () => {
    const currentAngle = result?.[activeAngleIndex];
    if (!currentAngle?.fullVoiceover) return;

    if (audioUrl) {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
      return;
    }

    setAudioLoading(true);
    try {
      const res = await fetch('/api/creatives/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentAngle.fullVoiceover,
          voice: selectedVoice
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        setAudioUrl(objectUrl);
        setIsPlaying(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAudioLoading(false);
    }
  };

  const handleGenerateAvatarVideo = async () => {
    const currentAngle = result?.[activeAngleIndex];
    const speechText = currentAngle?.fullVoiceover;
    if (!speechText) return;

    setGeneratingAvatarVideo(true);
    setAvatarProgress(2);
    setAvatarProgressText('Démarrage de la synthèse vocale…');

    try {
      const res = await fetch('/api/creatives/avatar-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarId: selectedAvatar.id,
          text: speechText,
          voice: selectedVoice,
          quality: avatarQuality,
          price,
          musicId: selectedMusic,
          musicVolume,
          startOffset: musicTracks.find((t) => t.id === selectedMusic)?.startOffset || 0
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert('Erreur: ' + (data.error || 'Échec'));
        setGeneratingAvatarVideo(false);
        return;
      }

      const interval = setInterval(async () => {
        try {
          const checkRes = await fetch(`/api/creatives/avatar-video?id=${data.id}`);
          const job = await checkRes.json();

          if (!checkRes.ok) {
            clearInterval(interval);
            alert('Erreur: ' + (job.error || 'Job introuvable'));
            setGeneratingAvatarVideo(false);
            return;
          }

          setAvatarProgress(job.progress || 0);
          setAvatarProgressText(job.step || '');

          if (job.status === 'done' && job.videoUrl) {
            clearInterval(interval);
            setAvatarVideoUrl(job.videoUrl);
            setDisplayMode('avatar');
            setGeneratingAvatarVideo(false);
          } else if (job.status === 'failed') {
            clearInterval(interval);
            alert('Échec: ' + (job.error || 'Erreur de rendu vidéo'));
            setGeneratingAvatarVideo(false);
          }
        } catch (pollErr) {
          console.error(pollErr);
        }
      }, 3000);
    } catch (err) {
      console.error(err);
      alert('Erreur: ' + err.message);
      setGeneratingAvatarVideo(false);
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const currentScenes = result?.[activeAngleIndex]?.scenes || [];
    if (currentScenes.length === 0) return;

    timerRef.current = setInterval(() => {
      setCurrentSceneIndex((prev) => {
        if (prev >= currentScenes.length - 1) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 4500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, activeAngleIndex, result]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const currentAngle = result?.[activeAngleIndex] || null;
  const currentScene = currentAngle?.scenes?.[currentSceneIndex] || null;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.badge}>
            <Sparkles size={13} color="#ffffff" />
            <span>Studio Vidéo & Avatars IA</span>
          </div>
          <span style={{ fontSize: '13px', color: '#71717a', fontWeight: '500' }}>
            Format 9:16 • TikTok & Reels
          </span>
        </div>
        <h1 className={styles.title}>DropX Ads Studio</h1>
        <p className={styles.subtitle}>
          Concevez des vidéos publicitaires captivantes : avatars parlants ultra-réalistes, voix off studio ElevenLabs et musiques tendance avec ducking automatique anti-masquage.
        </p>
      </header>

      {/* ================= SECTION: MES VIDÉOS GÉNÉRÉES ================= */}
      <section className={styles.galleryCard}>
        <div className={styles.galleryHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className={styles.galleryIconPulse}>
              <Film size={18} color="#10b981" />
            </div>
            <div>
              <h2 className={styles.galleryTitle}>Mes Vidéos Publicitaires Générées</h2>
              <p className={styles.gallerySubtitle}>Visionnez, téléchargez en 1080p ou remixez le son de vos créations</p>
            </div>
          </div>
          <span className={styles.galleryBadge}>1 vidéo prête (35s)</span>
        </div>

        <div className={styles.galleryGrid}>
          <div className={styles.videoItemCard}>
            <div className={styles.videoItemThumb} onClick={() => setShowVideoModal(true)} title="Cliquer pour regarder en grand écran">
              <img 
                src="https://s.alicdn.com/@sc04/kf/H983ebf9446f24e95bf0a0d9f4857b2feV.jpg" 
                alt="WLX Tapis de Massage" 
              />
              <div className={styles.videoItemPlayOverlay}>
                <Play size={24} fill="#ffffff" color="#ffffff" />
              </div>
              <span className={styles.videoItemDuration}>00:35</span>
              <span className={styles.videoItemBadge}>Full HD</span>
            </div>

            <div className={styles.videoItemContent}>
              <div className={styles.videoItemTitle}>
                WLX Tapis de Massage des Pieds EMS (35.4s)
              </div>
              <div className={styles.videoItemMeta}>
                <span>👤 Aminata (Sénégal)</span>
                <span>🎙️ Voix Charlotte (UGC)</span>
                <span>🎵 Papaoutai Afro Soul (Volume Boosté)</span>
                <span>⚡ 1080x1920 (9:16)</span>
              </div>
              <div className={styles.videoItemActions}>
                <button 
                  type="button" 
                  onClick={() => {
                    setAvatarVideoUrl('/renders/9b0e2a4598bd.mp4');
                    videoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    if (videoRef.current) {
                      videoRef.current.play().catch(() => {});
                    }
                  }} 
                  className={styles.btnWatchInPlayer}
                >
                  <Play size={13} fill="currentColor" /> Voir dans le lecteur
                </button>

                <button 
                  type="button" 
                  onClick={() => setShowVideoModal(true)} 
                  className={styles.btnWatchModal}
                >
                  <Maximize2 size={13} /> Regarder en Grand Écran
                </button>

                <a 
                  href="/renders/9b0e2a4598bd.mp4" 
                  download="dropx-tapis-ems-35s.mp4" 
                  className={styles.btnDownloadDirect}
                >
                  <Download size={13} /> Télécharger MP4 (39 Mo)
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Studio Workspace (2 Columns) */}
      <div className={styles.studioWorkspace}>
        {/* ================= LEFT COLUMN: CONTROLS & CONFIG ================= */}
        <div className={styles.controlsColumn}>
          
          {/* STEP 1: Product & Details */}
          <div className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <div className={styles.stepNumber}>01</div>
              <div className={styles.stepHeaderInfo}>
                <h2 className={styles.stepTitle}>Produit & Offre</h2>
                <p className={styles.stepDesc}>Importez automatiquement vos détails ou complétez manuellement.</p>
              </div>
            </div>

            {/* URL Auto Scraper */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Lien du produit (Shopify, AliExpress, etc.)</label>
              <div className={styles.urlBar}>
                <input
                  type="text"
                  placeholder="https://fr.aliexpress.com/item/... ou lien Shopify"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className={styles.urlInput}
                />
                <button 
                  type="button"
                  className={styles.scrapeBtn}
                  onClick={handleScrape}
                  disabled={scraping || !url}
                >
                  {scraping ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                  <span>{scraping ? 'Analyse...' : 'Analyser'}</span>
                </button>
              </div>
            </div>

            {/* Form Inputs Grid */}
            <div className={styles.formRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Nom de l&apos;article</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className={styles.textInput}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Prix de vente</label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={styles.textInput}
                  placeholder="Ex: 16.500 FCFA"
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Marché cible</label>
                <select
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                  className={styles.selectInput}
                >
                  <option value="senegal">🇸🇳 Sénégal (COD / Wave / OM / 24h)</option>
                  <option value="global">🌍 Global (Europe / International)</option>
                </select>
              </div>
            </div>

            <div className={styles.formRow} style={{ gridTemplateColumns: '2fr 1fr' }}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Bénéfices clés & Argumentaire</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={styles.textInput}
                  placeholder="Points forts pour inciter à l'achat immédiat..."
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Image produit</label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className={styles.textInput}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* STEP 2: Avatar IA & Voix Off */}
          <div className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <div className={styles.stepNumber}>02</div>
              <div className={styles.stepHeaderInfo}>
                <h2 className={styles.stepTitle}>Avatar IA & Voix Off</h2>
                <p className={styles.stepDesc}>Sélectionnez l&apos;avatar qui portera le message en vidéo HD.</p>
              </div>
            </div>

            {/* Avatar Selector */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Créateur Avatar (Synchro labiale Full HD)</label>
              <div className={styles.avatarGrid}>
                {AVATARS.map((av) => (
                  <div 
                    key={av.id}
                    className={`${styles.avatarCard} ${selectedAvatar.id === av.id ? styles.activeAvatar : ''}`}
                    onClick={() => {
                      setSelectedAvatar(av);
                      if (av.defaultVoice) setSelectedVoice(av.defaultVoice);
                      setDisplayMode('avatar');
                    }}
                  >
                    <img src={av.image} alt={av.name} className={styles.avatarImage} />
                    <span className={styles.avatarName}>{av.name}</span>
                    <span className={styles.avatarRole}>{av.role}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Voice Off Selector */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Voix Off Studio (ElevenLabs)</label>
              <div className={styles.voiceGrid}>
                {VOICES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={`${styles.voiceBtn} ${selectedVoice === v.id ? styles.activeVoice : ''}`}
                    onClick={() => setSelectedVoice(v.id)}
                  >
                    <span>{v.name}</span>
                    <span style={{ fontSize: '11px', color: '#71717a' }}>{v.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 3: Musique de Fond Tendance */}
          <div className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <div className={styles.stepNumber}>03</div>
              <div className={styles.stepHeaderInfo}>
                <h2 className={styles.stepTitle}>Fond Musical Tendance</h2>
                <p className={styles.stepDesc}>Vrais tubes viraux TikTok avec ducking automatique sous la voix.</p>
              </div>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchMusic} className={styles.musicSearchRow}>
              <input
                type="text"
                value={musicSearchQuery}
                onChange={(e) => setMusicSearchQuery(e.target.value)}
                placeholder="Rechercher un son (ex: Stromae Papaoutai, Tiki, Aya Nakamura...)"
                className={styles.musicSearchInput}
              />
              <button
                type="submit"
                disabled={searchingMusic || !musicSearchQuery.trim()}
                className={styles.musicSearchBtn}
              >
                {searchingMusic ? <Loader2 size={14} className="animate-spin" /> : 'Ajouter'}
              </button>
            </form>

            {/* Music List */}
            <div className={styles.musicList}>
              {musicTracks.map((track) => {
                const isSelected = selectedMusic === track.id;
                const isPlayingSample = previewingMusicId === track.id;

                return (
                  <div
                    key={track.id}
                    className={`${styles.musicItem} ${isSelected ? styles.activeMusic : ''}`}
                    onClick={() => setSelectedMusic(track.id)}
                  >
                    <div className={styles.musicInfo}>
                      <span className={styles.musicName}>
                        {track.emoji} {track.name}
                      </span>
                      <span className={styles.musicMeta}>
                        {track.mood}
                        {track.startOffset > 0 && (
                          <span className={styles.musicOffsetTag}>
                            • Refrain viral ({track.startOffset}s)
                          </span>
                        )}
                      </span>
                    </div>

                    {track.audioUrl && (
                      <button
                        type="button"
                        className={`${styles.musicPlayBtn} ${isPlayingSample ? styles.playing : ''}`}
                        title={isPlayingSample ? 'Pause' : 'Écouter l\'extrait'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleMusicPreview(track);
                        }}
                      >
                        {isPlayingSample ? <Pause size={12} /> : <Play size={12} style={{ marginLeft: '1px' }} />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Volume Slider Controls */}
            <div className={styles.volumeControls}>
              <div className={styles.volumeLabel}>
                <Sliders size={14} color="#ffffff" />
                <span>Volume musique :</span>
              </div>

              <input
                type="range"
                min="0.10"
                max="1.50"
                step="0.05"
                value={musicVolume}
                disabled={selectedMusic === 'none'}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setMusicVolume(v);
                  if (previewAudioRef.current) previewAudioRef.current.volume = v;
                }}
                className={styles.volumeSlider}
              />

              <span className={styles.volumeValue}>
                {Math.round(musicVolume * 100)}%
              </span>

              <label className={styles.customUploadBtn} title="Importer votre propre fichier MP3">
                <Upload size={13} />
                <span>Son perso</span>
                <input
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={handleUploadCustomMusic}
                />
              </label>
            </div>
          </div>

          {/* MAIN GENERATE BUTTON */}
          <button
            type="button"
            className={styles.generateMainBtn}
            onClick={handleGenerateAvatarVideo}
            disabled={generatingAvatarVideo}
          >
            {generatingAvatarVideo ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>{avatarProgressText || 'Rendu en cours...'} ({Math.round(avatarProgress)}%)</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span>Générer la Vidéo Publicitaire IA</span>
              </>
            )}
          </button>

          {/* Progress Bar when rendering */}
          {generatingAvatarVideo && (
            <div className={styles.progressBarBox}>
              <div className={styles.progressLabelRow}>
                <span>{avatarProgressText || 'Traitement studio...'}</span>
                <span>{Math.round(avatarProgress)}%</span>
              </div>
              <div className={styles.progressTrack}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${avatarProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* STORYBOARD & 3 ANGLES SECTION */}
          {result && result.length > 0 && (
            <div className={styles.anglesSection}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', margin: 0 }}>
                  Angles Publicitaires & Storyboard
                </h3>
                <button
                  type="button"
                  onClick={() => copyToClipboard(currentAngle?.fullVoiceover, 'script')}
                  className={styles.customUploadBtn}
                >
                  {copiedKey === 'script' ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedKey === 'script' ? 'Copié !' : 'Copier le script'}</span>
                </button>
              </div>

              {/* Angle Tabs */}
              <div className={styles.angleTabs}>
                {result.map((ang, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`${styles.angleTab} ${activeAngleIndex === idx ? styles.activeAngle : ''}`}
                    onClick={() => {
                      setActiveAngleIndex(idx);
                      setCurrentSceneIndex(0);
                    }}
                  >
                    <span className={styles.angleTabTitle}>{ang.angleTitle || `Angle ${idx + 1}`}</span>
                    <span className={styles.angleTabHook}>{ang.hookLine}</span>
                  </button>
                ))}
              </div>

              {/* Scenes Cards */}
              <div className={styles.scenesList}>
                {currentAngle?.scenes?.map((scene, sIdx) => (
                  <div key={sIdx} className={styles.sceneCard}>
                    <div className={styles.sceneHeader}>
                      <span>Scène {sIdx + 1}</span>
                      <span>~4s</span>
                    </div>
                    <div className={styles.sceneCaption}>
                      &ldquo;{scene.caption}&rdquo;
                    </div>
                    <div className={styles.sceneVisual}>
                      {scene.visualPrompt}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ================= RIGHT COLUMN: STICKY 9:16 PREVIEW PLAYER ================= */}
        <div className={styles.previewColumn}>
          <div className={styles.phoneFrameWrapper}>
            <div className={styles.previewHeader}>
              <div className={styles.previewTitle}>
                <Video size={16} />
                <span>Aperçu Vidéo 9:16</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowVideoModal(true)}
                  style={{ 
                    background: 'rgba(255,255,255,0.06)', 
                    border: '1px solid rgba(255,255,255,0.12)', 
                    color: '#10b981', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    fontSize: '11px', 
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}
                  title="Ouvrir en grand écran"
                >
                  <Maximize2 size={12} /> Agrandir
                </button>
                <span className={styles.previewBadge}>Full HD 1080p</span>
              </div>
            </div>

            {/* 9:16 Screen Canvas */}
            <div className={styles.phoneScreen}>
              {displayMode === 'avatar' && avatarVideoUrl ? (
                <video
                  ref={videoRef}
                  key={avatarVideoUrl}
                  src={avatarVideoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  onLoadedMetadata={(e) => { e.currentTarget.volume = 0.55; }}
                  className={styles.videoElement}
                />
              ) : (
                <div 
                  className={styles.previewPlaceholder}
                  style={{
                    backgroundImage: `url(${image || selectedAvatar.image})`
                  }}
                >
                  <div className={styles.previewPlaceholderOverlay} />

                  <div className={styles.previewTopPills}>
                    <span className={styles.previewPill}>🇸🇳 PAIEMENT À LA LIVRAISON</span>
                    <span className={styles.previewPill}>⚡ 24H DAKAR</span>
                  </div>

                  <div className={styles.previewCaptionBox}>
                    <div className={styles.previewCaptionText}>
                      {currentScene?.caption || currentAngle?.hookLine || productName}
                    </div>
                  </div>

                  <div className={styles.previewBottomCTA}>
                    COMMANDER EN 1 CLIC • {price}
                  </div>
                </div>
              )}
            </div>

            {/* Actions below video */}
            <div className={styles.previewActions}>
              {avatarVideoUrl && (
                <button
                  type="button"
                  onClick={handleDownloadVideo}
                  disabled={downloadingVideo}
                  className={styles.btnDownload}
                >
                  {downloadingVideo ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  <span>{downloadingVideo ? 'Téléchargement MP4...' : 'Télécharger la Vidéo MP4'}</span>
                </button>
              )}

              {avatarVideoUrl && (
                <button
                  type="button"
                  onClick={handleRemixMusic}
                  disabled={remixingMusic}
                  className={styles.btnRemix}
                >
                  {remixingMusic ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Mixage en cours (1 à 2s)...</span>
                    </>
                  ) : (
                    <>
                      <Music size={15} />
                      <span>Remixer le son ({Math.round(musicVolume * 100)}%)</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handlePlayVoiceover}
                disabled={audioLoading}
                className={styles.btnRemix}
              >
                {audioLoading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Volume2 size={15} />
                )}
                <span>{audioUrl ? 'Réécouter la Voix Off seule' : 'Écouter la Voix Off seule'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Hidden audio element for preview */}
      <audio 
        ref={previewAudioRef} 
        onEnded={() => setPreviewingMusicId(null)} 
      />

      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onEnded={() => setIsPlaying(false)} 
        />
      )}

      {/* Full-Screen Cinema Modal */}
      {showVideoModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowVideoModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Film size={18} color="#10b981" />
                <span style={{ fontWeight: '800', fontSize: '14px', color: '#fff' }}>
                  WLX Tapis de Massage des Pieds EMS (35s)
                </span>
              </div>
              <button onClick={() => setShowVideoModal(false)} className={styles.modalCloseBtn}>
                <X size={16} />
              </button>
            </div>
            
            <div className={styles.modalVideoWrapper}>
              <video 
                src="/renders/9b0e2a4598bd.mp4" 
                controls 
                autoPlay 
                playsInline 
                loop 
                onLoadedMetadata={(e) => { e.currentTarget.volume = 0.55; }}
                className={styles.modalVideo} 
              />
            </div>

            <div className={styles.modalFooter}>
              <a 
                href="/renders/9b0e2a4598bd.mp4" 
                download="dropx-tapis-ems-35s.mp4" 
                className={styles.modalDownloadBtn}
              >
                <Download size={16} /> Télécharger la vidéo MP4 (Full HD 1080p)
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
