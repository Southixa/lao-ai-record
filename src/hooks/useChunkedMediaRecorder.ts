import { useCallback, useEffect, useRef, useState } from 'react';

type Status = 'idle' | 'recording' | 'paused' | 'stopped' | 'error';

interface ChunkedRecorderOptions {
  /** Called every time a blob is ready (e.g. every 60 s). */
  onChunk: (blob: Blob, chunkIndex: number) => Promise<void> | void;
  /** getUserMedia constraints – default `{ audio: true }` */
  constraints?: MediaStreamConstraints;
  /** Timeslice in ms – how long each chunk should be. Default 60 000 (1 min). */
  timeslice?: number;
}

export function useChunkedMediaRecorder({
  onChunk,
  constraints = { audio: true },
  timeslice = 60_000,
}: ChunkedRecorderOptions) {
  // ────────────────────────────────────────────────────────────────────────────
  // state
  // ────────────────────────────────────────────────────────────────────────────
  const [status, setStatus]     = useState<Status>('idle');
  const [recordingTime, setRecordingTime] = useState('00:00');
  const chunkIndexRef           = useRef(0);

  // ────────────────────────────────────────────────────────────────────────────
  // refs used internally
  // ────────────────────────────────────────────────────────────────────────────
  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const clockTimerRef     = useRef<NodeJS.Timeout | null>(null);
  const startTsRef        = useRef<number>(0);

  // ────────────────────────────────────────────────────────────────────────────
  // helper – update the mm:ss / hh:mm:ss display
  // ────────────────────────────────────────────────────────────────────────────
  const tickClock = () => {
    const diff  = Date.now() - startTsRef.current;
    const total = Math.floor(diff / 1000);
    const h     = Math.floor(total / 3600);
    const m     = Math.floor((total % 3600) / 60);
    const s     = total % 60;

    const fmt   = (n: number) => String(n).padStart(2, '0');
    setRecordingTime(
      h > 0 ? `${fmt(h)}:${fmt(m)}:${fmt(s)}` : `${fmt(m)}:${fmt(s)}`
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  // start
  // ────────────────────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    if (status === 'recording' || status === 'paused') return; // already running

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const rec    = new MediaRecorder(stream);
      mediaRecorderRef.current = rec;
      chunkIndexRef.current    = 0;

      rec.ondataavailable = async (e: BlobEvent) => {
        if (!e.data.size) return;
        await onChunk(e.data, chunkIndexRef.current++);
      };

      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        clearInterval(clockTimerRef.current!);
        setStatus('stopped');
      };

      rec.start(timeslice);                // ← ask for a blob every timeslice ms
      startTsRef.current  = Date.now();
      clockTimerRef.current = setInterval(tickClock, 1000);
      setRecordingTime('00:00');
      setStatus('recording');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }, [constraints, onChunk, status, timeslice]);

  // ────────────────────────────────────────────────────────────────────────────
  // stop / pause / resume
  // ────────────────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    mediaRecorderRef.current?.stop(); // flushes final chunk, triggers onstop
  }, []);

  const pause = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setStatus('paused');
    }
  }, []);

  const resume = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setStatus('recording');
    }
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // clean up if the component using the hook unmounts
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => mediaRecorderRef.current?.stop();   // flush + release tracks
  }, []);

  return {
    /** 'idle' | 'recording' | 'paused' | 'stopped' | 'error' */
    status,
    /** convenient string for MM:SS or HH:MM:SS */
    recordingTime,
    isRecording: status === 'recording',
    /** start a fresh session */
    start,
    /** pause the running recorder (if supported) */
    pause,
    /** resume after a pause */
    resume,
    /** stop – will still push the final blob through `onChunk` */
    stop,
  };
}
