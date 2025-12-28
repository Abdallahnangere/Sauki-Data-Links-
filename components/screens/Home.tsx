import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Wifi, ArrowRight, Phone, Mail, Headphones, MessageCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { api } from '../../lib/api';
import { Transaction } from '../../types';
import { cn, formatCurrency } from '../../lib/utils';
import { BottomSheet } from '../ui/BottomSheet';

interface HomeProps {
  onNavigate: (tab: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [phone, setPhone] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const handleTrack = async () => {
    if (phone.length < 10) return;
    setIsLoading(true);
    try {
      const res = await api.trackTransactions(phone);
      if (res?.transactions) {
        setTransactions(res.transactions);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'paid': return 'bg-blue-100 text-blue-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-6 space-y-6 pb-32">
      {/* Header */}
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">SAUKI MART</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
            <span className="text-slate-600 font-semibold text-xs">SM</span>
        </div>
      </header>

      {/* Action Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Store Card - Full Width */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('store')}
          className="col-span-2 bg-slate-900 text-white rounded-3xl p-6 shadow-lg shadow-slate-200 cursor-pointer relative overflow-hidden group min-h-[160px] flex flex-col justify-end"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Smartphone size={120} />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-3 backdrop-blur-sm">
                 <Smartphone className="w-5 h-5 text-slate-100" />
            </div>
            <h3 className="text-xl font-semibold mb-1">Buy Devices</h3>
            <p className="text-slate-400 text-xs">Premium gadgets</p>
          </div>
        </motion.div>

        {/* Data Card - Half Width */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('data')}
          className="col-span-1 bg-blue-600 text-white rounded-3xl p-5 shadow-lg shadow-blue-200 cursor-pointer relative overflow-hidden group min-h-[140px] flex flex-col justify-end"
        >
           <div className="absolute -top-4 -right-4 p-4 opacity-10">
            <Wifi size={80} />
          </div>
          <div className="relative z-10">
             <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-3 backdrop-blur-sm">
                <Wifi className="w-4 h-4 text-white" />
             </div>
            <h3 className="text-lg font-semibold leading-tight">Mobile Data</h3>
          </div>
        </motion.div>

        {/* Support Card - Half Width */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsSupportOpen(true)}
          className="col-span-1 bg-slate-100 text-slate-900 rounded-3xl p-5 shadow-sm cursor-pointer relative overflow-hidden group min-h-[140px] flex flex-col justify-end"
        >
           <div className="absolute -top-4 -right-4 p-4 opacity-5">
            <Headphones size={80} />
          </div>
          <div className="relative z-10">
             <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm">
                <Headphones className="w-4 h-4 text-slate-700" />
             </div>
            <h3 className="text-lg font-semibold leading-tight">Help & Contact</h3>
          </div>
        </motion.div>
      </div>

      {/* Tracking Section - Compact */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h3 className="text-sm font-semibold mb-3 text-slate-900 flex items-center">
            Track Order <ArrowRight className="w-3 h-3 ml-1 text-slate-400"/>
        </h3>
        <div className="flex gap-2 mb-4">
          <Input 
            className="h-10 text-sm"
            placeholder="Phone number" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button className="w-auto px-4 h-10" onClick={handleTrack} isLoading={isLoading}>
            Go
          </Button>
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
          {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div>
                  <div className="text-xs font-medium text-slate-900 capitalize">{tx.type}</div>
                  <div className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                   <div className="text-xs font-bold text-slate-900">{formatCurrency(tx.amount)}</div>
                   <span className={cn("text-[8px] uppercase font-bold px-1.5 py-0.5 rounded-full", getStatusColor(tx.status))}>
                     {tx.status}
                   </span>
                </div>
              </div>
            ))}
            {transactions.length === 0 && !isLoading && (
                 <p className="text-xs text-slate-400 text-center py-2">No recent checks</p>
            )}
        </div>
      </div>

      {/* Contact Bottom Sheet */}
      <BottomSheet isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} title="Contact Us">
          <div className="space-y-6">
              <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-slate-900">We are here to help!</p>
                  <p className="text-xs text-slate-500">Reach out for inquiries or disputes.</p>
              </div>
              
              <div className="grid gap-3">
                  <a href="tel:+2349024099561" className="flex items-center p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
                          <Phone className="w-5 h-5" />
                      </div>
                      <div>
                          <p className="text-xs text-slate-500">Support Line 1</p>
                          <p className="font-semibold text-slate-900">09024099561</p>
                      </div>
                  </a>

                  <a href="tel:+2349076872520" className="flex items-center p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
                          <Phone className="w-5 h-5" />
                      </div>
                      <div>
                          <p className="text-xs text-slate-500">Support Line 2</p>
                          <p className="font-semibold text-slate-900">09076872520</p>
                      </div>
                  </a>

                  <a href="https://wa.me/2349024099561" target="_blank" rel="noreferrer" className="flex items-center p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors border border-green-100">
                      <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-700 mr-4">
                          <MessageCircle className="w-5 h-5" />
                      </div>
                      <div>
                          <p className="text-xs text-green-700">Chat with us</p>
                          <p className="font-semibold text-green-800">WhatsApp Support</p>
                      </div>
                  </a>

                  <a href="mailto:saukidatalinks@gmail.com" className="flex items-center p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-4">
                          <Mail className="w-5 h-5" />
                      </div>
                      <div>
                          <p className="text-xs text-slate-500">Email Us</p>
                          <p className="font-semibold text-slate-900">saukidatalinks@gmail.com</p>
                      </div>
                  </a>
              </div>

              <div className="pt-4 text-center">
                   <p className="text-[10px] text-slate-400 uppercase tracking-widest">Trusted by SMEDAN • Nigeria</p>
              </div>
          </div>
      </BottomSheet>
    </div>
  );
};