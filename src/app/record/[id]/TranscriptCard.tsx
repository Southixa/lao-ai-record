import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TranscriptCardProps {
  isTranscribing: boolean;
  formattedTranscript: Array<{timecode: string; speaker: string; text: string}>;
  transcript: string;
  playFromTimestamp: (timestamp: string) => void;
}

const TranscriptCard: React.FC<TranscriptCardProps> = ({
  isTranscribing,
  formattedTranscript,
  transcript,
  playFromTimestamp
}) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      <Card className="overflow-hidden">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">ຖອດຄວາມສຽງ</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            ການຖອດຄວາມສຽງຂອງທ່ານ
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto">
            {isTranscribing ? (
              <div className="flex flex-col items-center justify-center p-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-3 sm:border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3 sm:mb-4"></div>
                <p className="text-xs sm:text-sm text-gray-500">ກຳລັງຖອດຄວາມສຽງ...</p>
              </div>
            ) : formattedTranscript.length > 0 ? (
              <div className="space-y-2 sm:space-y-4">
                {formattedTranscript.map((item, index) => (
                  <div key={index} className="border-b pb-1 sm:pb-2 last:border-0">
                    <div className="flex flex-col sm:flex-row sm:items-start">
                      <div className="flex items-center mb-1 sm:mb-0">
                        {item.timecode && (
                          <div 
                            className="text-xs sm:text-sm font-mono text-blue-500 mr-2 min-w-[40px] sm:min-w-[50px] cursor-pointer hover:underline"
                            onClick={() => playFromTimestamp(item.timecode)}
                          >
                            [{item.timecode}]
                          </div>
                        )}
                        {item.speaker && (
                          <div className="text-xs sm:text-sm font-semibold text-blue-600 mr-2">
                            {item.speaker}:
                          </div>
                        )}
                      </div>
                      <div className={`flex-1 text-xs sm:text-sm pl-1 sm:pl-0 ${!item.timecode && !item.speaker ? "text-center text-orange-500 font-medium" : ""}`}>
                        {item.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="whitespace-pre-line text-xs sm:text-sm">{transcript}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TranscriptCard; 