import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { Readable } from 'node:stream';
import {
  MUSIC_TRACKS,
  CUSTOM_MUSIC_DIR,
  resolveMusicPath,
  isValidMusicId
} from '@/lib/musicLibrary.mjs';

// GET : Liste les morceaux ou sert le fichier audio si ?id= est fourni
export async function GET(req) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  // 1. Streaming d'un morceau
  if (id) {
    if (!isValidMusicId(id)) {
      return new Response('Identifiant audio invalide', { status: 400 });
    }
    const filePath = resolveMusicPath(id);
    if (!filePath || !fs.existsSync(filePath)) {
      return new Response('Morceau non disponible', { status: 404 });
    }
    const stat = fs.statSync(filePath);
    return new Response(Readable.toWeb(fs.createReadStream(filePath)), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(stat.size),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  }

  // 2. Catalogue des morceaux disponibles (Vrais tubes viraux)
  const tracks = [
    {
      id: 'none',
      name: 'Sans musique',
      emoji: '🔇',
      mood: 'Voix off seule',
      desc: 'Aucun fond sonore, voix ultra épurée',
      ready: true,
      audioUrl: null
    },
    ...MUSIC_TRACKS.map((t) => {
      const p = resolveMusicPath(t.id);
      return {
        id: t.id,
        name: t.name,
        emoji: t.emoji,
        mood: t.mood,
        desc: t.desc,
        ready: Boolean(p && fs.existsSync(p)),
        audioUrl: `/api/creatives/music?id=${t.id}`
      };
    })
  ];

  // Ajout des morceaux personnalisés importés ou recherchés par l'utilisateur
  if (fs.existsSync(CUSTOM_MUSIC_DIR)) {
    const customFiles = fs
      .readdirSync(CUSTOM_MUSIC_DIR)
      .filter((f) => /^custom-[a-z0-9_-]+\.mp3$/.test(f));
    for (const f of customFiles) {
      const cId = f.replace(/\.mp3$/, '');
      let name = 'Musique ajoutée';
      const meta = path.join(CUSTOM_MUSIC_DIR, `${cId}.json`);
      if (fs.existsSync(meta)) {
        try {
          name = JSON.parse(fs.readFileSync(meta, 'utf8')).name || name;
        } catch {}
      }
      tracks.push({
        id: cId,
        name,
        emoji: '🎵',
        mood: 'Ajoutée',
        desc: 'Musique personnalisée',
        ready: true,
        custom: true,
        audioUrl: `/api/creatives/music?id=${cId}`
      });
    }
  }

  return NextResponse.json({ tracks });
}

// POST : Recherche de n'importe quelle vraie musique en ligne OU upload de fichier MP3
export async function POST(req) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // A. Recherche en ligne d'une vraie musique (Stromae, Tiki, Aya Nakamura, etc.)
    if (contentType.includes('application/json')) {
      const { search } = await req.json();
      const query = String(search || '').trim();
      if (!query || query.length < 2) {
        return NextResponse.json({ error: 'Veuillez saisir un titre ou un lien' }, { status: 400 });
      }

      fs.mkdirSync(CUSTOM_MUSIC_DIR, { recursive: true });
      const id = `custom-${crypto.randomBytes(4).toString('hex')}`;
      const outPattern = path.join(CUSTOM_MUSIC_DIR, `${id}.%(ext)s`);

      const isUrl = /^https?:\/\//i.test(query);
      const target = isUrl ? query : `ytsearch1:${query} audio`;

      await new Promise((resolve, reject) => {
        const proc = spawn('python', [
          '-m', 'yt_dlp',
          target,
          '-x',
          '--audio-format', 'mp3',
          '-o', outPattern,
          '--no-playlist',
          '--max-filesize', '15M',
          '--quiet'
        ]);
        let errStr = '';
        proc.stderr.on('data', (d) => { errStr += d.toString(); });
        proc.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`Téléchargement audio: ${errStr || 'Échec de recherche'}`));
        });
      });

      const mp3Path = path.join(CUSTOM_MUSIC_DIR, `${id}.mp3`);
      if (!fs.existsSync(mp3Path)) {
        return NextResponse.json({ error: 'Morceau introuvable' }, { status: 404 });
      }

      const cleanName = query.replace(/^https?:\/\/[^\s]+/i, 'Musique en ligne').slice(0, 50);
      fs.writeFileSync(
        path.join(CUSTOM_MUSIC_DIR, `${id}.json`),
        JSON.stringify({ id, name: cleanName, query, createdAt: new Date().toISOString() })
      );

      return NextResponse.json({
        track: {
          id,
          name: cleanName,
          emoji: '🎵',
          mood: 'Ajoutée',
          desc: 'Recherche personnalisée',
          ready: true,
          custom: true,
          audioUrl: `/api/creatives/music?id=${id}`
        }
      });
    }

    // B. Upload de fichier direct
    const formData = await req.formData();
    const file = formData.get('file');
    const name = (formData.get('name') || file?.name || 'Musique perso')
      .toString()
      .slice(0, 60);

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Fichier audio manquant' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'Le fichier dépasse la limite de 15 Mo' }, { status: 400 });
    }

    fs.mkdirSync(CUSTOM_MUSIC_DIR, { recursive: true });
    const id = `custom-${crypto.randomBytes(4).toString('hex')}`;
    const mp3Path = path.join(CUSTOM_MUSIC_DIR, `${id}.mp3`);
    fs.writeFileSync(mp3Path, buffer);
    fs.writeFileSync(
      path.join(CUSTOM_MUSIC_DIR, `${id}.json`),
      JSON.stringify({ id, name, createdAt: new Date().toISOString() })
    );

    return NextResponse.json({
      track: {
        id,
        name,
        emoji: '📁',
        mood: 'Fichier importé',
        desc: 'Fichier MP3 importé',
        ready: true,
        custom: true,
        audioUrl: `/api/creatives/music?id=${id}`
      }
    });
  } catch (err) {
    console.error('Music route error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
