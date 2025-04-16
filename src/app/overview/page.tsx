'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import Link from 'next/link';
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Id } from '../../../convex/_generated/dataModel';

export default function overview() {
  // ດຶງຂໍ້ມູນ todos ຈາກ Convex (ນີ້ເປັນເພຽງຕົວຢ່າງສະແດງການໃຊ້ Convex)
  const todos = useQuery(api.todos.getTodos);
  const router = useRouter();
  const { userId: clerkId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const createUser = useMutation(api.users.createUser);
  const createConversation = useMutation(api.conversations.createConversation);
  
  const todosCount = todos?.length || 0;

  const handleCreateRecord = async () => {
    try {
      setIsLoading(true);
      
      // ດຶງ userId ຈາກ localStorage
      let userIdString = localStorage.getItem('userId');
      let userId: Id<"users"> | undefined;
      
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
      } else {
        // Parse the userId string as a Convex ID
        userId = userIdString as Id<"users">;
      }
      
      // ສ້າງການສົນທະນາໃໝ່
      const conversation = await createConversation({
        userId
      });
      
      // ນຳທາງໄປໜ້າ record ພ້ອມກັບ conversation id
      router.push(`/record/${conversation.conversationId}`);
    } catch (error) {
      console.error("Error creating record:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main>
      <div className="max-w-md mx-auto p-6 mt-10 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-center">ໜ້າຫຼັກ</h1>
          <div>
            <Unauthenticated>
              <SignInButton mode="modal">
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm">
                  ເຂົ້າສູ່ລະບົບ
                </button>
              </SignInButton>
            </Unauthenticated>
            <Authenticated>
              <UserButton afterSignOutUrl="/" />
            </Authenticated>
          </div>
        </div>
        
        <Unauthenticated>
          <div className="mb-6 text-center">
            <p className="mb-4">ກະລຸນາເຂົ້າສູ່ລະບົບເພື່ອເບິ່ງເນື້ອຫາ</p>
            <Link href="/sign-up" className="text-blue-500 hover:underline">
              ຍັງບໍ່ມີບັນຊີ? ລົງທະບຽນທີ່ນີ້
            </Link>
          </div>
        </Unauthenticated>
        
        <Authenticated>
          <div className="mb-6">
            <p className="mb-4">
              ນີ້ແມ່ນຕົວຢ່າງການໃຊ້ Convex ເປັນ backend. ປັດຈຸບັນມີລາຍການ Todo {todosCount} ລາຍການ.
            </p>
            <p className="mb-4">
              ຕົວຢ່າງນີ້ສາມາດໃຊ້ <code className="text-blue-600 bg-gray-100 px-1">useQuery</code> ເພື່ອດຶງຂໍ້ມູນແບບ real-time ຈາກ Convex.
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            <Link 
              href="/todolist" 
              className="bg-blue-500 text-white px-4 py-3 rounded text-center hover:bg-blue-600 focus:outline-none"
            >
              ໄປທີ່ໜ້າ Todo List
            </Link>
            
            <Link 
              href="/record" 
              className="bg-green-500 text-white px-4 py-3 rounded text-center hover:bg-green-600 focus:outline-none"
            >
              ໄປທີ່ໜ້າບັນທຶກຂໍ້ມູນ
            </Link>
            
            <button 
              onClick={handleCreateRecord}
              disabled={isLoading}
              className="bg-purple-500 text-white px-4 py-3 rounded text-center hover:bg-purple-600 focus:outline-none disabled:bg-purple-300"
            >
              {isLoading ? 'ກຳລັງສ້າງ...' : 'ສ້າງ record'}
            </button>
          </div>
        </Authenticated>
      </div>
    </main>
  );
} 