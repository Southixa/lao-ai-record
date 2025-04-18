'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TextShimmer } from '../../../../components/motion-primitives/text-shimmer';

export const LoadingAnimationText = () => {
  const [textIndex, setTextIndex] = useState(0);
  const texts = [
    "ກຳລັງບັນທຶກສຽງ...",
    "ກຳລັງປະມວນຜົນ...",
    "ກຳລັງສ້າງຂໍ້ຄວາມຈາກສຽງ..."
  ];

  useEffect(() => {
    // First text shows for 2 seconds
    const firstTimer = setTimeout(() => {
      setTextIndex(1);
      
      // Second text shows for 3 seconds
      const secondTimer = setTimeout(() => {
        setTextIndex(2);
        // Third text stays indefinitely
      }, 3000);
      
      return () => clearTimeout(secondTimer);
    }, 2000);
    
    return () => clearTimeout(firstTimer);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={textIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
        className="text-center text-lg text-gray-500 font-medium"
      >
         <TextShimmer
          duration={0.9}
          className='text-sm font-light text-gray-300'
        >
          {texts[textIndex]}
        </TextShimmer>
      </motion.div>
    </AnimatePresence>
  );
};
