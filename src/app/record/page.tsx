'use client';

import { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaStop, FaPlayCircle, FaPauseCircle } from 'react-icons/fa';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Authenticated } from "convex/react";
import { PlusIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import Navbar from "../../components/Navbar";

export default function RecordPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState("00:00");
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  
  // ສ້າງ states ໃໝ່ສຳລັບເກັບຂໍ້ມູນສຽງທີ່ອັດ
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // ສ້າງ refs ສຳລັບການອັດສຽງແລະຫຼິ້ນສຽງ
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

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
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-gray-100">
        <div className="max-w-4xl mx-auto p-6 my-10">
          {/* Audio Summary ພາກສ່ວນ Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-3">ສະຫຼຸບສຽງດ້ວຍ AI</h1>
            <p className="text-gray-500 max-w-2xl mx-auto">
              ໃຊ້ AI ຖອດຄວາມສຽງແລະສ້າງບົດສະຫຼຸບດ້ວຍການຄລິກດຽວ. ນີ້ແມ່ນເຄື່ອງມືອອນໄລນ໌ທີ່ສາມາດຖອດຄວາມ
              ແລະສະຫຼຸບເນື້ອຫາສຽງໄດ້.
            </p>
          </div>

          {/* ພາກສ່ວນບັນທຶກສຽງ */}
          <div className="flex flex-col items-center justify-center mb-8">
            {/* ປຸ່ມບັນທຶກສຽງ */}
            <div className="mb-6">
              <Button
                onClick={toggleRecording}
                size="lg"
                className={`rounded-full p-6 ${isRecording ? "bg-red-500 hover:bg-red-600" : "bg-red-500 hover:bg-red-600"}`}
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
              <div className="w-full max-w-lg mt-4">
                <div className="flex items-center justify-center mb-4">
                  <Button 
                    onClick={toggleAudio}
                    variant="outline"
                    className="flex items-center gap-2 bg-white"
                  >
                    {isPlaying ? (
                      <>
                        <FaPauseCircle className="h-5 w-5" />
                        <span>ຢຸດຟັງ</span>
                      </>
                    ) : (
                      <>
                        <FaPlayCircle className="h-5 w-5" />
                        <span>ຟັງສຽງທີ່ອັດໄດ້</span>
                      </>
                    )}
                  </Button>
                </div>
                
                <audio ref={audioElementRef} src={audioUrl} className="hidden" />
                
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-500 mb-2">ສຽງທີ່ບັນທຶກໄດ້</div>
                  <div className="h-24 bg-gray-100 rounded-md flex items-center justify-center">
                    <div className="w-full px-4">
                      <div className="h-16 w-full bg-gray-200 rounded-md overflow-hidden relative">
                        {/* Audio waveform display */}
                        <div className="h-full flex items-center justify-center">
                          {Array.from({ length: 50 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-1 mx-[1px] ${isPlaying ? 'animate-pulse' : ''}`}
                              style={{
                                height: `${15 + Math.random() * 50}%`,
                                backgroundColor: isPlaying ? '#3b82f6' : '#9ca3af'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ຖ້າມີການບັນທຶກສຽງແລ້ວຈະສະແດງພາກສ່ວນ Transcript ແລະ Summary */}
          {transcript && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>ຖອດຄວາມສຽງ</CardTitle>
                  <CardDescription>
                    ການຖອດຄວາມສຽງຂອງທ່ານ
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[400px] overflow-y-auto">
                    <p className="whitespace-pre-line">{transcript}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>ບົດສະຫຼຸບ</CardTitle>
                  <CardDescription>
                    ບົດສະຫຼຸບຂອງການບັນທຶກສຽງ
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[400px] overflow-y-auto">
                    <p className="whitespace-pre-line">{summary}</p>
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