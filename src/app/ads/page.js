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
  Upload
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
    role: 'Créatrice Cuisine & Maison (Sénégal)',
    image: '/avatars/aminata.jpg',
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
    angleTitle: 'Angle 1 • Problème / Solution',
    viralityScore: 97,
    hookLine: 'Marre des cheveux abîmés par les fers à lisser classiques ?',
    fullVoiceover: "Marre des cheveux abîmés par les fers classiques ? Découvre la brosse lissante sans fil DropX. Elle chauffe en 30 secondes et te garantit un lissage parfait sans frisottis, où que tu sois. Paiement à la livraison partout à Dakar !",
    scenes: [
      { visualPrompt: 'Femme pressée tenant un fer traditionnel encombrant', caption: 'Marre des fers classiques ?' },
      { visualPrompt: 'Gros plan sur la brosse lissante sans fil compacte', caption: 'Chauffe en 30 secondes chrono' },
      { visualPrompt: 'Résultat immédiat : cheveux lisses et brillants', caption: 'Lissage parfait sans frisottis' },
      { visualPrompt: 'Bouton de commande avec paiement cash à la livraison', caption: 'Paiement à la livraison 24h' }
    ]
  },
  {
    angleTitle: 'Angle 2 • Témoignage UGC Client',
    viralityScore: 94,
    hookLine: 'Honnêtement, je ne pensais pas qu\'une brosse sans fil serait aussi efficace...',
    fullVoiceover: "Je l'emporte partout dans mon sac. En 3 minutes chrono avant une sortie, mes cheveux sont nickels. En plus, j'ai payé à la livraison après avoir vérifié le colis !",
    scenes: [
      { visualPrompt: 'Selfie vidéo UGC naturel face miroir', caption: 'Test en direct de la brosse' },
      { visualPrompt: 'Démonstration du lissage d\'une mèche en 1 passage', caption: 'Un seul passage suffit' },
      { visualPrompt: 'Colis reçu à domicile avec paiement cash à Dakar', caption: 'Reçu en 24h à domicile' }
    ]
  },
  {
    angleTitle: 'Angle 3 • Offre Flash & COD',
    viralityScore: 95,
    hookLine: 'Stock très limité : seulement 16.500 FCFA avec livraison express !',
    fullVoiceover: "Profitez de notre vente flash exclusive ! La brosse chauffante nouvelle génération à seulement 16.500 FCFA. Commandez en 1 clic et réglez à la livraison en toute sécurité.",
    scenes: [
      { visualPrompt: 'Packaging haut de gamme avec accessoires et câble USB-C', caption: 'Offre exclusive du moment' },
      { visualPrompt: 'Animation du prix 16.500 FCFA avec badge express', caption: '16.500 FCFA • Stock limité' },
      { visualPrompt: 'Formulaire de commande express sans carte bancaire', caption: 'Commandez en 1 clic' }
    ]
  }
];

export default function CreativeStudioPage() {
  // Input states
  const [url, setUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [productName, setProductName] = useState('Brosse Lissante Chauffante Sans Fil');
  const [description, setDescription] = useState('Brosse lissante rechargeable USB, chauffe en 30s, lisse sans abîmer les cheveux. Format sac à main.');
  const [price, setPrice] = useState('16.500 FCFA');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80');
  const [targetMarket, setTargetMarket] = useState('senegal');
  const [selectedVoice, setSelectedVoice] = useState('victoria');

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
  const [avatarVideoUrl, setAvatarVideoUrl] = useState('/api/creatives/render/be44cbc2d146');
  const [generatingAvatarVideo, setGeneratingAvatarVideo] = useState(false);
  const [avatarProgressText, setAvatarProgressText] = useState('');
  const [avatarProgress, setAvatarProgress] = useState(0);
  const [avatarQuality, setAvatarQuality] = useState('std');
  const [displayMode, setDisplayMode] = useState('avatar');

  // Background Music states
  const [musicTracks, setMusicTracks] = useState([]);
  const [selectedMusic, setSelectedMusic] = useState('papaoutai_afrosoul');
  const [musicVolume, setMusicVolume] = useState(0.14);
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
                min="0.05"
                max="0.60"
                step="0.01"
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
              <span className={styles.previewBadge}>Full HD 1080p</span>
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
    </div>
  );
}
