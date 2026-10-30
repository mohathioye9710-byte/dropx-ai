import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { resolveMusicPath, isValidMusicId, getMusicDefaultOffset } from '@/lib/musicLibrary.mjs';
import { mixMusic } from '@/lib/videoPipeline.mjs';

const RENDERS_DIR = path.join(process.cwd(), 'data', 'renders');

export async function POST(req) {
  try {
    const { videoId, musicId = 'none', musicVolume = 0.18, startOffset } = await req.json();

    if (!videoId || !/^[a-f0-9]{6,32}$/.test(videoId)) {
      return NextResponse.json({ error: 'Identifiant vidéo invalide' }, { status: 400 });
    }

    const targetFile = path.join(RENDERS_DIR, `${videoId}.mp4`);
    const baseFile = path.join(RENDERS_DIR, `${videoId}-base.mp4`);

    if (!fs.existsSync(targetFile) && !fs.existsSync(baseFile)) {
      return NextResponse.json({ error: 'Fichier vidéo introuvable' }, { status: 404 });
    }

    // Sauvegarde de la version originale sans musique si pas encore fait
    if (!fs.existsSync(baseFile)) {
      fs.copyFileSync(targetFile, baseFile);
    }

    // 1. Si "Sans musique", on restaure simplement la vidéo de base
    if (musicId === 'none') {
      fs.copyFileSync(baseFile, targetFile);
      return NextResponse.json({
        success: true,
        videoUrl: `/api/creatives/render/${videoId}?t=${Date.now()}`,
        musicId: 'none'
      });
    }

    // 2. Mixage de la piste demandée
    if (!isValidMusicId(musicId)) {
      return NextResponse.json({ error: 'Identifiant musique invalide' }, { status: 400 });
    }

    const musicPath = resolveMusicPath(musicId);
    if (!musicPath || !fs.existsSync(musicPath)) {
      return NextResponse.json({ error: 'Piste musicale non disponible' }, { status: 404 });
    }

    const workDir = path.join(RENDERS_DIR, `remix-${crypto.randomBytes(4).toString('hex')}`);
    fs.mkdirSync(workDir, { recursive: true });

    try {
      fs.copyFileSync(baseFile, path.join(workDir, 'base.mp4'));
      fs.copyFileSync(musicPath, path.join(workDir, 'music.mp3'));
      const defaultOffset = getMusicDefaultOffset(musicId);
      const effectiveOffset = typeof startOffset === 'number' ? startOffset : defaultOffset;

      const mixed = await mixMusic({
        workDir,
        volume: Number(musicVolume) || 0.18,
        startOffset: effectiveOffset
      });

      fs.copyFileSync(mixed, targetFile);

      // Keep public/renders updated too
      const publicTarget = path.join(process.cwd(), 'public', 'renders', `${videoId}.mp4`);
      try {
        fs.mkdirSync(path.dirname(publicTarget), { recursive: true });
        fs.copyFileSync(mixed, publicTarget);
      } catch (e) {}

      return NextResponse.json({
        success: true,
        videoUrl: `/api/creatives/render/${videoId}?t=${Date.now()}`,
        musicId,
        musicVolume,
        startOffset: effectiveOffset
      });
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.error('Remix music error:', err);
    return NextResponse.json({ error: 'Erreur mixage: ' + err.message }, { status: 500 });
  }
}
