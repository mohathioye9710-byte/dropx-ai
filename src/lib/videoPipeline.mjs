import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

// ---------------------------------------------------------------------------
// Voix françaises NATIVES (France) de la bibliothèque ElevenLabs.
// Utilisables directement par ID avec le modèle eleven_multilingual_v2.
// ---------------------------------------------------------------------------
export const FR_VOICES = {
  victoria: { id: 'O31r762Gb3WFygrEOGh0', label: 'Victoria', desc: 'Créatrice de contenu, jeune, naturelle (Paris)', gender: 'female' },
  audrey:   { id: 'McVZB9hVxVSk3Equu8EH', label: 'Audrey',   desc: 'Commerciale énergique, ton publicitaire',      gender: 'female' },
  leo:      { id: 'AfbuxQ9DVtS4azaxN1W7', label: 'Léo',      desc: 'Rassurant et dynamique (Paris)',              gender: 'male' },
  hugo:     { id: 'DbbNuBL7lf62XwY7arQb', label: 'Hugo',     desc: 'Jeune, sérieux et professionnel',             gender: 'male' },
  nicolas:  { id: 'AmMsHJaCw4BtwV3KoUXF', label: 'Nicolas',  desc: 'Convaincant et lumineux',                     gender: 'male' },
  theo:     { id: 'NyxenPOqNyllHIzSoPbJ', label: 'Théo',     desc: 'Chaleureux et jeune',                         gender: 'male' }
};

export const DEFAULT_VOICE = 'victoria';

export function resolveVoice(key) {
  return FR_VOICES[key] || FR_VOICES[DEFAULT_VOICE];
}

// ---------------------------------------------------------------------------
// 1. Voix off ElevenLabs + horodatage caractère par caractère
// ---------------------------------------------------------------------------
export async function generateVoice({ text, voiceKey, apiKey }) {
  const voice = resolveVoice(voiceKey);
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        language_code: 'fr',
        voice_settings: {
          stability: 0.42,
          similarity_boost: 0.8,
          style: 0.4,
          use_speaker_boost: true,
          speed: 1.03
        }
      })
    }
  );
  if (!res.ok) {
    throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const json = await res.json();
  return {
    audio: Buffer.from(json.audio_base64, 'base64'),
    alignment: json.alignment
  };
}

// ---------------------------------------------------------------------------
// 2. Replicate : upload de fichiers + Kling Avatar v2
// ---------------------------------------------------------------------------
export async function replicateUpload({ buffer, filename, contentType, token }) {
  const form = new FormData();
  form.append('content', new Blob([buffer], { type: contentType }), filename);
  const res = await fetch('https://api.replicate.com/v1/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  if (!res.ok) {
    throw new Error(`Replicate upload ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const json = await res.json();
  return json.urls.get;
}

export async function startAvatarPrediction({ imageUrl, audioUrl, prompt, quality = 'std', token }) {
  const res = await fetch('https://api.replicate.com/v1/models/kwaivgi/kling-avatar-v2/predictions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: {
        image: imageUrl,
        audio: audioUrl,
        mode: quality === 'pro' ? 'pro' : 'std',
        prompt
      }
    })
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.detail || json.title || `Replicate ${res.status}`);
  }
  return json;
}

export async function getPrediction({ id, token }) {
  const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

// ---------------------------------------------------------------------------
// 3. Sous-titres animés façon TikTok (ASS) à partir des timestamps
// ---------------------------------------------------------------------------
function toWords(alignment) {
  const chars = alignment.characters;
  const starts = alignment.character_start_times_seconds;
  const ends = alignment.character_end_times_seconds;
  const words = [];
  let cur = null;
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (/\s/.test(c)) {
      if (cur) { words.push(cur); cur = null; }
      continue;
    }
    if (!cur) cur = { text: '', start: starts[i], end: ends[i] };
    cur.text += c;
    cur.end = ends[i];
  }
  if (cur) words.push(cur);
  return words
    .map((w) => ({
      ...w,
      endsPhrase: /[.!?…]$/.test(w.text),
      text: w.text.replace(/[{}\\]/g, '').replace(/[,.;:…]+/g, '').toUpperCase()
    }))
    .filter((w) => w.text.length > 0);
}

function chunkWords(words, maxWords = 3, maxChars = 20) {
  const chunks = [];
  let cur = [];
  for (const w of words) {
    const nextLen = cur.reduce((n, x) => n + x.text.length + 1, 0) + w.text.length;
    if (cur.length && (cur.length >= maxWords || nextLen > maxChars)) {
      chunks.push(cur);
      cur = [];
    }
    cur.push(w);
    if (w.endsPhrase) {
      chunks.push(cur);
      cur = [];
    }
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}

function assTime(t) {
  const cs = Math.max(0, Math.round(t * 100));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  const c = cs % 100;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`;
}

export function buildAss({ alignment, duration, badgeText, ctaText }) {
  const WHITE = '&H00FFFFFF&';
  const YELLOW = '&H0000D7FF&'; // BGR de #FFD700

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Montserrat Black,92,${WHITE},${WHITE},&H00000000&,&H96000000&,0,0,0,0,100,100,0,0,1,9,3,2,60,60,560,1
Style: Badge,Montserrat ExtraBold,38,&H00FFFFFF&,&H00FFFFFF&,&H002B2BE0&,&H002B2BE0&,0,0,0,0,100,100,1,0,3,14,0,8,40,40,150,1
Style: Cta,Montserrat Black,48,&H00000000&,&H00000000&,&H0015CCFA&,&H0015CCFA&,0,0,0,0,100,100,1,0,3,18,0,2,40,40,210,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const lines = [];

  if (badgeText) {
    lines.push(`Dialogue: 0,${assTime(0)},${assTime(duration)},Badge,,0,0,0,,${badgeText}`);
  }
  if (ctaText) {
    const ctaStart = Math.max(0, duration * 0.62);
    lines.push(
      `Dialogue: 0,${assTime(ctaStart)},${assTime(duration)},Cta,,0,0,0,,{\\fscx90\\fscy90\\t(0,180,\\fscx100\\fscy100)}${ctaText}`
    );
  }

  const chunks = chunkWords(toWords(alignment));
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i++) {
      const start = chunk[i].start;
      const end = i + 1 < chunk.length ? chunk[i + 1].start : Math.min(chunk[i].end + 0.12, duration);
      const text = chunk
        .map((w, j) => `{\\c${j === i ? YELLOW : WHITE}}${w.text}`)
        .join(' ');
      const pop = i === 0 ? '{\\fscx88\\fscy88\\t(0,110,\\fscx100\\fscy100)}' : '';
      lines.push(`Dialogue: 1,${assTime(start)},${assTime(end)},Caption,,0,0,0,,${pop}${text}`);
    }
  }

  return header + lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// 4. ffmpeg : mise en forme 1080x1920 + sous-titres incrustés + voix originale
// ---------------------------------------------------------------------------
export function runFfmpeg(args, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.env.FFMPEG_PATH || 'ffmpeg', args, { cwd });
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve(stderr);
      else reject(new Error(`ffmpeg code ${code}: ${stderr.slice(-600)}`));
    });
  });
}

export async function burnSubtitles({ workDir, fontsSrcDir }) {
  const fontsDir = path.join(workDir, 'fonts');
  fs.mkdirSync(fontsDir, { recursive: true });
  for (const f of fs.readdirSync(fontsSrcDir)) {
    fs.copyFileSync(path.join(fontsSrcDir, f), path.join(fontsDir, f));
  }
  // Chemins relatifs + cwd = dossier du job : évite l'enfer d'échappement Windows (C:\...)
  await runFfmpeg(
    [
      '-y',
      '-i', 'avatar.mp4',
      '-i', 'voice.mp3',
      '-map', '0:v:0',
      '-map', '0:a:0?',
      '-vf',
      'scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,unsharp=5:5:0.7:5:5:0.0,ass=subs.ass:fontsdir=fonts',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '17',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-c:a', 'aac',
      '-b:a', '256k',
      '-shortest',
      '-movflags', '+faststart',
      'out.mp4'
    ],
    workDir
  );
  return path.join(workDir, 'out.mp4');
}

// ---------------------------------------------------------------------------
// 5. Musique de fond : mixage qui ne gêne jamais la voix off
//    - la musique est bouclée, coupée à la durée de la vidéo, avec fondu entrée/sortie
//    - EQ : on creuse la zone de la voix (1–4 kHz) et on coupe les extrêmes
//    - sidechain : la musique baisse automatiquement quand la voix parle
//    - la vidéo n'est pas ré-encodée (copy) => remix quasi instantané
// ---------------------------------------------------------------------------
export function probeDuration(file, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.env.FFMPEG_PATH || 'ffmpeg', ['-i', file], { cwd });
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', reject);
    proc.on('close', () => {
      const m = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(stderr);
      if (!m) return reject(new Error('Durée vidéo introuvable'));
      resolve(Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]));
    });
  });
}

export async function mixMusic({ workDir, volume = 0.35, startOffset = 0 }) {
  // base.mp4 = vidéo avec voix seule, music.mp3 = piste choisie (relatifs au workDir)
  const dur = await probeDuration('base.mp4', workDir);
  const vol = Math.min(1.5, Math.max(0.05, Number(volume) || 0.35));
  const offset = Math.max(0, Number(startOffset) || 0);
  const fadeOutStart = Math.max(0, dur - 1.2).toFixed(2);

  // Chaîne audio équilibrée & confortable :
  // 1. Voix claire, douce et parfaitement audible
  // 2. Musique en fond sonore mélodique et rythmé à volume modéré (35%)
  // 3. Sidechain ducking propre
  // 4. Mastering standard confortable à -14.3 LUFS
  const filter = [
    '[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,highpass=f=80,equalizer=f=3200:t=q:w=1.2:g=1.5,volume=1.0[voice_norm]',
    '[voice_norm]asplit=2[voice][sc]',
    `[1:a]aloop=loop=-1:size=2147483647,atrim=0:${dur.toFixed(2)},asetpts=N/SR/TB,` +
      'aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,' +
      `afade=t=in:d=0.3,afade=t=out:st=${fadeOutStart}:d=1.2,` +
      `volume=${vol.toFixed(3)}[music_prep]`,
    '[music_prep][sc]sidechaincompress=threshold=0.08:ratio=2.5:attack=20:release=180:makeup=1.0[ducked_music]',
    '[voice][ducked_music]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,' +
      'loudnorm=I=-14.3:TP=-1.0:LRA=5.5,' +
      'alimiter=limit=0.95[a]'
  ].join(';');

  await runFfmpeg(
    [
      '-y',
      '-i', 'base.mp4',
      '-ss', String(offset),
      '-i', 'music.mp3',
      '-filter_complex', filter,
      '-map', '0:v:0',
      '-map', '[a]',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '320k',
      '-ar', '48000',
      '-movflags', '+faststart',
      'mixed.mp4'
    ],
    workDir
  );
  return path.join(workDir, 'mixed.mp4');
}

