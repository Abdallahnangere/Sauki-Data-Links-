import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { toast } from '../../lib/toast';

export const ToastContainer: React.FC = () => {
  const [activeToast, setActiveToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; id: number } | null>(null);

  useEffect(() => {
    return toast.subscribe((message, type) => {
      const id = Date.now();
      setActiveToast({ message, type, id });
      setTimeout(() => {
        setActiveToast((current) => (current?.id === id ? null : current));
      }, 3000);
    });
  }, []);

  return (
    <AnimatePresence>
      {activeToast && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-6 left-4 right-4 z-[100] flex justify-center pointer-events-none"
        >
          <div className="bg-white/95 backdrop-blur-md border border-slate-100 shadow-2xl rounded-2xl p-4 flex items-center gap-4 min-w-[300px] max-w-md pointer-events-auto">
            <div className={`p-2 rounded-full ${
              activeToast.type === 'success' ? 'bg-green-100 text-green-600' :
              activeToast.type === 'error' ? 'bg-red-100 text-red-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              {activeToast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {activeToast.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {activeToast.type === 'info' && <Info className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900 text-sm">
                {activeToast.type === 'success' ? 'Success' : activeToast.type === 'error' ? 'Error' : 'Notice'}
              </p>
              <p className="text-slate-500 text-xs">{activeToast.message}</p>
            </div>
            <button onClick={() => setActiveToast(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};