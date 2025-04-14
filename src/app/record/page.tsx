'use client';

import { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaStop, FaPlayCircle, FaPauseCircle, FaFileAlt } from 'react-icons/fa';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Authenticated } from "convex/react";
import { PlusIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useMutation, useAction } from "convex/react";
import Navbar from "../../components/Navbar";
import { api } from '../../../convex/_generated/api';
import ArrowToButton from '../../../public/svg/arrow_to_button.svg';
import AudioPlayer from './AudioPlayer';

export default function RecordPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState("00:00");
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [recordButtonClicks, setRecordButtonClicks] = useState(0);
  
  // ສ້າງ states ໃໝ່ສຳລັບເກັບຂໍ້ມູນສຽງທີ່ອັດ
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [formattedTranscript, setFormattedTranscript] = useState<Array<{timecode: string; speaker: string; text: string}>>([]);
  
  // ສ້າງ refs ສຳລັບການອັດສຽງ
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // ໃຊ້ Convex action
  const transcribeAudio = useAction(api.transcribe.transcribeAudio);

  // ສ້າງຟັງຊັ່ນສຳລັບອັບເດດເວລາ
  const updateRecordingTime = () => {
    const now = Date.now();
    const diff = now - startTimeRef.current;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds % 60).padStart(2, '0');
    setRecordingTime(`${formattedMinutes}:${formattedSeconds}`);
  };

  // ຟັງຊັ່ນເລີ່ມການບັນທຶກສຽງ
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // ລ້າງຂໍ້ມູນເກົ່າ
      audioChunksRef.current = [];
      setAudioBlob(null);
      setAudioUrl(null);
      setTranscript("");
      setSummary("");
      setFormattedTranscript([]);
      
      // ສ້າງ MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // ຮັບເອົາຂໍ້ມູນສຽງເມື່ອມີ
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      // ເມື່ອການບັນທຶກສຽງສິ້ນສຸດ
      mediaRecorder.onstop = () => {
        // ສ້າງ Blob ຈາກຂໍ້ມູນສຽງ
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        
        // ສ້າງ URL ສຳລັບຫຼິ້ນສຽງ
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        
        // ຢຸດໂມງຈັບເວລາ
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        // ຢຸດ stream ທັງໝົດເພື່ອປິດການເຂົ້າເຖິງໄມໂຄຣໂຟນ
        stream.getTracks().forEach(track => track.stop());
      };
      
      // ເລີ່ມການບັນທຶກ
      mediaRecorder.start(100); // ເກັບຂໍ້ມູນທຸກໆ 100ms
      setIsRecording(true);
      
      // ເລີ່ມຈັບເວລາການບັນທຶກ
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(updateRecordingTime, 1000);
      
    } catch (error) {
      console.error('ບໍ່ສາມາດເຂົ້າເຖິງໄມໂຄຣໂຟນໄດ້:', error);
      alert('ບໍ່ສາມາດເຂົ້າເຖິງໄມໂຄຣໂຟນໄດ້. ກະລຸນາກວດສອບການອະນຸຍາດອຸປະກອນຂອງທ່ານ.');
    }
  };

  // ຟັງຊັ່ນຢຸດການບັນທຶກສຽງ
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // ຟັງຊັ່ນຫຼິ້ນ/ຢຸດສຽງ
  const toggleAudio = () => {
    if (audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause();
      } else {
        audioElementRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // ຟັງຊັ່ນສຳລັບຫຼິ້ນສຽງຈາກເວລາທີ່ກຳນົດ
  const playFromTimestamp = (timestamp: string) => {
    // ຊອກຫາ instance ຂອງ wavesurfer ຈາກ AudioPlayer component
    // ໝາຍເຫດ: ວິທີນີ້ບໍ່ແມ່ນວິທີທີ່ດີທີ່ສຸດ ແລະ ອາດຈະບໍ່ເຮັດວຽກຖືກຕ້ອງ
    // ວິທີທີ່ດີກວ່າແມ່ນການໃຊ້ forwardRef ຫຼື state management library
    const wavesurferInstance = (window as any).wavesurferInstance; 
    
    if (!wavesurferInstance) {
        console.error("Wavesurfer instance not found on window object");
        return;
    };
    
    // ແປງ timestamp ຈາກຮູບແບບ MM:SS ເປັນວິນາທີ
    const [minutes, seconds] = timestamp.split(':').map(Number);
    const timeInSeconds = minutes * 60 + seconds;
    const duration = wavesurferInstance.getDuration();

    if (duration > 0) {
      const seekPosition = timeInSeconds / duration; // ຄິດໄລ່ຕຳແໜ່ງເປັນສ່ວນ (0 ຫາ 1)
      wavesurferInstance.seekTo(seekPosition);
      wavesurferInstance.play(); // ເລີ່ມຫຼິ້ນຫຼັງຈາກ seek
    } else {
        console.warn("Audio duration not available yet.");
    }
  };

  // ຟັງຊັ່ນສົ່ງສຽງໄປຖອດຄວາມທີ່ backend
  const handleTranscribe = async () => {
    if (!audioBlob) return;

    try {
      setIsTranscribing(true);

      // Log ຂະໜາດຟາຍກ່ອນສົ່ງ
      const fileSizeInMB = (audioBlob.size / (1024 * 1024)).toFixed(2);
      console.log(`Audio file size: ${fileSizeInMB} MB`);

      // ແປລງ Blob ເປັນ Base64 string
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          const base64data = (reader.result as string).split(',')[1]; // ເອົາສະເພາະຂໍ້ມູນຫຼັງຈາກ base64,
          
          // ສົ່ງໄປຫາ Convex function
          const result = await transcribeAudio({
            audioData: base64data,
            language: "lo" // ຫຼື "en" ສຳລັບພາສາອັງກິດ
          });
          
          if (result.success) {
            // ກວດສອບກໍລະນີບໍ່ມີສຽງເວົ້າ
            if (result.transcript === "NO_SPEECH_DETECTED") {
              setTranscript("ບໍ່ພົບສຽງເວົ້າໃນການບັນທຶກ ກະລຸນາລອງອັດສຽງໃໝ່ອີກຄັ້ງ");
              setFormattedTranscript([{
                timecode: "",
                speaker: "",
                text: "ບໍ່ພົບສຽງເວົ້າໃນການບັນທຶກ ກະລຸນາລອງອັດສຽງໃໝ່ອີກຄັ້ງ"
              }]);
            } else {
              setTranscript(result.transcript);
              // ເພີ່ມການເກັບຮູບແບບ formatted transcript
              if (result.formattedTranscript) {
                setFormattedTranscript(result.formattedTranscript);
              }
            }
            setIsTranscribing(false);
          } else {
            console.error("Error from transcription:", result.error);
            alert("ເກີດຂໍ້ຜິດພາດໃນການຖອດຄວາມສຽງ");
            setIsTranscribing(false);
          }
        } catch (error) {
          console.error("Error during transcription:", error);
          alert("ເກີດຂໍ້ຜິດພາດໃນການຖອດຄວາມສຽງ");
          setIsTranscribing(false);
        }
      };
      
      reader.onerror = () => {
        console.error("FileReader error");
        setIsTranscribing(false);
        alert("ເກີດຂໍ້ຜິດພາດໃນການອ່ານໄຟລ໌ສຽງ");
      };
      
      // ເລີ່ມອ່ານໄຟລ໌ເປັນ Data URL
      reader.readAsDataURL(audioBlob);
      
    } catch (error) {
      console.error("Error transcribing audio:", error);
      setIsTranscribing(false);
      alert("ເກີດຂໍ້ຜິດພາດໃນການຖອດຄວາມສຽງ");
    }
  };

  // ຮອງຮັບການຢຸດຫຼິ້ນສຽງເມື່ອສຽງຈົບ
  useEffect(() => {
    const audioElement = audioElementRef.current;
    
    const handleEnded = () => {
      setIsPlaying(false);
    };
    
    if (audioElement) {
      audioElement.addEventListener('ended', handleEnded);
    }
    
    return () => {
      if (audioElement) {
        audioElement.removeEventListener('ended', handleEnded);
      }
    };
  }, [audioUrl]);

  // ຟັງຊັ່ນບັນທຶກສຽງຫຼືຢຸດບັນທຶກ
  const toggleRecording = () => {
    setRecordButtonClicks(prev => prev + 1);
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center bg-gray-100">
        <div className="max-w-4xl mx-auto p-4 my-10">
          {/* Audio Summary ພາກສ່ວນ Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-3">ສະຫຼຸບສຽງດ້ວຍ AI</h1>
            <p className="text-gray-500 max-w-2xl mx-auto mt-4">
            ອັດສຽງປະຊຸມ, ສົນທະນາກັບລູກຄ້າ, ລົມກັບໝູ່. ໃຊ້ AI ຖອດຂໍ້ຄວາມສຽງ, ສ້າງບົດສະຫຼຸບ ແລະ ຖາມຕອບດ້ວຍຄລິກດຽວ.
            </p>
          </div>

          {/* ພາກສ່ວນບັນທຶກສຽງ */}
          <div className="flex flex-col items-center justify-center mb-8">
            {/* ປຸ່ມບັນທຶກສຽງ */}
            <div className="mb-6 relative">
              {recordButtonClicks === 0 && (
                <div className="absolute -right-14 -top-6 w-12 h-12 block opacity-50">
                  <Image src={ArrowToButton} alt="Click to record" width={40} height={40} />
                </div>
              )}
              <Button
                onClick={toggleRecording}
                size="lg"
                className={`rounded-full p-6 cursor-pointer ${isRecording ? "bg-red-500 hover:bg-red-600" : "bg-red-500 hover:bg-red-600"}`}
              >
                <div className="flex items-center gap-2">
                  {isRecording ? (
                    <FaStop className="h-5 w-5 text-white" />
                  ) : (
                    <FaMicrophone className="h-5 w-5 text-white" />
                  )}
                  <span className="text-white font-medium">{isRecording ? "ຢຸດການບັນທຶກ" : "ເລີ່ມການບັນທຶກ"}</span>
                </div>
              </Button>
            </div>

            {/* ເວລາການບັນທຶກ */}
            <div className="text-7xl font-mono text-gray-300 tracking-wider mb-6">
              {recordingTime}
            </div>
            
            {/* ຟັງສຽງທີ່ອັດ */}
            {audioUrl && (
              <AudioPlayer 
                audioUrl={audioUrl}
                onTranscribe={handleTranscribe}
                isTranscribing={isTranscribing}
                playFromTimestamp={playFromTimestamp}
              />
            )}
          </div>

          {/* ຖ້າມີການບັນທຶກສຽງແລ້ວຈະສະແດງພາກສ່ວນ Transcript */}
          {(transcript || isTranscribing) && (
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
          )}
        </div>
      </main>
    </div>
  );
} 