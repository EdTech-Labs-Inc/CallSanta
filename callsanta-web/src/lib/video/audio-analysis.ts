/**
 * Audio Analysis Module
 * Extracts waveform data and duration from audio files for Remotion visualization
 */

export interface AudioAnalysis {
  durationSeconds: number;
  waveformData: number[];  // Normalized amplitude values (0-1)
  sampleRate: number;
}

/**
 * Analyze audio from URL and extract waveform data
 */
export async function analyzeAudio(audioUrl: string): Promise<AudioAnalysis> {
  console.log('[AudioAnalysis] Fetching audio from:', audioUrl);

  // Fetch the audio file
  const response = await fetch(audioUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  console.log(`[AudioAnalysis] Audio size: ${arrayBuffer.byteLength} bytes`);

  // Detect format and decode
  const contentType = response.headers.get('content-type') || '';
  console.log(`[AudioAnalysis] Content type: ${contentType}`);

  // For MP3 files, we need to use a different approach
  // Since we're in Node.js, we'll estimate duration from file size for MP3
  // and generate approximate waveform data
  
  if (contentType.includes('mpeg') || contentType.includes('mp3') || audioUrl.endsWith('.mp3')) {
    return analyzeMP3(arrayBuffer);
  }

  // For WAV files, we can analyze directly
  if (contentType.includes('wav') || audioUrl.endsWith('.wav')) {
    return analyzeWAV(arrayBuffer);
  }

  // Default: try to analyze as WAV, fallback to estimation
  try {
    return analyzeWAV(arrayBuffer);
  } catch {
    console.log('[AudioAnalysis] Falling back to MP3 estimation');
    return analyzeMP3(arrayBuffer);
  }
}

/**
 * Analyze WAV file format
 */
function analyzeWAV(arrayBuffer: ArrayBuffer): AudioAnalysis {
  const dataView = new DataView(arrayBuffer);
  
  // Parse WAV header
  // RIFF header
  const riff = String.fromCharCode(
    dataView.getUint8(0),
    dataView.getUint8(1),
    dataView.getUint8(2),
    dataView.getUint8(3)
  );
  
  if (riff !== 'RIFF') {
    throw new Error('Not a valid WAV file');
  }

  // Find fmt chunk
  let offset = 12;
  let sampleRate = 44100;
  let bitsPerSample = 16;
  let numChannels = 2;
  let dataOffset = 0;
  let dataSize = 0;

  while (offset < arrayBuffer.byteLength - 8) {
    const chunkId = String.fromCharCode(
      dataView.getUint8(offset),
      dataView.getUint8(offset + 1),
      dataView.getUint8(offset + 2),
      dataView.getUint8(offset + 3)
    );
    const chunkSize = dataView.getUint32(offset + 4, true);

    if (chunkId === 'fmt ') {
      numChannels = dataView.getUint16(offset + 10, true);
      sampleRate = dataView.getUint32(offset + 12, true);
      bitsPerSample = dataView.getUint16(offset + 22, true);
    } else if (chunkId === 'data') {
      dataOffset = offset + 8;
      dataSize = chunkSize;
      break;
    }

    offset += 8 + chunkSize;
    // Align to even byte
    if (chunkSize % 2 !== 0) offset++;
  }

  if (dataOffset === 0) {
    throw new Error('No data chunk found in WAV file');
  }

  // Calculate duration
  const bytesPerSample = bitsPerSample / 8;
  const totalSamples = dataSize / (bytesPerSample * numChannels);
  const durationSeconds = totalSamples / sampleRate;

  console.log(`[AudioAnalysis] WAV: ${durationSeconds}s, ${sampleRate}Hz, ${numChannels}ch, ${bitsPerSample}bit`);

  // Extract waveform data (downsample to ~100 samples per second for visualization)
  const samplesPerPoint = Math.floor(sampleRate / 100);
  const waveformLength = Math.ceil(totalSamples / samplesPerPoint);
  const waveformData: number[] = [];

  for (let i = 0; i < waveformLength && i < 10000; i++) {
    const sampleStart = i * samplesPerPoint;
    let maxAmplitude = 0;

    // Find peak amplitude in this chunk
    for (let j = 0; j < samplesPerPoint && sampleStart + j < totalSamples; j++) {
      const sampleIndex = sampleStart + j;
      const byteOffset = dataOffset + sampleIndex * bytesPerSample * numChannels;
      
      if (byteOffset + bytesPerSample <= arrayBuffer.byteLength) {
        let sample: number;
        
        if (bitsPerSample === 16) {
          sample = dataView.getInt16(byteOffset, true);
          sample = Math.abs(sample) / 32768;
        } else if (bitsPerSample === 8) {
          sample = dataView.getUint8(byteOffset);
          sample = Math.abs(sample - 128) / 128;
        } else {
          sample = 0.5;
        }

        maxAmplitude = Math.max(maxAmplitude, sample);
      }
    }

    waveformData.push(maxAmplitude);
  }

  // Normalize waveform
  const maxValue = Math.max(...waveformData, 0.01);
  const normalizedWaveform = waveformData.map(v => v / maxValue);

  return {
    durationSeconds,
    waveformData: normalizedWaveform,
    sampleRate,
  };
}

/**
 * Estimate MP3 audio properties
 * Since we can't easily decode MP3 in Node.js without additional dependencies,
 * we estimate based on file size and generate synthetic waveform
 */
function analyzeMP3(arrayBuffer: ArrayBuffer): AudioAnalysis {
  // Estimate duration from file size
  // Average MP3 bitrate is around 128-192 kbps
  // Using 160 kbps as estimate: 160 * 1000 / 8 = 20000 bytes per second
  const estimatedBitrate = 160000; // 160 kbps
  const bytesPerSecond = estimatedBitrate / 8;
  const durationSeconds = Math.max(1, arrayBuffer.byteLength / bytesPerSecond);

  console.log(`[AudioAnalysis] MP3 estimated duration: ${durationSeconds}s`);

  // Try to extract actual duration from ID3/Xing header
  const actualDuration = tryExtractMP3Duration(arrayBuffer) || durationSeconds;

  // Generate synthetic waveform based on actual audio data patterns
  const waveformData = generateSyntheticWaveform(arrayBuffer, actualDuration);

  return {
    durationSeconds: actualDuration,
    waveformData,
    sampleRate: 44100,
  };
}

/**
 * Try to extract MP3 duration from headers
 */
function tryExtractMP3Duration(arrayBuffer: ArrayBuffer): number | null {
  const dataView = new DataView(arrayBuffer);
  
  // Skip ID3v2 header if present
  let offset = 0;
  if (
    dataView.getUint8(0) === 0x49 && // 'I'
    dataView.getUint8(1) === 0x44 && // 'D'
    dataView.getUint8(2) === 0x33    // '3'
  ) {
    // ID3v2 header present
    const size = (
      (dataView.getUint8(6) & 0x7f) << 21 |
      (dataView.getUint8(7) & 0x7f) << 14 |
      (dataView.getUint8(8) & 0x7f) << 7 |
      (dataView.getUint8(9) & 0x7f)
    );
    offset = 10 + size;
  }

  // Look for Xing header (contains accurate duration info)
  // This is a simplified check - production code would be more thorough
  for (let i = offset; i < Math.min(offset + 1000, arrayBuffer.byteLength - 4); i++) {
    if (
      (dataView.getUint8(i) === 0x58 && // 'X'
       dataView.getUint8(i + 1) === 0x69 && // 'i'
       dataView.getUint8(i + 2) === 0x6e && // 'n'
       dataView.getUint8(i + 3) === 0x67) || // 'g'
      (dataView.getUint8(i) === 0x49 && // 'I'
       dataView.getUint8(i + 1) === 0x6e && // 'n'
       dataView.getUint8(i + 2) === 0x66 && // 'f'
       dataView.getUint8(i + 3) === 0x6f)    // 'o'
    ) {
      // Found Xing/Info header
      const flags = dataView.getUint32(i + 4, false);
      if (flags & 0x01) {
        // Frame count present
        const frames = dataView.getUint32(i + 8, false);
        // Assuming 44100Hz and 1152 samples per frame (standard MP3)
        return (frames * 1152) / 44100;
      }
    }
  }

  return null;
}

/**
 * Generate synthetic waveform that looks realistic
 */
function generateSyntheticWaveform(arrayBuffer: ArrayBuffer, durationSeconds: number): number[] {
  const pointsPerSecond = 100;
  const totalPoints = Math.ceil(durationSeconds * pointsPerSecond);
  const waveformData: number[] = [];
  
  const dataView = new DataView(arrayBuffer);
  
  // Sample random points from the audio data to create variation
  const step = Math.floor(arrayBuffer.byteLength / totalPoints);
  
  for (let i = 0; i < totalPoints && i < 10000; i++) {
    const byteOffset = Math.min(i * step, arrayBuffer.byteLength - 1);
    
    // Use audio byte values to create variation
    let value = 0;
    for (let j = 0; j < 10 && byteOffset + j < arrayBuffer.byteLength; j++) {
      value += dataView.getUint8(byteOffset + j);
    }
    value = (value / 10) / 255; // Normalize to 0-1
    
    // Add some natural variation
    const noise = Math.sin(i * 0.1) * 0.1 + Math.sin(i * 0.3) * 0.05;
    value = Math.max(0.1, Math.min(1, value + noise));
    
    waveformData.push(value);
  }

  // Smooth the waveform
  const smoothed: number[] = [];
  for (let i = 0; i < waveformData.length; i++) {
    const prev = waveformData[Math.max(0, i - 1)];
    const curr = waveformData[i];
    const next = waveformData[Math.min(waveformData.length - 1, i + 1)];
    smoothed.push((prev + curr * 2 + next) / 4);
  }

  return smoothed;
}

