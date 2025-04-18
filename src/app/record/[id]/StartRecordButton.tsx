import { Button } from '@/components/ui/button'
import React from 'react'
import { FaMicrophone } from 'react-icons/fa'

interface StartRecordButtonProps {
    onClick: () => void
}

export const StartRecordButton = ({ onClick = () => {} }: StartRecordButtonProps) => {
  return (
    <Button
        onClick={onClick}
        size="lg"
        className={`rounded-full p-6 cursor-pointer border-1 border-red-500 bg-red-500 hover:bg-red-600 min-w-[160px]`}
    >
        <div className="flex items-center gap-2">
        <FaMicrophone className="h-5 w-5 text-white" />
        <span className="text-white font-medium">ເລີ່ມການບັນທຶກ</span>
        </div>
    </Button>
  )
}
