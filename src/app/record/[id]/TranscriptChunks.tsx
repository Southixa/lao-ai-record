import React, { useRef } from 'react'
import Image from 'next/image';
import { Id } from '../../../../convex/_generated/dataModel';
import AudioPlayer from './AudioPlayer';

interface TranscriptChunk {
  _id: Id<"audioChunks">
  audioId: Id<"audio">
  chunkIndex: number
  startTime: number
  endTime: number
  duration: number
  filePath: string
  processedStatus: string
  storageId?: string
  formattedContent?: string
  createdAt: number
  updatedAt: number
  _creationTime?: number
}

interface TranscriptItem {
  timecode: string;
  speaker: string;
  text: string;
}

interface TranscriptChunksProps {
  chunk: TranscriptChunk
}

export const TranscriptChunks = ({ chunk }: TranscriptChunksProps) => {
  // Create a reference to track the current AudioPlayer's seek function
  const audioPlayerRef = useRef<{
    seekToTimestamp: (timestamp: string) => void
  } | null>(null);

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

  // Updated playFromTimestamp to use the audio player reference
  const playFromTimestamp = (timestamp: string) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.seekToTimestamp(timestamp);
    } else {
      console.log("AudioPlayer not ready yet");
    }
  };

  // This function will be called by the AudioPlayer to register its seek function
  const registerAudioPlayer = (seekFunction: (timestamp: string) => void) => {
    audioPlayerRef.current = {
      seekToTimestamp: seekFunction
    };
  };

  // Process chunk to get transcript content
  const transcriptItems: TranscriptItem[] = [];
  if (chunk.formattedContent) {
    try {
      const parsedContent = JSON.parse(chunk.formattedContent);
      if (Array.isArray(parsedContent)) {
        transcriptItems.push(...parsedContent);
      }
    } catch (error) {
      console.error("Error parsing chunk content:", error);
    }
  }

  if (transcriptItems.length === 0) {
    return <p className="whitespace-pre-line text-xs sm:text-sm">ບໍ່ພົບຂໍ້ຄວາມໃນສຽງ</p>;
  }

  return (
    <div>
      {/* Audio Player */}
      <AudioPlayer 
        audioUrl={chunk.filePath} 
        playFromTimestamp={playFromTimestamp}
        onReady={(seekFn) => registerAudioPlayer(seekFn)} 
      />
      
      {/* Transcript Items */}
      <div className="space-y-2 sm:space-y-4 mt-4">
        {transcriptItems.map((item, index) => (
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
                <div className="text-xs sm:text-sm p-2 rounded-lg inline-block bg-white shadow-sm">
                  {item.text}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
