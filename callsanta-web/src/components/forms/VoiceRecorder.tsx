'use client';

import { cn } from "@/lib/utils";
import { useState, useRef, useCallback } from "react";
import { Mic, Square, Play, Pause, Trash2 } from "lucide-react";

interface VoiceRecorderProps {
  onRecordingChange: (file: File | null) => void;
  label?: string;
  description?: string;
  maxDuration?: number; // in seconds
}

type RecordingState = 'idle' | 'recording' | 'recorded';

export function VoiceRecorder({
  onRecordingChange,
  label,
  description,
  maxDuration = 120, // 2 minutes default
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        const file = new File([audioBlob], `voice-message-${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        onRecordingChange(file);
        setState('recorded');

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setState('recording');
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(d => {
          if (d >= maxDuration - 1) {
            stopRecording();
            return maxDuration;
          }
          return d + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Could not access microphone. Please check your permissions.');
    }
  }, [maxDuration, onRecordingChange]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [state]);

  const playPause = useCallback(() => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying, audioUrl]);

  const deleteRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setDuration(0);
    setState('idle');
    setIsPlaying(false);
    onRecordingChange(null);
  }, [audioUrl, onRecordingChange]);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      {description && (
        <p className="text-sm text-gray-500 mb-3">{description}</p>
      )}

      <div className={cn(
        "border-2 border-dashed rounded-xl p-6 transition-colors",
        state === 'recording' ? "border-santa-red bg-red-50" : "border-gray-200"
      )}>
        {/* Idle State */}
        {state === 'idle' && (
          <div className="text-center">
            <button
              type="button"
              onClick={startRecording}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full transition-colors hover:opacity-90"
              style={{ backgroundColor: '#C41E3A', color: 'white' }}
            >
              <Mic className="w-7 h-7" />
            </button>
            <p className="mt-3 text-sm text-gray-600">
              Click to start recording (max {formatDuration(maxDuration)})
            </p>
          </div>
        )}

        {/* Recording State */}
        {state === 'recording' && (
          <div className="text-center">
            <div className="relative inline-block">
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full transition-colors animate-pulse hover:opacity-90"
                style={{ backgroundColor: '#C41E3A', color: 'white' }}
              >
                <Square className="w-6 h-6" />
              </button>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
            </div>
            <p className="mt-3 text-lg font-mono font-medium" style={{ color: '#C41E3A' }}>
              {formatDuration(duration)}
            </p>
            <p className="text-sm text-gray-600">Recording... Click to stop</p>
          </div>
        )}

        {/* Recorded State */}
        {state === 'recorded' && audioUrl && (
          <div className="space-y-4">
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={playPause}
                className="inline-flex items-center justify-center w-12 h-12 rounded-full transition-colors hover:opacity-90"
                style={{ backgroundColor: '#165B33', color: 'white' }}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <span className="font-mono text-gray-700">{formatDuration(duration)}</span>
              <button
                type="button"
                onClick={deleteRecording}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full text-gray-500 hover:bg-gray-100 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <p className="text-center text-sm text-gray-500">
              Recording ready - will be included with your booking
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
