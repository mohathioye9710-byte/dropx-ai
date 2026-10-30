import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';

const RENDERS_DIR = path.join(process.cwd(), 'data', 'renders');

// Sert les vidéos / voix générées (avec support Range pour pouvoir avancer dans la vidéo)
export async function GET(req, { params }) {
  const { id } = await params;
  if (!/^[a-f0-9]{6,32}$/.test(id)) {
    return new Response('Identifiant invalide', { status: 400 });
  }

  const url = new URL(req.url);
  const isVoice = url.searchParams.get('type') === 'voice';
  const download = url.searchParams.get('download') === '1';
  const file1 = path.join(RENDERS_DIR, `${id}.${isVoice ? 'mp3' : 'mp4'}`);
  const file2 = path.join(process.cwd(), 'public', 'renders', `${id}.${isVoice ? 'mp3' : 'mp4'}`);
  const file = fs.existsSync(file1) ? file1 : file2;

  if (!fs.existsSync(file)) {
    return new Response('Fichier introuvable', { status: 404 });
  }

  const { size } = fs.statSync(file);
  const contentType = isVoice ? 'audio/mpeg' : 'video/mp4';
  const baseHeaders = {
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=3600'
  };
  if (download) {
    baseHeaders['Content-Disposition'] = `attachment; filename="dropx-${id}.${isVoice ? 'mp3' : 'mp4'}"`;
  }

  const range = req.headers.get('range');
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    if (match) {
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? Math.min(parseInt(match[2], 10), size - 1) : size - 1;
      if (start <= end && start < size) {
        return new Response(Readable.toWeb(fs.createReadStream(file, { start, end })), {
          status: 206,
          headers: {
            ...baseHeaders,
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Content-Length': String(end - start + 1)
          }
        });
      }
    }
  }

  return new Response(Readable.toWeb(fs.createReadStream(file)), {
    status: 200,
    headers: { ...baseHeaders, 'Content-Length': String(size) }
  });
}
