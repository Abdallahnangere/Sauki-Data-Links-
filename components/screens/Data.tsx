import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DataPlan, NetworkType, PaymentInitResponse } from '../../types';
import { api } from '../../lib/api';
import { formatCurrency, NETWORK_BG_COLORS, cn } from '../../lib/utils';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CheckCircle2, Copy } from 'lucide-react';

export const Data: React.FC = () => {
  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null);
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'plans' | 'confirm' | 'payment' | 'success'>('plans');
  const [paymentDetails, setPaymentDetails] = useState<PaymentInitResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleVerify = async () => {
      if(!paymentDetails) return;
      setIsLoading(true);
      try {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate verification
          setStep('success');
      } finally {
          setIsLoading(false);
      }
  }

  const handleClose = () => {
      // If closing from success, reset everything
      if (step === 'success') {
          setSelectedNetwork(null);
      }
      setSelectedPlan(null);
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
                       className={cn("w-full h-20 rounded-2xl flex items-center px-6 font-bold text-lg shadow-sm transition-all", NETWORK_BG_COLORS[net])}
                   >
                       {net}
                   </motion.button>
               ))}
           </div>
       ) : (
           <div>
               <button onClick={() => setSelectedNetwork(null)} className="text-sm text-slate-500 mb-4 hover:text-slate-900">← Change Network</button>
               <h2 className="text-xl font-bold text-slate-900 mb-4">{selectedNetwork} Plans</h2>
               <div className="grid gap-3">
                   {filteredPlans.map(plan => (
                       <motion.div
                           key={plan.id}
                           whileTap={{ scale: 0.99 }}
                           onClick={() => handlePlanSelect(plan)}
                           className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center"
                       >
                           <div>
                               <div className="text-lg font-bold text-slate-900">{plan.data}</div>
                               <div className="text-xs text-slate-500">{plan.validity}</div>
                           </div>
                           <div className="text-base font-semibold text-slate-900 bg-slate-50 px-3 py-1 rounded-lg">
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
                   <div className="text-center pb-4 border-b border-slate-100">
                       <span className={cn("px-3 py-1 rounded-full text-xs font-bold mb-2 inline-block", NETWORK_BG_COLORS[selectedPlan.network])}>
                           {selectedPlan.network}
                       </span>
                       <h3 className="text-3xl font-bold text-slate-900">{selectedPlan.data}</h3>
                       <p className="text-slate-500">{selectedPlan.validity}</p>
                   </div>
                   
                   <Input 
                        label="Phone Number" 
                        placeholder="080..." 
                        type="tel" 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)} 
                   />
                   
                   <div className="flex justify-between items-center pt-2">
                       <span className="text-slate-600">Total</span>
                       <span className="text-xl font-bold text-slate-900">{formatCurrency(selectedPlan.price)}</span>
                   </div>

                   <Button onClick={handleInitiatePayment} isLoading={isLoading}>Pay Securely</Button>
               </div>
           )}

           {step === 'payment' && paymentDetails && (
               <div className="space-y-6">
                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl text-center">
                     <p className="text-sm text-orange-800 mb-1">Transfer exactly</p>
                     <p className="text-2xl font-bold text-orange-900">{formatCurrency(paymentDetails.amount)}</p>
                 </div>
                 
                 <div className="space-y-4">
                     <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
                         <div>
                             <p className="text-xs text-slate-500">Bank Name</p>
                             <p className="font-medium">{paymentDetails.bank}</p>
                         </div>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
                         <div>
                             <p className="text-xs text-slate-500">Account Number</p>
                             <p className="font-mono text-lg font-bold tracking-wider">{paymentDetails.account_number}</p>
                         </div>
                         <Button variant="ghost" className="w-auto h-auto p-2" onClick={() => navigator.clipboard.writeText(paymentDetails.account_number)}>
                             <Copy className="w-4 h-4" />
                         </Button>
                     </div>
                 </div>

                 <Button onClick={handleVerify} isLoading={isLoading} className="w-full bg-green-600 hover:bg-green-700 text-white">
                     I Have Paid
                 </Button>
               </div>
           )}

           {step === 'success' && (
                <div className="text-center space-y-6 py-8">
                 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                     <CheckCircle2 className="w-10 h-10 text-green-600" />
                 </div>
                 <div>
                     <h2 className="text-2xl font-bold text-slate-900">Data Sent!</h2>
                     <p className="text-slate-500 mt-2">Your bundle will be active shortly.</p>
                 </div>
                 <Button variant="outline" onClick={handleClose}>Done</Button>
             </div>
           )}
       </BottomSheet>
    </div>
  );
};