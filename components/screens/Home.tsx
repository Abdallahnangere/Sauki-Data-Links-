import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Wifi, Phone, Mail, Headphones, MessageCircle } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';

interface HomeProps {
  onNavigate: (tab: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  return (
    <div className="p-6 space-y-8 pb-32">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">SAUKI MART</h1>
          <p className="text-slate-500 text-sm mt-1">Premium Services</p>
        </div>
        <div className="w-12 h-12 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center p-2">
            <img src="/logo.png" alt="Sauki" className="w-full h-full object-contain" />
        </div>
      </header>

      {/* Action Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Store Card - Full Width */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('store')}
          className="col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-[2rem] p-8 shadow-xl shadow-slate-200 cursor-pointer relative overflow-hidden group min-h-[180px] flex flex-col justify-end border border-white/10"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Smartphone size={140} />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4 backdrop-blur-md border border-white/10">
                 <Smartphone className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-1">Buy Devices</h3>
            <p className="text-slate-400 text-sm">Premium gadgets & accessories</p>
          </div>
        </motion.div>

        {/* Data Card - Half Width */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('data')}
          className="col-span-1 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-[2rem] p-6 shadow-xl shadow-blue-100 cursor-pointer relative overflow-hidden group min-h-[160px] flex flex-col justify-end"
        >
           <div className="absolute -top-6 -right-6 p-4 opacity-10">
            <Wifi size={100} />
          </div>
          <div className="relative z-10">
             <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-md border border-white/10">
                <Wifi className="w-5 h-5 text-white" />
             </div>
            <h3 className="text-lg font-bold leading-tight">Instant<br/>Data</h3>
          </div>
        </motion.div>

        {/* Support Card - Half Width */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsSupportOpen(true)}
          className="col-span-1 bg-white text-slate-900 rounded-[2rem] p-6 shadow-xl shadow-slate-100 border border-slate-100 cursor-pointer relative overflow-hidden group min-h-[160px] flex flex-col justify-end"
        >
           <div className="absolute -top-6 -right-6 p-4 opacity-5">
            <Headphones size={100} />
          </div>
          <div className="relative z-10">
             <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                <Headphones className="w-5 h-5 text-slate-700" />
             </div>
            <h3 className="text-lg font-bold leading-tight">Help &<br/>Contact</h3>
          </div>
        </motion.div>
      </div>

      {/* Trust Badges */}
      <div className="pt-4">
        <div className="text-center space-y-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Subsidiary of Sauki Data Links</p>
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-center gap-6">
                <div className="flex flex-col items-center gap-2">
                    <img src="/smedan.png" alt="SMEDAN" className="h-12 w-auto object-contain grayscale opacity-80" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <span className="text-[9px] text-slate-400 font-medium">SMEDAN CERTIFIED</span>
                </div>
                <div className="w-px h-8 bg-slate-100"></div>
                <div className="flex flex-col items-center gap-2">
                    <img src="/coat.png" alt="Nigeria" className="h-12 w-auto object-contain grayscale opacity-80" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <span className="text-[9px] text-slate-400 font-medium">NIGERIA</span>
                </div>
            </div>
        </div>
      </div>

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
          </div>
      </BottomSheet>
    </div>
  );
};