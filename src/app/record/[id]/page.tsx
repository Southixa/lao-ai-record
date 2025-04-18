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
import { useChunkedAudioRecorder } from '@/hooks/useChunkedAudioRecorder';
import { stat } from 'fs';
import { StartRecordButton } from './StartRecordButton';
import { StopRecordButton } from './StopRecordButton';

export default function RecordPage() {


  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [openTranscript, setOpenTranscript] = useState<boolean>(false);

  const isStartErrorRef = useRef<boolean>(false);
  const currentAudioIdRef = useRef<Id<"audio"> | null>(null);
  const isStartByQueryFirsttimeRef = useRef<boolean>(false);
  const chunkIndexCountRef = useRef<number>(0);
  const chunkIndexSuccessCountRef = useRef<number>(0);

  const createAudioChunkWithTranscribe = useAction(api.audioChunks.createAudioChunkWithTranscribe);
  const createAudio = useMutation(api.audio.createAudio);
  const updateAudio = useMutation(api.audio.updateAudio);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const handleChunkAudio = async (blob: Blob, chunkIndex: number) => {
    if(isStartErrorRef.current) return;
    try {
      chunkIndexCountRef.current++;
      await handleUploadAudioChunk(blob, currentAudioIdRef.current as Id<"audio">, chunkIndex);
      chunkIndexSuccessCountRef.current++;
      if(chunkIndexCountRef.current === chunkIndexSuccessCountRef.current) {
        setOpenTranscript(true);
      }
    } catch (error) {
      console.log("Error uploading audio chunk:", error);
    }
  };

  const { status, recordingTime, start, stop, pause, resume, reset } = useChunkedAudioRecorder({
    onChunk: handleChunkAudio,
    timesliceSeconds: 60,
});

    useEffect(() => {
      const shouldStartNow = searchParams.get('startNow') === 'yes';
      
      if (shouldStartNow && status === 'idle' && !isStartByQueryFirsttimeRef.current) {
  
        // ລົບ query parameter ອອກຈາກ URL ໂດຍບໍ່ມີການ refresh
        const cleanUrl = `/record/${conversationId}`;
        router.replace(cleanUrl, { scroll: false });
        
        // ປ້ອງກັນໃຫ້ເຮັດວຽກແຕ່ຄັ້ງດຽວ
        isStartByQueryFirsttimeRef.current = true;
  
        startRecording();
      }
    }, [searchParams]);


  const handleUploadAudioChunk = async (blob: Blob, audioId: Id<"audio">, chunkIndex: number = 0) => {
      if(!blob){
        throw new Error("Blob is null");
      }
      if(!audioId){
        throw new Error("Audio ID is null");
      }
      try {
        const fileSizeInMB = (blob.size / (1024 * 1024)).toFixed(2);
        console.log(`Audio chunk ${chunkIndex} file size: ${fileSizeInMB} MB, chunkIndex: ${chunkIndex}`);


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
        storageId: audioStorageId as Id<"_storage">,
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
        throw error;
      }
  }


  const startRecording = async () => {
    try {
      isStartErrorRef.current = false;
      await start();
      if(currentAudioIdRef.current) return;
      const result = await createAudio({
        conversationId: conversationId as Id<"conversations">,
        processedStatus: "recording"
      });
      const audioId = result.audioId;
      console.log("Audio created, audioId:", audioId);
      currentAudioIdRef.current = audioId;
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
      toast.error('ຜິດພາດ', {
        description: 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ ກະລຸນາລອງໃຫມ່ອີກຄັ້ງພາຍຫຼັງ.',
        duration: 5000,
      });
      isStartErrorRef.current = true;
      reset();
    }
  }

  const stopRecording = () => {
   setOpenTranscript(false)
   stop(); 
  }
  

    


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
              
                {status === 'idle' && (
                    <StartRecordButton onClick={startRecording} />
                )}
                {(status === 'recording' || status === 'paused')  && (
                    <StopRecordButton onStop={stopRecording} onPause={pause} onResume={resume} />
                )}
              {status === 'stopped' && (
                  <DisableRecordButton />
              )}

            </div>

            {/* ເວລາການບັນທຶກ */}
            <div className="text-7xl font-mono text-gray-300 tracking-wider mb-6">
              {recordingTime}
            </div>

            {status === 'stopped' && !openTranscript && (
              <LoadingAnimationText />
            )}

          </div>

          
        </div>


        {status === 'stopped' && openTranscript && currentAudioIdRef.current && (
          <div className='max-w-[705px] w-full mx-auto p-4 my-10'>
              <TranscriptSection audioId={currentAudioIdRef.current} />
          </div>
        )}

        

      </main>
    </div>
  );
} 