'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FaPlayCircle, FaPauseCircle } from 'react-icons/fa';
import { Button } from "@/components/ui/button";
import WaveSurfer from 'wavesurfer.js';
import Hover from 'wavesurfer.js/dist/plugins/hover.esm.js';

// Define methods that will be exposed to parent component
export interface AudioPlayerHandle {
  seekToTimestamp: (timestamp: string) => void;
}

interface AudioPlayerProps {
  audioUrl: string;
}

const AudioPlayer = forwardRef<AudioPlayerHandle, AudioPlayerProps>(({ audioUrl }, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  // Expose seekToTimestamp method to parent component
  useImperativeHandle(ref, () => ({
    seekToTimestamp: (timestamp: string) => {
      // ຖ້າຍັງບໍ່ໄດ້ເລີ່ມໂຫຼດ, ໃຫ້ເລີ່ມໂຫຼດກ່ອນ
      if (!isInitialized) {
        initializeWaveSurfer();
        // ບັນທຶກໄວ້ວ່າຕ້ອງ seek ຫຼັງຈາກໂຫຼດສຳເລັດ
        wavesurferRef.current?.once('ready', () => {
          performSeek(timestamp);
        });
        return;
      }

      if (!wavesurferRef.current) return;
      
      performSeek(timestamp);
    }
  }));

  // ຟັງຊັ່ນທີ່ແທ້ຈິງໃນການ seek
  const performSeek = (timestamp: string) => {
    if (!wavesurferRef.current) return;
    
    const [minutes, seconds] = timestamp.split(':').map(Number);
    const timeInSeconds = minutes * 60 + seconds;
    const duration = wavesurferRef.current.getDuration();
    
    if (duration > 0) {
      const seekPosition = timeInSeconds / duration; // ຄິດໄລ່ຕຳແໜ່ງເປັນສ່ວນ (0 ຫາ 1)
      wavesurferRef.current.seekTo(seekPosition);
      wavesurferRef.current.play(); // ເລີ່ມຫຼິ້ນຫຼັງຈາກ seek
      setIsPlaying(true);
    }
  };

  // ຟັງຊັ່ນສ້າງ WaveSurfer ແລະ ໂຫຼດໄຟລ໌ສຽງ
  const initializeWaveSurfer = () => {
    if (!waveformRef.current || isInitialized || isLoading) return;
    
    setIsLoading(true);
    
    // ລ້າງ instance ເກົ່າ (ຖ້າມີ)
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    // ສ້າງ instance ໃໝ່
    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#9ca3af', // ສີຂອງຄື້ນສຽງຕອນປົກກະຕິ
      progressColor: '#3b82f6', // ສີຂອງຄື້ນສຽງຕອນທີ່ຫຼິ້ນຜ່ານ
      url: audioUrl,
      barWidth: 2, // ຄວາມກວ້າງຂອງແຕ່ລະແຖບ
      barGap: 1, // ໄລຍະຫ່າງລະຫວ່າງແຖບ
      height: 64, // ຄວາມສູງຂອງ waveform (sm:h-16)
      cursorWidth: 1, // ເຊື່ອງ cursor ຂອງ wavesurfer
      interact: true, // ອະນຸຍາດໃຫ້ກົດທີ່ waveform ເພື່ອ seek
      plugins: [
        Hover.create({
          lineColor: '#4f46e5',
          lineWidth: 1,
          labelBackground: '#4f46e5',
          labelColor: '#ffffff',
          labelSize: '11px',
        }),
      ],
    });

    // ເຫດການເມື່ອສຽງພ້ອມຫຼິ້ນ
    wavesurferRef.current.on('ready', () => {
      console.log('WaveSurfer is ready');
      setIsLoading(false);
      setIsInitialized(true);
    });

    // ເຫດການເມື່ອການຫຼິ້ນສຽງຈົບ
    wavesurferRef.current.on('finish', () => {
      setIsPlaying(false);
    });

    // ເຫດການເມື່ອເລີ່ມຫຼິ້ນ
    wavesurferRef.current.on('play', () => {
      setIsPlaying(true);
    });

    // ເຫດການເມື່ອຢຸດຫຼິ້ນ
    wavesurferRef.current.on('pause', () => {
      setIsPlaying(false);
    });
    
    // ເຫດການເມື່ອມີ error
    wavesurferRef.current.on('error', (error) => {
      console.error('WaveSurfer error:', error);
      setIsLoading(false);
    });

    // ເຫດການເມື່ອມີ interaction (ເຊັ່ນ ການຄລິກ ຫຼື ລາກເທິງ waveform)
    wavesurferRef.current.on('interaction', () => {
      // ກວດເບິ່ງວ່າສຽງກຳລັງຢຸດຢູ່ບໍ່
      if (wavesurferRef.current && !wavesurferRef.current.isPlaying()) {
        // ຖ້າຢຸດຢູ່, ໃຫ້ສັ່ງຫຼິ້ນ
        wavesurferRef.current.play();
      }
    });
  };

  useEffect(() => {
    // ເມື່ອ component ຖືກ unmount
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, []);

  // ຟັງຊັ່ນຫຼິ້ນ/ຢຸດສຽງໂດຍໃຊ້ wavesurfer
  const toggleAudio = () => {
    // ຖ້າຍັງບໍ່ໄດ້ສ້າງ wavesurfer
    if (!isInitialized && !isLoading) {
      initializeWaveSurfer();
      wavesurferRef.current?.once('ready', () => {
        wavesurferRef.current?.play();
      });
      return;
    }
    
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  return (
    <div className="w-full max-w-lg mt-4 px-2 sm:px-0">
      <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
        <div className="text-sm text-gray-500 mb-2">ສຽງທີ່ບັນທຶກໄດ້</div>
        
        <div className="flex items-center">
          <Button 
            onClick={toggleAudio}
            variant="ghost"
            className="flex-shrink-0 p-1 size-[48px] md:size-[76px] rounded-sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
            ) : isPlaying ? (
              <FaPauseCircle className="size-6 text-gray-600" />
            ) : (
              <FaPlayCircle className="size-6 text-gray-600" />
            )}
          </Button>

          <div className="flex-1 sm:h-20 bg-gray-100 rounded-md flex items-center justify-center px-2 py-2">
            <div ref={waveformRef} className="sm:h-16 w-full relative">
              {!isInitialized && !isLoading && (
                <div className="absolute inset-0 w-full h-full bg-gray-300 rounded-md"></div>
              )}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center w-full h-full bg-gray-200/80 rounded-md">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Add display name for better debugging
AudioPlayer.displayName = 'AudioPlayer';

export default AudioPlayer; 