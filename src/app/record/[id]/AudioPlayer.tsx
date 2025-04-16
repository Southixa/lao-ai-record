'use client';

import { useState, useRef, useEffect } from 'react';
import { FaPlayCircle, FaPauseCircle, FaFileAlt } from 'react-icons/fa';
import { Button } from "@/components/ui/button";
import WaveSurfer from 'wavesurfer.js';
import Hover from 'wavesurfer.js/dist/plugins/hover.esm.js';

interface AudioPlayerProps {
  audioUrl: string;
  onTranscribe: () => void;
  isTranscribing: boolean;
  playFromTimestamp: (timestamp: string) => void;
}

export default function AudioPlayer({ 
  audioUrl, 
  onTranscribe, 
  isTranscribing,
  playFromTimestamp // ຟັງຊັ່ນນີ້ບໍ່ໄດ້ໃຊ້ກັບ wavesurfer.js ໂດຍກົງ
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (waveformRef.current) {
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
      });

      // ເຫດການເມື່ອມີ interaction (ເຊັ່ນ ການຄລິກ ຫຼື ລາກເທິງ waveform)
      wavesurferRef.current.on('interaction', () => {
        // ກວດເບິ່ງວ່າສຽງກຳລັງຢຸດຢູ່ບໍ່
        if (wavesurferRef.current && !wavesurferRef.current.isPlaying()) {
          // ຖ້າຢຸດຢູ່, ໃຫ້ສັ່ງຫຼິ້ນ
          wavesurferRef.current.play();
        }
      });

      // ເກັບ instance ໄວ້ໃນ window object (ວິທີແກ້ໄຂຊົ່ວຄາວ)
      (window as any).wavesurferInstance = wavesurferRef.current;

      // Cleanup function ເມື່ອ component unmount
      return () => {
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
        }
        // ລຶບ instance ອອກຈາກ window object
        delete (window as any).wavesurferInstance;
      };
    }
  }, [audioUrl]); // Re-run effect when audioUrl changes

  // ຟັງຊັ່ນຫຼິ້ນ/ຢຸດສຽງໂດຍໃຊ້ wavesurfer
  const toggleAudio = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  // ຟັງຊັ່ນ seek ໄປຫາເວລາທີ່ກຳນົດໃນ waveform
  const seekToTimestamp = (timestamp: string) => {
    if (!wavesurferRef.current) return;
    
    const [minutes, seconds] = timestamp.split(':').map(Number);
    const timeInSeconds = minutes * 60 + seconds;
    const duration = wavesurferRef.current.getDuration();
    
    if (duration > 0) {
      const seekPosition = timeInSeconds / duration; // ຄິດໄລ່ຕຳແໜ່ງເປັນສ່ວນ (0 ຫາ 1)
      wavesurferRef.current.seekTo(seekPosition);
      wavesurferRef.current.play(); // ເລີ່ມຫຼິ້ນຫຼັງຈາກ seek
    }
  };

  // ສົ່ງຟັງຊັ່ນ seek ໃໝ່ໃຫ້ກັບ Parent Component
  // ໝາຍເຫດ: ວິທີນີ້ອາດຈະບໍ່ແມ່ນວິທີທີ່ດີທີ່ສຸດ, ຄວນພິຈາລະນາ refactor ຖ້າໂຄງສ້າງซับซ้อน
  useEffect(() => {
    // ແຈ້ງໃຫ້ parent component ຮູ້ກ່ຽວກັບຟັງຊັ່ນ seek ໃໝ່ (ທາງອ້ອມຜ່ານ prop)
    // ໃນ page.tsx, ຕ້ອງປັບປຸງ playFromTimestamp ໃຫ້ເອີ້ນໃຊ້ຟັງຊັ່ນນີ້
    // ຕົວຢ່າງ: const playFromTimestamp = (ts) => wavesurferRefFromPlayer?.current?.seekToTimestamp(ts);
    // ຖ້າຕ້ອງການໃຫ້ parent component ເອີ້ນໃຊ້ໂດຍກົງ, ຕ້ອງໃຊ້ forwardRef
  }, []); // Run once

  return (
    <div className="w-full max-w-lg mt-4 px-2 sm:px-0">
      <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
        <div className="text-sm text-gray-500 mb-2">ສຽງທີ່ບັນທຶກໄດ້</div>
        
        <div className="flex items-center">
          <Button 
            onClick={toggleAudio}
            variant="ghost"
            className="flex-shrink-0 p-1 size-[48px] md:size-[76px] rounded-sm"
          >
            {isPlaying ? (
              <FaPauseCircle className="size-6 text-gray-600" />
            ) : (
              <FaPlayCircle className="size-6 text-gray-600" />
            )}
          </Button>

          <div className="flex-1 sm:h-20 bg-gray-100 rounded-md flex items-center justify-center px-2 py-2">
            <div ref={waveformRef} className=" sm:h-16 w-full"></div>
          </div>
        </div>
        
        <div className="mt-3 sm:mt-4 flex justify-center">
          <Button
            onClick={onTranscribe}
            disabled={isTranscribing}
            className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base"
          >
            <div className="flex items-center gap-2 justify-center">
              <FaFileAlt className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>
                {isTranscribing ? "ກຳລັງຖອດຄວາມສຽງ..." : "ຖອດຄວາມສຽງ"}
              </span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
} 