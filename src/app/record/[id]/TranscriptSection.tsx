'use client';

import React, { useEffect, useState } from 'react';
import { Id } from '../../../../convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { TranscriptChunks } from './TranscriptChunks';

interface TranscriptSectionProps {
  audioId: Id<"audio">
}

export const TranscriptSection = ({ audioId }: TranscriptSectionProps) => {
  const [isLoading, setIsLoading] = useState(true);
  
  // Use useQuery directly for audioChunks
  const audioChunks = useQuery(api.audioChunks.getAudioChunksByAudioId, { audioId }) || [];
  const getAudioWithTranscript = useMutation(api.audio.getAudioWithCombinedTranscript);
  
  // Set loading to false when audioChunks are available
  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        await getAudioWithTranscript({ audioId });
        
        // If we got here, we're done loading
        if (audioChunks.length > 0 || !isLoading) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching transcript:", error);
        setIsLoading(false);
      }
    };

    if (audioId) {
      fetchTranscript();
    }
  }, [audioId, getAudioWithTranscript, audioChunks.length]);

  // Use separate effect to set loading state based on audioChunks
  useEffect(() => {
    if (audioChunks.length > 0) {
      setIsLoading(false);
    }
  }, [audioChunks]);

  return (
    <div className='min-h-[400px] border-t border-b border-gray-300/60 py-4'>
      <div>
        <div className="text-lg sm:text-xl font-semibold">ຖອດຄວາມສຽງ</div>
        <div className="text-xs sm:text-sm text-gray-500 mb-4">
          ການຖອດຄວາມສຽງຂອງທ່ານ
        </div>
        <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-4">
              <div className="w-4 h-4 sm:w-4 sm:h-4 border-2 sm:border-2 border-gray-500 border-t-transparent rounded-full animate-spin mb-3 sm:mb-4"></div>
              <p className="text-xs sm:text-sm text-gray-500">ກຳລັງໂຫຼດການຖອດຄວາມສຽງ...</p>
            </div>
          ) : (
            audioChunks.length > 0 ? (
              <div className="space-y-6">
                {audioChunks.map((chunk) => (
                  <TranscriptChunks key={chunk._id} chunk={chunk} />
                ))}
              </div>
            ) : (
              <p className="whitespace-pre-line text-xs sm:text-sm">ບໍ່ພົບຂໍ້ຄວາມໃນສຽງ</p>
            )
          )}
        </div>
      </div>
    </div>
  );
}
