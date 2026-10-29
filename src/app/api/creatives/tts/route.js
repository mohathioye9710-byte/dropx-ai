import { NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { generateVoice, resolveVoice } from '@/lib/videoPipeline.mjs';

// Voix de secours Microsoft (France) si ElevenLabs est indisponible
const EDGE_VOICE_MAP = {
  victoria: 'fr-FR-VivienneMultilingualNeural',
  audrey: 'fr-FR-DeniseNeural',
  leo: 'fr-FR-RemyMultilingualNeural',
  hugo: 'fr-FR-HenriNeural',
  nicolas: 'fr-FR-HenriNeural',
  theo: 'fr-FR-RemyMultilingualNeural'
};

export async function POST(req) {
  try {
    const { text, voice = 'victoria' } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Texte manquant' }, { status: 400 });
    }

    const cleanText = text.replace(/[*#_~`]+/g, '').trim().slice(0, 3000);
    const voiceKey = resolveVoice(voice) && Object.keys(EDGE_VOICE_MAP).includes(voice) ? voice : 'victoria';

    // 1. ElevenLabs : voix françaises natives (France)
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        const { audio } = await generateVoice({
          text: cleanText,
          voiceKey,
          apiKey: process.env.ELEVENLABS_API_KEY
        });
        return new NextResponse(audio, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': 'inline; filename="voiceover.mp3"',
            'X-Engine': 'ElevenLabs'
          }
        });
      } catch (err) {
        console.warn('ElevenLabs indisponible, bascule sur la voix Microsoft :', err.message);
      }
    }

    // 2. Secours : voix neuronale Microsoft (France)
    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(EDGE_VOICE_MAP[voiceKey], OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream(cleanText);
      const chunks = [];
      const buffer = await new Promise((resolve, reject) => {
        audioStream.on('data', (c) => chunks.push(c));
        audioStream.on('end', () => resolve(Buffer.concat(chunks)));
        audioStream.on('error', reject);
      });
      if (buffer.length > 1000) {
        return new NextResponse(buffer, {
          status: 200,
          headers: { 'Content-Type': 'audio/mpeg', 'X-Engine': 'EdgeNeural' }
        });
      }
    } catch (err) {
      console.warn('Voix Microsoft indisponible :', err.message);
    }

    return NextResponse.json({ error: 'Échec de la génération vocale' }, { status: 500 });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'Erreur synthèse vocale: ' + error.message }, { status: 500 });
  }
}
