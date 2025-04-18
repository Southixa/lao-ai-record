'use client';

import React, { useEffect, useState } from 'react';
import { Id } from '../../../../convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from 'next/image';

interface TranscriptSectionProps {
  audioId: Id<"audio">
}

interface TranscriptItem {
  timecode: string;
  speaker: string;
  text: string;
}

export const TranscriptSection = ({ audioId }: TranscriptSectionProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [formattedTranscript, setFormattedTranscript] = useState<TranscriptItem[]>([]);
  
  const getAudioWithTranscript = useMutation(api.audio.getAudioWithCombinedTranscript);
  
  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        setIsLoading(true);
        const audio = await getAudioWithTranscript({ audioId });
        
        if (audio && audio.combinedTranscript) {
          const parsedTranscript = JSON.parse(audio.combinedTranscript);
          setFormattedTranscript(parsedTranscript);
          // Also set raw transcript as fallback
          setTranscript(audio.combinedTranscript);
        }
      } catch (error) {
        console.error("Error fetching transcript:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (audioId) {
      fetchTranscript();
    }
  }, [audioId, getAudioWithTranscript]);

  const playFromTimestamp = (timestamp: string) => {
    // For future implementation - could seek audio to this timestamp
    console.log(`Playing from timestamp: ${timestamp}`);
  };

  // Parse speaker string to determine gender (e.g., "Speaker A(m)" -> male)
  const getSpeakerGender = (speaker: string): 'male' | 'female' => {
    if (speaker.toLowerCase().includes('(f)')) return 'female';
    return 'male'; // Default to male if not specified or unclear
  };

  // Extract speaker letter (e.g., "Speaker A(m)" -> "A")
  const getSpeakerLetter = (speaker: string): string => {
    const match = speaker.match(/Speaker\s+([A-Z])/i);
    return match ? match[1] : '';
  };

  return (
    <div className='min-h-[400px] border-t border-b border-gray-300/60 py-4'>
      <div>
        <div className="text-lg sm:text-xl font-semibold">ຖອດຄວາມສຽງ</div>
        <div className="text-xs sm:text-sm text-gray-500 mb-4">
          ການຖອດຄວາມສຽງຂອງທ່ານ
        </div>
        <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-4">
              <div className="w-4 h-4 sm:w-4 sm:h-4 border-2 sm:border-2 border-gray-500 border-t-transparent rounded-full animate-spin mb-3 sm:mb-4"></div>
              <p className="text-xs sm:text-sm text-gray-500">ກຳລັງໂຫຼດການຖອດຄວາມສຽງ...</p>
            </div>
          )}
          
          {!isLoading && formattedTranscript.length > 0 && (
            <div className="space-y-2 sm:space-y-4">
              {formattedTranscript.map((item, index) => (
                <div key={index} className="pb-1 sm:pb-2">
                  <div className="flex flex-row gap-2">
                    {/* Timestamp */}
                    {item.timecode && (
                      <div 
                        className="text-xs sm:text-sm font-mono text-blue-500 cursor-pointer hover:underline shrink-0 mt-[12px]"
                        onClick={() => playFromTimestamp(item.timecode)}
                      >
                        [{item.timecode}]
                      </div>
                    )}
                    
                    {/* Speaker Icon */}
                    {item.speaker && (
                      <div className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center shrink-0 mt-[8px]`}
                      >
                        <Image 
                          src={getSpeakerGender(item.speaker) === 'male' 
                            ? '/svg/male_profile.svg' 
                            : '/svg/female_profile.svg'} 
                          alt={getSpeakerGender(item.speaker)} 
                          width={20} 
                          height={20}
                          className="opacity-80"
                        />
                      </div>
                    )}
                    
                    {/* Transcript Text */}
                    <div className="mt-[3px] w-full pr-4 md:pr-8">
                      <div className="text-xs sm:text-sm p-2 rounded-lg   inline-block">
                        {item.text}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!isLoading && formattedTranscript.length === 0 && (
            <p className="whitespace-pre-line text-xs sm:text-sm">ບໍ່ພົບຂໍ້ຄວາມໃນສຽງ</p>
          )}
        </div>
      </div>
    </div>
  );
}
