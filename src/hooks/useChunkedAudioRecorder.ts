import { useCallback, useEffect, useRef, useState } from 'react';

export type Status = 'idle' | 'recording' | 'paused' | 'stopped' | 'error';

export interface ChunkedRecorderOptions {
  /** Called every time a blob is ready (e.g. every 60 s). */
  onChunk: (blob: Blob, chunkIndex: number) => Promise<void> | void;
  /** getUserMedia constraints – default `{ audio: true }` */
  constraints?: MediaStreamConstraints;
  /** Timeslice in seconds – how long each chunk should be. Default 600 (10 mins). */
  timesliceSeconds?: number;
}

export function useChunkedAudioRecorder({
    onChunk,
    constraints = { audio: true },
    timesliceSeconds = 5,
  }: ChunkedRecorderOptions) {
    const [status, setStatus]     = useState<Status>('idle');
    const [recordingTime, setRecordingTime] = useState('00:00');

    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
    const clockTimerRef     = useRef<NodeJS.Timeout | null>(null);
    const startTsRef        = useRef<number>(0);
    const pauseStartTsRef   = useRef<number>(0);
    const lastChunkTotalTimeRef = useRef<number>(0);
    const chunkIndexRef     = useRef(0);

    // Check browser compatibility
    const isBrowserCompatible = useRef<boolean>(typeof window !== 'undefined' && 'MediaRecorder' in window);

    const tickClock = async () => {
        const diff  = Date.now() - startTsRef.current;
        const totalSeconds = Math.floor(diff / 1000);
        const h     = Math.floor(totalSeconds / 3600);
        const m     = Math.floor((totalSeconds % 3600) / 60);
        const s     = totalSeconds % 60;
    
        const fmt   = (n: number) => String(n).padStart(2, '0');
        setRecordingTime(
          h > 0 ? `${fmt(h)}:${fmt(m)}:${fmt(s)}` : `${fmt(m)}:${fmt(s)}`
        );
    
        if(totalSeconds <= 0) return;
    
        // trigger every 5 seconds (pause included)
        if(totalSeconds >= lastChunkTotalTimeRef.current + timesliceSeconds) {
            if(mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
            }
            lastChunkTotalTimeRef.current = totalSeconds;
            try {
                await chunkRecording();
            } catch (error) {
                throw error;
            }
        }
      };

      const chunkRecording = async () => {
        if(!streamRef.current) return;
        try {
            const mediaRecorder = new MediaRecorder(streamRef.current);
            mediaRecorderRef.current = mediaRecorder;
    
            mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > 0) {
                    chunkIndexRef.current++;
                    const audioBlob = new Blob([event.data], { type: "audio/webm" });
                    try {
                        await onChunk(audioBlob, chunkIndexRef.current);
                    } catch (error) {
                        console.error("Error during on Chunk execution:", error);
                    }
                  }
              };
    
                mediaRecorder.onstop = async () => {
                  // Handle normal stop of individual chunk
                };
    
              mediaRecorder.onpause = async () => {
                    setStatus('paused');
                    if(clockTimerRef.current) {
                        clearInterval(clockTimerRef.current);
                        clockTimerRef.current = null;
                    }
                    pauseStartTsRef.current = Date.now();
              };
    
                mediaRecorder.onresume = async () => {
                setStatus('recording');
                const pausedDuration = Date.now() - pauseStartTsRef.current;
                startTsRef.current = startTsRef.current + pausedDuration;
                if(!clockTimerRef.current) {
                    clockTimerRef.current = setInterval(tickClock, 1000);
                }
              };
    
                mediaRecorder.start();
    
        } catch (error) {
            if(mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
            }
            if(clockTimerRef.current) {
                clearInterval(clockTimerRef.current);
                clockTimerRef.current = null;
            }
            if(streamRef.current){
                streamRef.current.getTracks().forEach(t => t.stop());
            }
            setStatus('error');
            throw error;
        }
      };


      const start = async () => {
        if(status === 'recording' || status === 'paused') return;

        if (!isBrowserCompatible.current) {
          throw new Error('MediaRecorder is not supported in this browser.');
        }

        try {
            // Reset states for new recording
            chunkIndexRef.current = 0;
            lastChunkTotalTimeRef.current = 0;
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            await chunkRecording();
            startTsRef.current = Date.now();
            clockTimerRef.current = setInterval(tickClock, 1000);
            setRecordingTime('00:00');
            setStatus('recording');
        } catch (error) {
            throw error;
        }
     }


     const stop = useCallback(() => {
        if(status === 'recording' || status === 'paused') {
            if(mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
            }
            if(clockTimerRef.current) {
                clearInterval(clockTimerRef.current);
                clockTimerRef.current = null;
            }
            if(streamRef.current){
                streamRef.current.getTracks().forEach(t => t.stop());
            }
            setStatus('stopped');
        }
     }, [status]);
    
     const pause = useCallback(() => {
        if(status === 'recording' && mediaRecorderRef.current) {
            mediaRecorderRef.current.pause();
        }
     }, [status]);
    
     const resume = useCallback(() => {
        if(status === 'paused' && mediaRecorderRef.current) {
            mediaRecorderRef.current.resume();
        }
     }, [status]);

     useEffect(() => {
        return () => {
            if(status === 'recording' || status === 'paused') {
                if(mediaRecorderRef.current) {
                    mediaRecorderRef.current.stop(); 
                }
                if(streamRef.current){
                    streamRef.current.getTracks().forEach(t => t.stop());
                }
                if(clockTimerRef.current) {
                    clearInterval(clockTimerRef.current);
                }
                setStatus('stopped');
            }
        };
      }, []);

     return { status, recordingTime, start, stop, pause, resume }

  }