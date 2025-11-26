const ELEVENLABS_STT_URL = 'https://api.elevenlabs.io/v1/speech-to-text';
const TRANSCRIPTION_TIMEOUT_MS = 15000;

interface ElevenLabsTranscriptResponse {
  text: string;
  language_code?: string;
  language_probability?: number;
}

/**
 * Transcribes audio using ElevenLabs Speech-to-Text API (Scribe v1)
 * Returns null on failure (graceful degradation)
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string
): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    console.warn('ELEVENLABS_API_KEY not configured, skipping transcription');
    return null;
  }

  try {
    const formData = new FormData();
    // Convert Buffer to Uint8Array for Blob compatibility
    const uint8Array = new Uint8Array(audioBuffer);
    formData.append('file', new Blob([uint8Array]), filename);
    formData.append('model_id', 'scribe_v1');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TRANSCRIPTION_TIMEOUT_MS);

    const response = await fetch(ELEVENLABS_STT_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs STT API error:', response.status, error);
      return null;
    }

    const result: ElevenLabsTranscriptResponse = await response.json();
    return result.text?.trim() || null;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Transcription timed out after', TRANSCRIPTION_TIMEOUT_MS, 'ms');
    } else {
      console.error('Transcription error:', error);
    }
    return null;
  }
}
