import { Button } from '@/components/ui/button'
import React from 'react'
import { FaMicrophone } from 'react-icons/fa'

export const DisableRecordButton = () => {
  return (
    <Button
    size="lg"
    className={`rounded-full p-6 bg-gray-200 hover:bg-gray-200 border-1 border-gray-300`}
  >
    <div className="flex items-center gap-2">
        <FaMicrophone className="h-5 w-5 text-gray-400" />
      <span className="text-gray-400 font-medium">ເລີ່ມການບັນທຶກ</span>
    </div>
  </Button>
  )
}