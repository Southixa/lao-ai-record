'use client';

import { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaStop } from 'react-icons/fa';
import { Button } from "@/components/ui/button";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useMutation, useAction } from "convex/react";
import { Id } from "../../../../convex/_generated/dataModel";
import Navbar from "../../../components/Navbar";
import { api } from '../../../../convex/_generated/api';
import ArrowToButton from '../../../../public/svg/arrow_to_button.svg';
import Header from './Header';
import Image from "next/image";
import { blobToBase64 } from '../../../helpers';
import { uploadFileToStorage } from '../../../api/storage';
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DisableRecordButton } from './DisableRecordButton';
import { LoadingAnimationText } from './LoadingAnimationText';
import { TranscriptSection } from './TranscriptSection';

export default function RecordPage() {


  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = params.id as string;

  
  const [isRecording, setIsRecording] = useState(false);
  const [currentAudioId, setCurrentAudioId] = useState<Id<"audio"> | null>(null);
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  const [recordingTime, setRecordingTime] = useState("00:00");
  const [openTranscript, setOpenTranscript] = useState(false);



  const mediaRecorderRef = useRef<MediaRecorder>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const chunkIndexRef = useRef<number>(0);
  const chunkIndexRefSuccessCount = useRef<number>(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLastChunkRef = useRef<boolean>(false);

  const isStartByQueryFirsttimeRef = useRef<boolean>(false);


  // ໃຊ້ Convex action ແລະ mutation
  const createAudioChunkWithTranscribe = useAction(api.audioChunks.createAudioChunkWithTranscribe);
  const createAudio = useMutation(api.audio.createAudio);
  const updateAudio = useMutation(api.audio.updateAudio);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  // ກວດສອບເມື່ອ component unmount ເພື່ອຢຸດການບັນທຶກຖ້າຍັງບັນທຶກຢູ່
  useEffect(() => {
    return () => {
      console.log("is recording?", isRecording);
      if (mediaRecorderRef.current) {
        console.log("Component unmounting while recording - stopping recording");
        stopRecordingOnUnmount();
      }
    };
  }, []);

    // ເລີ່ມການບັນທຶກໂດຍອັດຕະໂນມັດ ຖ້າມີ query parameter startNow=yes
    useEffect(() => {
      const shouldStartNow = searchParams.get('startNow') === 'yes';
      
      if (shouldStartNow && !isRecording && !isStartByQueryFirsttimeRef.current) {
  
        // ລົບ query parameter ອອກຈາກ URL ໂດຍບໍ່ມີການ refresh
        const cleanUrl = `/record/${conversationId}`;
        router.replace(cleanUrl, { scroll: false });
        
        // ປ້ອງກັນໃຫ້ເຮັດວຽກແຕ່ຄັ້ງດຽວ
        isStartByQueryFirsttimeRef.current = true;
  
        startRecording();
      }
    }, [searchParams]);



  // ຟັງຊັ່ນເລີ່ມການບັນທຶກສຽງ
  const startRecording = async () => {
    console.log("start recording");

    // Prevent starting multiple recordings
    if (isRecording || mediaRecorderRef.current) {
      console.log("Recording already in progress, ignoring startRecording call");
      return;
    }

    // Reset all recording related state to ensure clean start
    isLastChunkRef.current = false;
    chunkIndexRef.current = 0;
    chunkIndexRefSuccessCount.current = 0;
    
    // Clear any existing timers/intervals as precaution
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

       // ສ້າງບັນທຶກສຽງໃໝ່ໃນຖານຂໍ້ມູນກ່ອນເລີ່ມການບັນທຶກສຽງ
       const result = await createAudio({
        conversationId: conversationId as Id<"conversations">,
        processedStatus: "recording"
      });

      const audioId = result.audioId;
      console.log("Audio created, audioId:", audioId);
      setCurrentAudioId(audioId);

      await recordAndSend(stream, audioId);

      recordingIntervalRef.current = setInterval( async () => {
        if(mediaRecorderRef.current) {
          mediaRecorderRef.current.stop();
          await recordAndSend(stream, audioId);
        }
      }, 60000);

      // ເລີ່ມຈັບເວລາການບັນທຶກ
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(updateRecordingTime, 1000);

    } catch (error) {
      if (String(error).includes("NotAllowedError")) {
        toast.error('ບໍ່ສາມາດເຂົ້າເຖິງໄມໂຄຣໂຟນໄດ້', {
          position: 'top-center',
          description: 'ກະລຸນາກວດສອບການອະນຸຍາດອຸປະກອນຂອງທ່ານ.',
          duration: 5000,
        });
        return;
      }
      console.log("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    console.log("stop recording");
    if (mediaRecorderRef.current && isRecording && timerRef.current && recordingIntervalRef.current) {
      isLastChunkRef.current = true;

      // ຢຸດຈັບເວລາການບັນທຶກ - ແຍກເພື່ອປ້ອງກັນບໍ່ໃຫ້ເກີດ null errors
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      
      // ຢຸດ stream
          // ຢຸດການບັນທຶກສຽງ
    if (mediaRecorderRef.current) {
      console.log("Stopping media recorder");
      mediaRecorderRef.current.stop();
      
      // ຢຸດ stream
      if (mediaRecorderRef.current.stream) {
        console.log("Stopping media tracks");
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }

    setIsRecording(false);
    }
  }

  const stopRecordingOnUnmount = () => {
    console.log("stop recording on unmount");
    if (mediaRecorderRef.current && timerRef.current && recordingIntervalRef.current) {
      isLastChunkRef.current = true;

      // ຢຸດຈັບເວລາການບັນທຶກ - ແຍກເພື່ອປ້ອງກັນບໍ່ໃຫ້ເກີດ null errors
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      
      // ຢຸດ stream
          // ຢຸດການບັນທຶກສຽງ
    if (mediaRecorderRef.current) {
      console.log("Stopping media recorder");
      mediaRecorderRef.current.stop();
      
      // ຢຸດ stream
      if (mediaRecorderRef.current.stream) {
        console.log("Stopping media tracks");
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }

    }
  }

  const handleUploadAudioChunk = async (blob: Blob, audioId: Id<"audio">, chunkIndex: number = 0) => {
      if(!blob){
        throw new Error("Blob is null");
      }
      if(!audioId){
        throw new Error("Audio ID is null");
      }
      try {
        const fileSizeInMB = (blob.size / (1024 * 1024)).toFixed(2);
        console.log(`Audio chunk ${chunkIndex} file size: ${fileSizeInMB} MB`);


        // 1. Get upload URL
        const uploadUrl = await generateUploadUrl();
        
        // 2. Upload the file
        const audioStorageId = await uploadFileToStorage(blob, uploadUrl);

        // ແປງ Blob ເປັນ Base64 string ໂດຍໃຊ້ helper function
        const base64data = await blobToBase64(blob);

              // 3. Create audio chunk with transcription
      const now = Date.now();
      const result = await createAudioChunkWithTranscribe({
        // audioChunk ພາລາມິເຕີ
        audioId: audioId,
        chunkIndex: chunkIndex,
        startTime: 0,
        endTime: blob.size,
        duration: 60,
        filePath: `conversation/${conversationId}/audio/${audioId}/chunk-${chunkIndex}`,
        storageId: audioStorageId,
        processedStatus: "pending",
        
        // transcribeAudio ພາລາມິເຕີ
        audioData: base64data,
        language: "lo" // ຫຼື "en" ສຳລັບພາສາອັງກິດ
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      console.log("Result ຈາກ audioChunks.ts:", JSON.stringify(result, null, 2));


      } catch (error) {
        console.error("Error uploading audio chunk:", error);
        throw error;
      }
  }

  const recordAndSend = async (stream: MediaStream, audioId: Id<"audio">) => {
    try {

      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      setIsRecording(true);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        console.log("chunkIndexRef.current:", chunkIndexRef.current);

        chunkIndexRef.current++;

        await handleUploadAudioChunk(audioBlob, audioId, chunkIndexRef.current);

        chunkIndexRefSuccessCount.current++;

        // ສຳລັບ check ວ່າສາມາດເປີດ transcript ໄດ້ແລ້ວບໍ່
        if(isLastChunkRef.current && (chunkIndexRefSuccessCount.current === chunkIndexRef.current)){
          setOpenTranscript(true);
        }
      };

      mediaRecorder.start();
    } catch (error) {
      setIsRecording(false);
      console.error("Error starting recording:", error);
    }
  }

  // ຟັງຊັ່ນບັນທຶກສຽງຫຼືຢຸດບັນທຶກ
  const toggleRecording = () => {
    if (isRecording) {
      // ສະແດງ dialog ຢືນຢັນການຢຸດບັນທຶກ
      setShowStopConfirmation(true);
    } else {
      startRecording();
    }
  };

    // ສ້າງຟັງຊັນໃໝ່ທີ່ຮັບ parameters ໂດຍກົງ
    const updateRecordingTime = () => {
      const now = Date.now();
      const diff = now - startTimeRef.current;
      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      const formattedHours = String(hours).padStart(2, '0');
      const formattedMinutes = String(minutes).padStart(2, '0');
      const formattedSeconds = String(seconds).padStart(2, '0');
      
      // ຖ້າເກີນ 1 ຊົ່ວໂມງ ໃຫ້ສະແດງ ຊົ່ວໂມງ:ນາທີ:ວິນາທີ
      if (hours > 0) {
        setRecordingTime(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
        return;
      }
      
      // ກໍລະນີປົກກະຕິ (ບໍ່ເກີນ 1 ຊົ່ວໂມງ)
      setRecordingTime(`${formattedMinutes}:${formattedSeconds}`);
    };
  

    


  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center pt-24 bg-gray-100">
        <div className="max-w-4xl mx-auto p-4 mt-10">
          <Header />

          {/* ພາກສ່ວນບັນທຶກສຽງ */}
          <div className="flex flex-col items-center justify-center">
            {/* ປຸ່ມບັນທຶກສຽງ */}
            <div className="mb-6 relative">
              {!isLastChunkRef.current && (
                  <Button
                  onClick={toggleRecording}
                  size="lg"
                  className={`rounded-full p-6 cursor-pointer border-1 border-red-500 ${isRecording ? "bg-red-500 hover:bg-red-600" : "bg-red-500 hover:bg-red-600"}`}
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
              )}
              {isLastChunkRef.current && (
                  <DisableRecordButton />
              )}
            </div>

            {/* ເວລາການບັນທຶກ */}
            <div className="text-7xl font-mono text-gray-300 tracking-wider mb-6">
              {recordingTime}
            </div>

            {isLastChunkRef.current && !openTranscript && (
              <LoadingAnimationText />
            )}

          </div>

          {/* Dialog ຢືນຢັນການຢຸດບັນທຶກ */}
          <AlertDialog open={showStopConfirmation} onOpenChange={setShowStopConfirmation}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>ຢືນຢັນການຢຸດການບັນທຶກ</AlertDialogTitle>
                <AlertDialogDescription>
                  ທ່ານແນ່ໃຈບໍວ່າຕ້ອງການຢຸດການບັນທຶກສຽງບໍ່? 
                  ຫຼັງຈາກຢຸດແລ້ວຂໍ້ມູນຈະຖືກສົ່ງໄປປະມວນຜົນ.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>ຍົກເລີກ</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={stopRecording}
                  className="bg-red-500 hover:bg-red-600"
                >
                  ຢຸດການບັນທຶກ
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>


        {currentAudioId && openTranscript && (
          <div className='max-w-[705px] w-full mx-auto p-4 my-10'>
              <TranscriptSection audioId={currentAudioId} />
          </div>
        )}

        

      </main>
    </div>
  );
} 