import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { DataPlan, NetworkType, PaymentInitResponse } from '../../types';
import { api } from '../../lib/api';
import { formatCurrency, NETWORK_BG_COLORS, cn } from '../../lib/utils';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CheckCircle2, Copy, Download, RefreshCw, Loader2, Wifi, ArrowRight } from 'lucide-react';
import { toPng } from 'html-to-image';
import { SharedReceipt } from '../SharedReceipt';
import { toast } from '../../lib/toast';

let cachedPlans: DataPlan[] | null = null;

export const Data: React.FC = () => {
  const [plans, setPlans] = useState<DataPlan[]>(cachedPlans || []);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null);
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'plans' | 'confirm' | 'payment' | 'success'>('plans');
  const [paymentDetails, setPaymentDetails] = useState<PaymentInitResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cachedPlans) {
        api.getDataPlans().then(data => {
            setPlans(data);
            cachedPlans = data;
        });
    }
  }, []);

  // Auto-Polling
  useEffect(() => {
    let interval: any;
    if (paymentDetails && step === 'payment') {
      setIsPolling(true);
      interval = setInterval(async () => {
        try {
          const res = await api.verifyTransaction(paymentDetails.tx_ref);
          if (res.status === 'delivered') {
            setStep('success');
            setIsPolling(false);
            clearInterval(interval);
            toast.success("Payment received! Data sent.");
          } else if (res.status === 'paid') {
            // Paid but waiting for delivery (Amigo processing)
          }
        } catch (e) { }
      }, 3000); 
    }
    return () => clearInterval(interval);
  }, [paymentDetails, step]);

  const filteredPlans = selectedNetwork 
    ? plans.filter(p => p.network === selectedNetwork)
    : [];

  const handleNetworkSelect = (net: NetworkType) => {
    setSelectedNetwork(net);
    setStep('plans');
  };

  const handlePlanSelect = (plan: DataPlan) => {
    setSelectedPlan(plan);
    setStep('confirm');
  };

  const handleInitiatePayment = async () => {
    if (!selectedPlan || phone.length < 10) return;
    setIsLoading(true);
    try {
        const res = await api.initiateDataPayment({ planId: selectedPlan.id, phone });
        setPaymentDetails(res);
        setStep('payment');
    } catch(e) {
        toast.error("Connection error. Try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleManualCheck = async () => {
      if (!paymentDetails) return;
      setIsLoading(true);
      try {
          const res = await api.verifyTransaction(paymentDetails.tx_ref);
          if (res.status === 'delivered') {
              setStep('success');
              toast.success("Confirmed! Data delivered.");
          } else if (res.status === 'paid') {
              toast.info("Payment confirmed. Delivery processing...");
          } else {
              toast.info("Payment not yet received. Please wait.");
          }
      } catch (e) {
          toast.error("Could not verify status.");
      } finally {
          setIsLoading(false);
      }
  };

  const downloadReceipt = async () => {
    if (receiptRef.current === null) return;
    try {
        const dataUrl = await toPng(receiptRef.current, { cacheBust: true, pixelRatio: 3 });
        const link = document.createElement('a');
        link.download = `SAUKI-DATA-${paymentDetails?.tx_ref}.png`;
        link.href = dataUrl;
        link.click();
        toast.success("Receipt downloaded");
    } catch (err) {
        console.error('Could not generate receipt', err);
        toast.error("Failed to generate receipt");
    }
  };

  const handleClose = () => {
      if (step === 'success') {
          setSelectedNetwork(null);
          setSelectedPlan(null);
          setPhone('');
      }
      setStep('plans');
      setPaymentDetails(null);
  }

  return (
    <div className="p-6 pb-32">
       <h1 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-2">
            <Wifi className="w-6 h-6" /> Instant Data
       </h1>

       {!selectedNetwork ? (
           <div className="space-y-4">
               <p className="text-slate-500 mb-4">Select Network Provider</p>
               {['MTN', 'AIRTEL', 'GLO'].map((net) => (
                   <motion.button
                       key={net}
                       whileTap={{ scale: 0.98 }}
                       onClick={() => handleNetworkSelect(net as NetworkType)}
                       className={cn("w-full h-24 rounded-2xl flex items-center px-6 font-bold text-xl shadow-sm transition-all border border-slate-100 relative overflow-hidden bg-white", 
                        net === 'MTN' ? 'hover:border-yellow-400' : net === 'AIRTEL' ? 'hover:border-red-400' : 'hover:border-green-400')}
                   >
                       <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mr-4 shadow-sm z-10 p-2">
                           <img src={`/${net.toLowerCase()}.png`} alt={net} className="w-full h-full object-contain" />
                       </div>
                       <span className="z-10 text-slate-800">{net}</span>
                   </motion.button>
               ))}
           </div>
       ) : (
           <div>
               <button onClick={() => setSelectedNetwork(null)} className="text-sm text-slate-500 mb-4 hover:text-slate-900 flex items-center">
                 ← Change Network
               </button>
               <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                   <img src={`/${selectedNetwork.toLowerCase()}.png`} className="w-6 h-6 object-contain" />
                   {selectedNetwork} Bundles
               </h2>
               <div className="grid gap-3">
                   {filteredPlans.map(plan => (
                       <motion.div
                           key={plan.id}
                           whileTap={{ scale: 0.99 }}
                           onClick={() => handlePlanSelect(plan)}
                           className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center cursor-pointer hover:border-slate-300 transition-colors"
                       >
                           <div>
                               <div className="text-lg font-bold text-slate-900">{plan.data}</div>
                               <div className="text-xs text-slate-500 mt-1">{plan.validity}</div>
                           </div>
                           <div className="text-base font-semibold text-slate-900 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                               {formatCurrency(plan.price)}
                           </div>
                       </motion.div>
                   ))}
               </div>
           </div>
       )}

       <BottomSheet isOpen={!!selectedPlan} onClose={handleClose} title="Purchase Data">
           {step === 'confirm' && selectedPlan && (
               <div className="space-y-6">
                   <div className="text-center pb-6 border-b border-slate-100">
                       <span className={cn("px-4 py-1.5 rounded-full text-xs font-bold mb-3 inline-block shadow-sm", NETWORK_BG_COLORS[selectedPlan.network])}>
                           {selectedPlan.network}
                       </span>
                       <h3 className="text-5xl font-black text-slate-900 my-2">{selectedPlan.data}</h3>
                       <p className="text-slate-500 font-medium">{selectedPlan.validity}</p>
                   </div>
                   
                   <Input 
                        label="Beneficiary Phone Number" 
                        placeholder="080..." 
                        type="tel" 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)} 
                        className="text-lg tracking-wide h-14"
                   />
                   
                   <div className="flex justify-between items-center bg-slate-50 p-5 rounded-xl border border-slate-100">
                       <span className="text-slate-600 font-medium">Total Price</span>
                       <span className="text-2xl font-black text-slate-900">{formatCurrency(selectedPlan.price)}</span>
                   </div>

                   <Button onClick={handleInitiatePayment} isLoading={isLoading} className="h-14 text-lg bg-slate-900 text-white">Pay Securely</Button>
               </div>
           )}

           {step === 'payment' && paymentDetails && (
               <div className="space-y-6">
                    <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl text-center relative overflow-hidden">
                     {isPolling && <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute top-2 right-2 text-[10px] text-orange-600 font-bold uppercase flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Detecting</motion.div>}
                     <p className="text-sm text-orange-800 mb-2 font-medium">Transfer EXACTLY</p>
                     <p className="text-4xl font-black text-orange-900 tracking-tight">{formatCurrency(paymentDetails.amount)}</p>
                     <p className="text-xs text-orange-600 mt-2">to the account below</p>
                 </div>
                 
                 <div className="space-y-3">
                     <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                         <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Bank Name</p>
                         <p className="font-bold text-slate-900 text-lg">{paymentDetails.bank}</p>
                     </div>
                     <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
                         <div>
                             <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Account Number</p>
                             <p className="font-mono text-2xl font-bold tracking-wider text-slate-900">{paymentDetails.account_number}</p>
                         </div>
                         <Button variant="ghost" className="w-12 h-12 p-0 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full" onClick={() => {
                             navigator.clipboard.writeText(paymentDetails.account_number);
                             toast.success("Account number copied!");
                         }}>
                             <Copy className="w-5 h-5" />
                         </Button>
                     </div>
                     <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                         <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Account Name</p>
                         <p className="font-bold text-slate-900 text-sm">Abdullahi Adam Usman FLW</p>
                     </div>
                 </div>

                 <div className="space-y-2">
                    <Button onClick={handleManualCheck} isLoading={isLoading} className="bg-green-600 hover:bg-green-700 h-14 text-white text-lg font-bold shadow-lg shadow-green-100">
                        I Have Made the Transfer
                    </Button>
                    
                    <div className="bg-slate-50 p-4 rounded-xl text-center">
                        <div className="flex items-center justify-center gap-2 text-slate-600 mb-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm font-medium">Auto-confirming payment...</span>
                        </div>
                        <p className="text-xs text-slate-400">Data will be delivered immediately after confirmation.</p>
                    </div>
                 </div>
               </div>
           )}

           {step === 'success' && selectedPlan && paymentDetails && (
                <div className="text-center space-y-6 py-4">
                 
                 <SharedReceipt 
                    ref={receiptRef}
                    transaction={{
                        tx_ref: paymentDetails.tx_ref,
                        amount: selectedPlan.price,
                        date: new Date().toLocaleString(),
                        type: 'Data Bundle',
                        description: `${selectedPlan.network} ${selectedPlan.data} (${selectedPlan.validity})`,
                        status: 'delivered',
                        customerPhone: phone
                    }}
                 />

                 <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-200 animate-in zoom-in duration-300">
                     <CheckCircle2 className="w-12 h-12 text-white" />
                 </div>
                 <div>
                     <h2 className="text-3xl font-black text-slate-900 tracking-tight">Data Delivered!</h2>
                     <p className="text-slate-500 mt-2 text-sm">{selectedPlan.data} sent to {phone}.</p>
                 </div>
                 
                 <div className="flex flex-col gap-3 pt-4">
                     <Button 
                        onClick={downloadReceipt}
                        className="bg-slate-900 text-white shadow-xl shadow-slate-200 h-14 text-lg"
                    >
                        <Download className="w-5 h-5 mr-2" /> Download Receipt
                     </Button>
                     <Button variant="ghost" onClick={handleClose}>Done</Button>
                 </div>
             </div>
           )}
       </BottomSheet>
    </div>
  );
};