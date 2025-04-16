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

export default function RecordPage() {

  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = params.id as string;

  
  const [isRecording, setIsRecording] = useState(false);
  const [currentAudioId, setCurrentAudioId] = useState<Id<"audio"> | null>(null);
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  const [recordingTime, setRecordingTime] = useState("00:00");



  const mediaRecorderRef = useRef<MediaRecorder>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const chunkIndexRef = useRef<number>(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);


  // ໃຊ້ Convex action ແລະ mutation
  const createAudioChunkWithTranscribe = useAction(api.audioChunks.createAudioChunkWithTranscribe);
  const createAudio = useMutation(api.audio.createAudio);
  const updateAudio = useMutation(api.audio.updateAudio);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);



  // ຟັງຊັ່ນເລີ່ມການບັນທຶກສຽງ
  const startRecording = async () => {
    console.log("start recording");

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
      }, 10000);

      // ເລີ່ມຈັບເວລາການບັນທຶກ
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(updateRecordingTime, 1000);

    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    console.log("stop recording");
    if (mediaRecorderRef.current && isRecording && timerRef.current && recordingIntervalRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // ຢຸດຈັບເວລາການບັນທຶກ
      clearInterval(timerRef.current);
      clearInterval(recordingIntervalRef.current);
      
      // ຢຸດ stream
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
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

        await handleUploadAudioChunk(audioBlob, audioId, chunkIndexRef.current);

        chunkIndexRef.current++;
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
      
      <main className="flex-1 flex flex-col items-center justify-center bg-gray-100">
        <div className="max-w-4xl mx-auto p-4 my-10">
          <Header />

          {/* ພາກສ່ວນບັນທຶກສຽງ */}
          <div className="flex flex-col items-center justify-center mb-8">
            {/* ປຸ່ມບັນທຶກສຽງ */}
            <div className="mb-6 relative">
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
      </main>
    </div>
  );
} 