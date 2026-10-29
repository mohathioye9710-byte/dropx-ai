import fs from 'node:fs';
import path from 'node:path';

export const MUSIC_DIR = path.join(process.cwd(), 'assets', 'music');
export const CUSTOM_MUSIC_DIR = path.join(process.cwd(), 'data', 'music');

// Vraies musiques virales et tubes TikTok / Reels avec le timing exact du drop / refrain viral
export const MUSIC_TRACKS = [
  {
    id: 'papaoutai_afrosoul',
    name: 'Stromae – Papaoutai (Afro Soul)',
    emoji: '🔥',
    mood: 'Afro Soul • TikTok Viral',
    startOffset: 34, // Partie la plus écoutée (34s)
    desc: 'La version officielle Afro Soul ultra virale sur TikTok avec percussions et harmonies afrobeats.'
  },
  {
    id: 'papaoutai_opera',
    name: 'Stromae – Papaoutai (Version Opéra Soul)',
    emoji: '🎭',
    mood: 'Opéra TikTok • Viral',
    startOffset: 45, // Le refrain opéra viral et lyrique
    desc: 'La version opéra virale de TikTok avec chœur lyrique et envolée symphonique.'
  },
  {
    id: 'papaoutai_choir',
    name: 'Stromae – Papaoutai (Chœur A Cappella)',
    emoji: '🏛️',
    mood: 'Chorale Lyrique • Viral',
    startOffset: 0, // Démarre direct avec le chœur puissant
    desc: 'Version chœur d’opéra et chorale urbaine virale sur les réseaux.'
  },
  {
    id: 'papaoutai',
    name: 'Stromae – Papaoutai (Original)',
    emoji: '🔥',
    mood: 'Tube TikTok • Hit Viral',
    startOffset: 50, // Refrain mythique "Où t'es Papaoutai" + drop électro
    desc: 'Démarre directement sur le refrain ultra rythmé et le drop mondial.'
  },
  {
    id: 'tiki',
    name: 'Danse Tiki Tiki',
    emoji: '💃',
    mood: 'Viral TikTok • Tendance',
    startOffset: 15, // Drop dansant TikTok
    desc: 'Démarre directement sur le drop dansant viral.'
  },
  {
    id: 'coupdumarteau',
    name: 'Tam Sir – Coup du Marteau',
    emoji: '⚡',
    mood: 'Hit Sénégal / CI • Ambiance',
    startOffset: 38, // Refrain explosif "Coup du marteau"
    desc: 'Démarre direct sur le refrain festif qui enflamme les réseaux.'
  },
  {
    id: 'calmdown',
    name: 'Rema – Calm Down',
    emoji: '🌍',
    mood: 'Afrobeats Mondial • Chill',
    startOffset: 30, // Refrain "Baby calm down..."
    desc: 'Démarre direct sur le hook mélodique mondial.'
  },
  {
    id: 'djadja',
    name: 'Aya Nakamura – Djadja',
    emoji: '👑',
    mood: 'Pop Urbaine • France & Afrique',
    startOffset: 30, // Refrain "Oh Djadja..."
    desc: 'Démarre direct sur le refrain entraînant.'
  },
  {
    id: 'makeba',
    name: 'Jain – Makeba',
    emoji: '🎶',
    mood: 'Tendance Reels • Énergique',
    startOffset: 36, // Drop "Ooohe Makeba..."
    desc: 'Démarre direct sur la transition virale des Reels.'
  },
  {
    id: 'love_nwantiti',
    name: 'CKay – Love Nwantiti',
    emoji: '❤️',
    mood: 'Acoustique Doux • Esthétique',
    startOffset: 35, // Refrain viral
    desc: 'Démarre direct sur le refrain doux et viral.'
  },
  {
    id: 'sabar',
    name: 'Sabar Dakar',
    emoji: '🥁',
    mood: 'Mbalax • Sénégal',
    startOffset: 0,
    desc: 'Rythme traditionnel sénégalais tama et percussions festives.'
  },
  {
    id: 'afrobeat',
    name: 'Afrobeats Vibes',
    emoji: '🌴',
    mood: 'Afrobeats • Moderne',
    startOffset: 0,
    desc: 'Groove chaleureux avec log drums pour annonces e-commerce.'
  },
  {
    id: 'amapiano',
    name: 'Amapiano Groove',
    emoji: '🎹',
    mood: 'Amapiano • Viral',
    startOffset: 8,
    desc: 'Basses profondes et piano jazz typique des vidéos TikTok tendances.'
  },
  {
    id: 'phonk',
    name: 'Phonk Drift',
    emoji: '🏎️',
    mood: 'Phonk • TikTok',
    startOffset: 6,
    desc: 'Rythme agressif et rapide pour produits gadgets / auto / high-tech.'
  }
];

const ID_RE = /^[a-z0-9_-]{2,60}$/;

export function isValidMusicId(id) {
  return typeof id === 'string' && ID_RE.test(id);
}

export function resolveMusicPath(id) {
  if (!isValidMusicId(id)) return null;
  const lib = path.join(MUSIC_DIR, `${id}.mp3`);
  if (fs.existsSync(lib)) return lib;
  const custom = path.join(CUSTOM_MUSIC_DIR, `${id}.mp3`);
  if (id.startsWith('custom-') && fs.existsSync(custom)) return custom;
  return null;
}

export function getMusicDefaultOffset(id) {
  const found = MUSIC_TRACKS.find((t) => t.id === id);
  if (found && typeof found.startOffset === 'number') {
    return found.startOffset;
  }
  return 0;
}

export function listMusic() {
  const tracks = MUSIC_TRACKS.map((t) => {
    const p = resolveMusicPath(t.id);
    return {
      ...t,
      ready: Boolean(p && fs.existsSync(p)),
      audioUrl: `/api/creatives/music?id=${t.id}`
    };
  });

  let custom = [];
  if (fs.existsSync(CUSTOM_MUSIC_DIR)) {
    custom = fs
      .readdirSync(CUSTOM_MUSIC_DIR)
      .filter((f) => /^custom-[a-z0-9_-]+\.mp3$/.test(f))
      .map((f) => {
        const id = f.replace(/\.mp3$/, '');
        let name = id;
        let startOffset = 0;
        const metaFile = path.join(CUSTOM_MUSIC_DIR, `${id}.json`);
        if (fs.existsSync(metaFile)) {
          try {
            const data = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
            name = data.name || id;
            startOffset = data.startOffset || 0;
          } catch {}
        }
        return {
          id,
          name,
          emoji: '🎵',
          mood: 'Ajoutée',
          desc: 'Musique personnalisée',
          startOffset,
          ready: true,
          custom: true,
          audioUrl: `/api/creatives/music?id=${id}`
        };
      });
  }

  return [...tracks, ...custom];
}
