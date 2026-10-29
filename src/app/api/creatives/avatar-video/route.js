import { NextResponse, after } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  generateVoice,
  replicateUpload,
  startAvatarPrediction,
  getPrediction,
  buildAss,
  burnSubtitles,
  mixMusic
} from '@/lib/videoPipeline.mjs';
import { resolveMusicPath, getMusicDefaultOffset } from '@/lib/musicLibrary.mjs';

export const maxDuration = 900;

const RENDERS_DIR = path.join(process.cwd(), 'data', 'renders');
const FONTS_DIR = path.join(process.cwd(), 'assets', 'fonts');
const AVATARS_DIR = path.join(process.cwd(), 'public', 'avatars');

const AVATAR_FILES = { 
  aminata: 'aminata.jpg', 
  moussa: 'moussa.jpg',
  aminata_kitchen: 'aminata.jpg',
  moussa_living: 'moussa.jpg'
};

// Les jobs vivent en mémoire du serveur (globalThis survit au rechargement à chaud)
const jobs = (globalThis.__dropxVideoJobs ||= new Map());

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function publicJob(job) {
  return {
    id: job.id,
    status: job.status,
    step: job.step,
    progress: job.progress,
    videoUrl: job.videoUrl || null,
    voiceUrl: job.voiceUrl || null,
    duration: job.duration || null,
    error: job.error || null
  };
}

async function runJob(job, params) {
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  const workDir = path.join(RENDERS_DIR, `tmp-${job.id}`);

  try {
    fs.mkdirSync(workDir, { recursive: true });

    // 1. Voix française native + horodatage mot par mot
    job.status = 'running';
    job.step = 'Génération de la voix off française (ElevenLabs)…';
    job.progress = 8;
    const { audio, alignment } = await generateVoice({
      text: params.text,
      voiceKey: params.voice,
      apiKey: elevenKey
    });
    fs.writeFileSync(path.join(workDir, 'voice.mp3'), audio);
    fs.writeFileSync(path.join(RENDERS_DIR, `${job.id}.mp3`), audio);
    job.voiceUrl = `/api/creatives/render/${job.id}?type=voice`;
    const duration = alignment.character_end_times_seconds.at(-1) + 0.4;
    job.duration = Number(duration.toFixed(1));

    // 2. Avatar réaliste animé (Kling Avatar v2)
    job.step = 'Envoi de la photo et de la voix au moteur d’avatar…';
    job.progress = 15;
    const imageBuf = fs.readFileSync(path.join(AVATARS_DIR, AVATAR_FILES[params.avatarId]));
    const [imageUrl, audioUrl] = await Promise.all([
      replicateUpload({ buffer: imageBuf, filename: 'avatar.jpg', contentType: 'image/jpeg', token: replicateToken }),
      replicateUpload({ buffer: audio, filename: 'voice.mp3', contentType: 'audio/mpeg', token: replicateToken })
    ]);

    const prompt =
      'A real person recording a casual selfie-style UGC video for TikTok, talking naturally and expressively to the camera, ' +
      'natural facial expressions, subtle blinking and head movements, genuine smile, lip movements perfectly matching the speech, ' +
      'holding the product naturally, stable framing, no camera cuts.';

    const prediction = await startAvatarPrediction({
      imageUrl,
      audioUrl,
      prompt,
      quality: params.quality,
      token: replicateToken
    });

    job.step = 'Animation du visage et synchronisation labiale (1080p)…';
    const startedAt = Date.now();
    let current = prediction;
    while (current.status !== 'succeeded') {
      if (current.status === 'failed' || current.status === 'canceled') {
        throw new Error(`Avatar : ${current.error || current.status}`);
      }
      if (Date.now() - startedAt > 12 * 60 * 1000) throw new Error('Délai dépassé côté moteur d’avatar');
      await sleep(4000);
      current = await getPrediction({ id: prediction.id, token: replicateToken });
      // progression estimée (le moteur ne renvoie pas de pourcentage)
      const elapsed = (Date.now() - startedAt) / 1000;
      job.progress = Math.min(82, 20 + Math.round((elapsed / (duration * 7)) * 62));
    }

    // 3. Téléchargement de la vidéo brute
    job.step = 'Téléchargement de la vidéo…';
    job.progress = 84;
    const videoRes = await fetch(current.output);
    if (!videoRes.ok) throw new Error(`Téléchargement vidéo ${videoRes.status}`);
    fs.writeFileSync(path.join(workDir, 'avatar.mp4'), Buffer.from(await videoRes.arrayBuffer()));

    // 4. Sous-titres animés + bandeaux + mise au format 1080x1920
    job.step = 'Incrustation des sous-titres animés…';
    job.progress = 90;
    fs.writeFileSync(
      path.join(workDir, 'subs.ass'),
      buildAss({
        alignment,
        duration,
        badgeText: params.badgeText,
        ctaText: params.ctaText
      })
    );
    const out = await burnSubtitles({ workDir, fontsSrcDir: FONTS_DIR });
    fs.copyFileSync(out, path.join(RENDERS_DIR, `${job.id}-base.mp4`));

    // 5. Mixage de la musique de fond avec ducking (baisse sous la voix off)
    const musicPath =
      params.musicId && params.musicId !== 'none'
        ? resolveMusicPath(params.musicId)
        : null;

    if (musicPath && fs.existsSync(musicPath)) {
      job.step = 'Mixage musique de fond & égalisation voix off…';
      job.progress = 95;
      fs.copyFileSync(out, path.join(workDir, 'base.mp4'));
      fs.copyFileSync(musicPath, path.join(workDir, 'music.mp3'));
      const offset = typeof params.startOffset === 'number'
        ? params.startOffset
        : getMusicDefaultOffset(params.musicId);

      const mixed = await mixMusic({
        workDir,
        volume: Number(params.musicVolume) || 0.45,
        startOffset: offset
      });
      fs.copyFileSync(mixed, path.join(RENDERS_DIR, `${job.id}.mp4`));
    } else {
      fs.copyFileSync(out, path.join(RENDERS_DIR, `${job.id}.mp4`));
    }

    job.videoUrl = `/api/creatives/render/${job.id}`;
    job.progress = 100;
    job.step = 'Terminé';
    job.status = 'done';
  } catch (err) {
    console.error('Avatar job failed:', err);
    job.status = 'failed';
    job.error = err.message;
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

// GET ?id=... : état d'un job
export async function GET(req) {
  const id = new URL(req.url).searchParams.get('id');
  const job = id && jobs.get(id);
  if (!job) {
    return NextResponse.json({ error: 'Job introuvable (le serveur a peut-être redémarré)' }, { status: 404 });
  }
  return NextResponse.json(publicJob(job));
}

// POST : démarre la création d'une vidéo avatar
export async function POST(req) {
  try {
    const {
      avatarId = 'aminata',
      text,
      voice = 'victoria',
      quality = 'std',
      price,
      badgeText,
      ctaText,
      musicId = 'afrobeat',
      musicVolume = 0.25
    } = await req.json();

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: 'REPLICATE_API_TOKEN manquante' }, { status: 500 });
    }
    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: 'ELEVENLABS_API_KEY manquante' }, { status: 500 });
    }
    if (!AVATAR_FILES[avatarId]) {
      return NextResponse.json({ error: 'Avatar inconnu' }, { status: 400 });
    }
    const cleanText = String(text || '').replace(/[*#_~`]+/g, '').trim().slice(0, 900);
    if (cleanText.length < 10) {
      return NextResponse.json({ error: 'Texte de voix off trop court' }, { status: 400 });
    }

    fs.mkdirSync(RENDERS_DIR, { recursive: true });
    const job = {
      id: crypto.randomBytes(6).toString('hex'),
      status: 'queued',
      step: 'En file d’attente…',
      progress: 2
    };
    jobs.set(job.id, job);

    const params = {
      avatarId,
      text: cleanText,
      voice,
      quality,
      badgeText: badgeText || 'PAIEMENT À LA LIVRAISON  •  LIVRAISON 24H',
      ctaText: ctaText || (price ? `COMMANDER  •  ${price}` : 'COMMANDER MAINTENANT'),
      musicId,
      musicVolume
    };

    after(() => runJob(job, params));

    return NextResponse.json(publicJob(job));
  } catch (error) {
    console.error('Avatar Video error:', error);
    return NextResponse.json({ error: 'Erreur serveur: ' + error.message }, { status: 500 });
  }
}
