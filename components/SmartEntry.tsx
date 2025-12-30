import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartEntryProps {
  onComplete: () => void;
}

export const SmartEntry: React.FC<SmartEntryProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setStage(1), 1000); // Start expanding
    const timer2 = setTimeout(() => setStage(2), 2500); // Start fade out
    const timer3 = setTimeout(onComplete, 3000); // Complete

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 overflow-hidden"
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <div className="relative flex flex-col items-center">
        {/* Abstract animated background elements */}
        <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: stage >= 1 ? 20 : 0, opacity: stage >= 1 ? 0.05 : 0 }}
            transition={{ duration: 1.5, ease: "circOut" }}
            className="absolute w-32 h-32 rounded-full bg-blue-500 blur-3xl"
        />
        
        {/* Main Logo Container */}
        <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="z-10 bg-white p-6 rounded-3xl shadow-2xl shadow-blue-900/50 mb-6"
        >
            <img src="/logo.png" className="w-20 h-20 object-contain" alt="Sauki Logo" />
        </motion.div>

        {/* Text Reveal */}
        <div className="z-10 text-center overflow-hidden">
            <motion.h1 
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-3xl font-black tracking-tight text-white mb-1"
            >
                SAUKI MART
            </motion.h1>
            
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="h-0.5 bg-blue-500 mx-auto mb-2"
            />

            <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="text-xs text-slate-400 font-medium tracking-[0.2em] uppercase"
            >
                Premium Experience
            </motion.p>
        </div>

        {/* Loading Bar */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center">
            <motion.div 
                className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden"
            >
                <motion.div 
                    initial={{ x: "-100%" }}
                    animate={{ x: "0%" }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="w-full h-full bg-blue-500"
                />
            </motion.div>
        </div>
      </div>
    </motion.div>
  );
};