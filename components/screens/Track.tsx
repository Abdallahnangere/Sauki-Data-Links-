import React from 'react';

export const Track: React.FC = () => {
  return (
    <div className="p-6 flex flex-col items-center justify-center h-[80vh] text-center space-y-4">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
         <span className="text-2xl">🔍</span>
      </div>
      <h2 className="text-xl font-bold text-slate-900">Track Transactions</h2>
      <p className="text-slate-500 max-w-xs">Enter your phone number in the Home tab to see your recent purchase history and download receipts.</p>
    </div>
  );
};