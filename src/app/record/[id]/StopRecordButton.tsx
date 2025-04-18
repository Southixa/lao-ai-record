import { Button } from '@/components/ui/button'
import React, { useState } from 'react'
import { FaStop, FaPause, FaPlay } from 'react-icons/fa'
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

interface StopRecordButtonProps {
    onStop: () => void;
    onPause: () => void;
    onResume: () => void;
}

export const StopRecordButton = ({ onStop = () => {}, onPause = () => {}, onResume = () => {} }: StopRecordButtonProps) => {

    const [showStopConfirmation, setShowStopConfirmation] = useState(false);
    const [isPause, setIsPause] = useState(false);

  return (
    <>
    <div className='flex gap-2'>
        {!isPause && (
            <Button
                onClick={() => {setIsPause(true); onPause()}}
                size="lg"
                className={`rounded-full p-6 cursor-pointer border-1 border-gray-400/20 bg-gray-200 hover:bg-gray-300 min-w-[160px]`}
            >
                <div className="flex items-center gap-2">
                <FaPause className="h-5 w-5 text-gray-600" />
                <span className="text-gray-700 font-medium">ຢຸດຊົ່ວຄາວ</span>
                </div>
            </Button>
        )}
        {isPause && (
            <Button
                onClick={() => {setIsPause(false); onResume()}}
                size="lg"
                className={`rounded-full p-6 cursor-pointer border-1 border-gray-400/20 bg-gray-200 hover:bg-gray-300 min-w-[160px]`}
            >
                <div className="flex items-center gap-2">
                <FaPlay className="h-5 w-5 text-gray-600" />
                <span className="text-gray-700 font-medium">ຢຸດຊົ່ວຄາວ</span>
                </div>
            </Button>
        )}
        <Button
            onClick={() => {setShowStopConfirmation(true)}}
            size="lg"
            className={`rounded-full p-6 cursor-pointer border-1 border-red-500 bg-red-500 hover:bg-red-600 min-w-[160px]`}
        >
            <div className="flex items-center gap-2">
            <FaStop className="h-5 w-5 text-white" />
            <span className="text-white font-medium">ຢຸດການບັນທຶກ</span>
            </div>
        </Button>
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
           onClick={() => {onStop()}}
           className="bg-red-500 hover:bg-red-600"
         >
           ຢຸດການບັນທຶກ
         </AlertDialogAction>
       </AlertDialogFooter>
     </AlertDialogContent>
   </AlertDialog>
    </>
  )
}
