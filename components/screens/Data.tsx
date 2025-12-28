import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { DataPlan, NetworkType, PaymentInitResponse } from '../../types';
import { api } from '../../lib/api';
import { formatCurrency, NETWORK_BG_COLORS, cn } from '../../lib/utils';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CheckCircle2, Copy, Download, RefreshCw, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';

export const Data: React.FC = () => {
  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null);
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'plans' | 'confirm' | 'payment' | 'verifying' | 'success' | 'pending'>('plans');
  const [paymentDetails, setPaymentDetails] = useState<PaymentInitResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getDataPlans().then(setPlans);
  }, []);

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
        alert("Could not initiate payment. Try again.");
    } finally {
        setIsLoading(false);
    }
  };

  // Smart Polling Logic
  const handleVerify = async () => {
      if(!paymentDetails) return;
      setIsLoading(true);
      setStep('verifying');
      
      let attempts = 0;
      const maxAttempts = 4; // Try 4 times
      
      const check = async () => {
          try {
              const res = await api.verifyTransaction(paymentDetails.tx_ref);
              
              if (res.status === 'delivered') {
                  setStep('success');
                  setIsLoading(false);
                  return;
              }
              
              attempts++;
              if (attempts < maxAttempts) {
                  // Retry after 3 seconds
                  setTimeout(check, 3000);
              } else {
                  // Final check failed
                  setStep('pending');
                  setIsLoading(false);
              }
          } catch (e) {
               setStep('pending');
               setIsLoading(false);
          }
      };
      
      check();
  }

  const downloadReceipt = async () => {
    if (receiptRef.current === null) return;
    try {
        const dataUrl = await toPng(receiptRef.current, { cacheBust: true, pixelRatio: 3 });
        const link = document.createElement('a');
        link.download = `SAUKI-RECEIPT-${paymentDetails?.tx_ref}.png`;
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error('Could not generate receipt', err);
    }
  };

  const handleClose = () => {
      if (step === 'success' || step === 'pending') {
          setSelectedNetwork(null);
          setSelectedPlan(null);
          setPhone('');
      }
      setStep('plans');
      setPaymentDetails(null);
  }

  return (
    <div className="p-6 pb-32">
       <h1 className="text-2xl font-bold mb-6 text-slate-900">Instant Data</h1>

       {!selectedNetwork ? (
           <div className="space-y-4">
               <p className="text-slate-500 mb-4">Select your network</p>
               {['MTN', 'AIRTEL', 'GLO'].map((net) => (
                   <motion.button
                       key={net}
                       whileTap={{ scale: 0.98 }}
                       onClick={() => handleNetworkSelect(net as NetworkType)}
                       className={cn("w-full h-24 rounded-2xl flex items-center px-6 font-bold text-xl shadow-md transition-all border border-transparent hover:border-slate-200 relative overflow-hidden", NETWORK_BG_COLORS[net])}
                   >
                       <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mr-4 shadow-sm z-10">
                           <img src={`/${net.toLowerCase()}.png`} alt={net} className="w-8 h-8 object-contain" />
                       </div>
                       <span className="z-10">{net}</span>
                   </motion.button>
               ))}
           </div>
       ) : (
           <div>
               <button onClick={() => setSelectedNetwork(null)} className="text-sm text-slate-500 mb-4 hover:text-slate-900 flex items-center">
                 ← Back to Networks
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
                       <span className={cn("px-3 py-1 rounded-full text-xs font-bold mb-2 inline-block", NETWORK_BG_COLORS[selectedPlan.network])}>
                           {selectedPlan.network}
                       </span>
                       <h3 className="text-4xl font-black text-slate-900 my-2">{selectedPlan.data}</h3>
                       <p className="text-slate-500">{selectedPlan.validity}</p>
                   </div>
                   
                   <Input 
                        label="Beneficiary Phone Number" 
                        placeholder="e.g. 08012345678" 
                        type="tel" 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)} 
                        className="text-lg tracking-wide"
                   />
                   
                   <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                       <span className="text-slate-600 font-medium">Total Amount</span>
                       <span className="text-xl font-bold text-slate-900">{formatCurrency(selectedPlan.price)}</span>
                   </div>

                   <Button onClick={handleInitiatePayment} isLoading={isLoading} className="h-14 text-lg">Pay Securely</Button>
               </div>
           )}

           {step === 'payment' && paymentDetails && (
               <div className="space-y-6">
                    <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl text-center">
                     <p className="text-sm text-orange-800 mb-2 font-medium">Transfer EXACTLY</p>
                     <p className="text-3xl font-black text-orange-900">{formatCurrency(paymentDetails.amount)}</p>
                     <p className="text-xs text-orange-600 mt-2">Use your mobile banking app to transfer.</p>
                 </div>
                 
                 <div className="space-y-4">
                     <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
                         <div>
                             <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Bank Name</p>
                             <p className="font-bold text-slate-900">{paymentDetails.bank}</p>
                         </div>
                     </div>
                     <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
                         <div>
                             <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Account Number</p>
                             <p className="font-mono text-xl font-bold tracking-wider text-slate-900">{paymentDetails.account_number}</p>
                         </div>
                         <Button variant="ghost" className="w-auto h-auto p-2 text-blue-600" onClick={() => navigator.clipboard.writeText(paymentDetails.account_number)}>
                             <Copy className="w-5 h-5" />
                         </Button>
                     </div>
                     <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
                         <div>
                             <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Account Name</p>
                             <p className="font-bold text-slate-900">{paymentDetails.account_name}</p>
                         </div>
                     </div>
                 </div>

                 <Button onClick={handleVerify} className="w-full bg-green-600 hover:bg-green-700 text-white h-14 text-lg font-bold shadow-lg shadow-green-200">
                     I Have Paid
                 </Button>
               </div>
           )}

           {step === 'verifying' && (
               <div className="text-center space-y-6 py-12">
                   <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
                   <div>
                       <h2 className="text-xl font-bold text-slate-900">Verifying Payment...</h2>
                       <p className="text-slate-500 mt-2 text-sm">Please wait while we confirm your transfer.</p>
                   </div>
               </div>
           )}

           {step === 'pending' && (
               <div className="text-center space-y-6 py-8">
                   <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                       <RefreshCw className="w-10 h-10 text-orange-600" />
                   </div>
                   <div>
                       <h2 className="text-xl font-bold text-slate-900">Payment Not Confirmed Yet</h2>
                       <p className="text-slate-500 mt-2 text-sm px-6">
                           We are still checking. If you have sent the money, please wait a few minutes and check the <strong>Track</strong> tab.
                       </p>
                   </div>
                   <Button variant="outline" onClick={handleClose}>Close & Check Later</Button>
               </div>
           )}

           {step === 'success' && selectedPlan && (
                <div className="text-center space-y-6 py-4">
                 
                 {/* Hidden Receipt */}
                 <div className="fixed -left-[9999px]">
                    <div ref={receiptRef} className="w-[400px] bg-white p-8 border border-slate-200 flex flex-col items-center text-center font-sans">
                        <img src="/logo.png" className="h-16 w-auto mb-2 object-contain" />
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">SAUKI MART</h1>
                        <p className="text-xs text-slate-500 mb-6 uppercase tracking-widest">Transaction Receipt</p>
                        
                        <div className="w-full h-px bg-slate-100 mb-6"></div>

                        <div className="space-y-4 w-full mb-8">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Ref</span>
                                <span className="font-mono font-medium text-slate-900">{paymentDetails?.tx_ref}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Date</span>
                                <span className="font-medium text-slate-900">{new Date().toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Product</span>
                                <span className="font-bold text-slate-900">{selectedPlan.network} {selectedPlan.data}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Beneficiary</span>
                                <span className="font-medium text-slate-900">{phone}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-4 border-t border-slate-100 mt-4">
                                <span className="text-slate-900">Total Paid</span>
                                <span className="text-green-600">{formatCurrency(selectedPlan.price)}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 justify-center mb-2">
                             <div className="w-16 h-8 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">SMEDAN</div>
                        </div>
                        <p className="text-[10px] text-slate-400">Authorized by Sauki Data Links</p>
                    </div>
                 </div>

                 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-100 animate-in zoom-in">
                     <CheckCircle2 className="w-10 h-10 text-green-600" />
                 </div>
                 <div>
                     <h2 className="text-2xl font-bold text-slate-900">Data Sent Successfully!</h2>
                     <p className="text-slate-500 mt-2 text-sm">The bundle has been credited to {phone}.</p>
                 </div>
                 
                 <div className="flex flex-col gap-3">
                     <Button 
                        onClick={downloadReceipt}
                        className="bg-slate-900 text-white shadow-lg shadow-slate-200"
                    >
                        <Download className="w-4 h-4 mr-2" /> Download Receipt
                     </Button>
                     <Button variant="outline" onClick={handleClose}>Done</Button>
                 </div>
             </div>
           )}
       </BottomSheet>
    </div>
  );
};