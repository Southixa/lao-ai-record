'use client';

import Navbar from '@/components/Navbar';
import Header from './Header';
import ArrowToButton from '../../../public/svg/arrow_to_button.svg';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { FaMicrophone } from 'react-icons/fa';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import { Id } from '../../../convex/_generated/dataModel';

export default function Homepage() {
  const router = useRouter();
  const { userId: clerkId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const createUser = useMutation(api.users.createUser);
  const createConversation = useMutation(api.conversations.createConversation);
  


  const handleCreateRecord = async () => {
    try {
      setIsLoading(true);
      
      // ດຶງ userId ຈາກ localStorage
      let userIdString = localStorage.getItem('userId');
      let userId: Id<"users"> | undefined;

      if(userIdString){
        // Parse the userId string as a Convex ID
        userId = userIdString as Id<"users">;
      }
      
      // ຖ້າບໍ່ມີ userId ໃນ localStorage, ສ້າງຜູ້ໃຊ້ໃໝ່
      if (!userIdString) {
        const result = await createUser({
          clerkId: clerkId || undefined,
          name: "Anonymous User",
          email: ""
        });
        
        userId = result.userId;
        
        // ບັນທຶກ userId ໃສ່ localStorage
        localStorage.setItem('userId', userId);
      }
      
      // ສ້າງການສົນທະນາໃໝ່
      const conversation = await createConversation({
        userId
      });
      
      // ນຳທາງໄປໜ້າ record ພ້ອມກັບ conversation id
      router.push(`/record/${conversation.conversationId}?startNow=yes`);
    } catch (error) {
      console.error("Error creating record:", error);
    } finally {
      setIsLoading(false);
    }
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
              
              <div className="absolute -right-14 -top-6 w-12 h-12 block opacity-50">
                <Image src={ArrowToButton} alt="Click to record" width={40} height={40} />
              </div>
              
              <Button
                onClick={() => {handleCreateRecord()}}
                size="lg"
                className="bg-red-500 hover:bg-red-600 rounded-full p-6 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FaMicrophone className="h-5 w-5 text-white" />
                  <span className="text-white font-medium">ເລີ່ມການບັນທຶກ</span>
                </div>
              </Button>
            </div>

            {/* ເວລາການບັນທຶກ */}
            <div className="text-7xl font-mono text-gray-300 tracking-wider mb-6">
            00:00
            </div>

          </div>

        </div>
      </main>
    </div>
  );
} 