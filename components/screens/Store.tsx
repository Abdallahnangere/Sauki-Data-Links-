import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Product, PaymentInitResponse } from '../../types';
import { api } from '../../lib/api';
import { formatCurrency, cn } from '../../lib/utils';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Loader2, CheckCircle2, Copy, Download, RefreshCw, ShoppingBag } from 'lucide-react';
import { toPng } from 'html-to-image';
import { SharedReceipt } from '../SharedReceipt';
import { toast } from '../../lib/toast';

// Module-level cache for instant tab switching
let cachedProducts: Product[] | null = null;

export const Store: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(cachedProducts || []);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [step, setStep] = useState<'details' | 'form' | 'payment' | 'success'>('details');
  const [formData, setFormData] = useState({ name: '', phone: '', state: '' });
  const [paymentDetails, setPaymentDetails] = useState<PaymentInitResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Optimistic load
    if (!cachedProducts) {
      setIsLoading(true);
      api.getProducts().then(data => {
        setProducts(data);
        cachedProducts = data;
        setIsLoading(false);
      });
    }
  }, []);

  // Auto-Polling Effect
  useEffect(() => {
    let interval: any;
    if (paymentDetails && step === 'payment') {
      setIsPolling(true);
      interval = setInterval(async () => {
        try {
          const res = await api.verifyTransaction(paymentDetails.tx_ref);
          if (res.status === 'paid' || res.status === 'delivered') {
            setStep('success');
            setIsPolling(false);
            clearInterval(interval);
            toast.success("Payment confirmed!");
          }
        } catch (e) {
          // Silent fail on polling error
        }
      }, 3000); // Check every 3 seconds
    }
    return () => clearInterval(interval);
  }, [paymentDetails, step]);

  const handleBuyNow = () => {
    setStep('form');
  };

  const handleFormSubmit = async () => {
    if (!selectedProduct) return;
    setIsLoading(true);
    try {
      const res = await api.initiateEcommercePayment({
        productId: selectedProduct.id,
        ...formData
      });
      setPaymentDetails(res);
      setStep('payment');
    } catch (e) {
      console.error(e);
      toast.error("Error creating order");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualCheck = async () => {
      if (!paymentDetails) return;
      setIsLoading(true);
      try {
          const res = await api.verifyTransaction(paymentDetails.tx_ref);
          if (res.status === 'paid' || res.status === 'delivered') {
              setStep('success');
              toast.success("Payment confirmed!");
          } else {
              toast.info("Payment not received yet.");
          }
      } catch (e) {
          toast.error("Verification failed.");
      } finally {
          setIsLoading(false);
      }
  };

  const downloadReceipt = async () => {
    if (receiptRef.current === null) return;
    try {
        const dataUrl = await toPng(receiptRef.current, { cacheBust: true, pixelRatio: 3 });
        const link = document.createElement('a');
        link.download = `SAUKI-STORE-${paymentDetails?.tx_ref}.png`;
        link.href = dataUrl;
        link.click();
        toast.success("Receipt downloaded");
    } catch (err) {
        console.error('Could not generate receipt', err);
        toast.error("Failed to generate receipt");
    }
  };

  const handleClose = () => {
    setSelectedProduct(null);
    setStep('details');
    setPaymentDetails(null);
    setFormData({ name: '', phone: '', state: '' });
  };

  return (
    <div className="p-6 pb-32">
      <h1 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-2">
        <ShoppingBag className="w-6 h-6" /> Premium Store
      </h1>
      
      {isLoading && products.length === 0 ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-slate-300" /></div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
            {products.map((product) => (
            <motion.div
                key={product.id}
                whileTap={{ scale: 0.96 }}
                className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedProduct(product)}
            >
                <div className="aspect-square bg-slate-50 rounded-xl mb-3 relative overflow-hidden flex items-center justify-center p-4">
                    <img src={product.image} alt={product.name} className="object-contain w-full h-full mix-blend-multiply" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 min-h-[40px] leading-tight">{product.name}</h3>
                <div className="mt-3 font-bold text-slate-900">{formatCurrency(product.price)}</div>
            </motion.div>
            ))}
        </div>
      )}

      <BottomSheet isOpen={!!selectedProduct} onClose={handleClose} title={step === 'payment' ? 'Complete Payment' : 'Product Details'}>
         {step === 'details' && selectedProduct && (
             <div className="space-y-6">
                 <div className="aspect-video bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center p-6">
                     <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-contain mix-blend-multiply" />
                 </div>
                 <div>
                     <h2 className="text-2xl font-bold text-slate-900">{formatCurrency(selectedProduct.price)}</h2>
                     <p className="text-lg font-medium text-slate-900 mt-1">{selectedProduct.name}</p>
                     <p className="text-slate-500 mt-2 text-sm leading-relaxed">{selectedProduct.description}</p>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                     <div className="flex justify-between text-sm">
                         <span className="text-slate-500">Delivery</span>
                         <span className="font-medium text-green-600">Free</span>
                     </div>
                     <div className="flex justify-between text-sm">
                         <span className="text-slate-500">Estimated Time</span>
                         <span className="font-medium text-slate-900">24–48 hours</span>
                     </div>
                 </div>
                 <Button onClick={handleBuyNow} className="h-14 text-lg bg-slate-900 text-white shadow-lg shadow-slate-200">Buy Now</Button>
             </div>
         )}

         {step === 'form' && (
             <div className="space-y-4">
                 <Input label="Full Name" placeholder="Enter your name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                 <Input label="Phone Number" type="tel" placeholder="080..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                 <Input label="Delivery State" placeholder="e.g. Lagos" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
                 <Button onClick={handleFormSubmit} isLoading={isLoading} className="mt-4 h-14 text-lg">Proceed to Payment</Button>
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
                             toast.success("Account number copied");
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
                            <span className="text-sm font-medium">Waiting for payment...</span>
                        </div>
                        <p className="text-xs text-slate-400">We will auto-confirm instantly.</p>
                    </div>
                 </div>
                 
                 <Button onClick={() => setStep('success')} variant="outline" className="w-full h-12 text-slate-400 text-xs">
                     Simulate Success (Dev Only)
                 </Button>
             </div>
         )}

         {step === 'success' && selectedProduct && paymentDetails && (
             <div className="text-center space-y-6 py-4">
                 
                 <SharedReceipt 
                    ref={receiptRef}
                    transaction={{
                        tx_ref: paymentDetails.tx_ref,
                        amount: selectedProduct.price,
                        date: new Date().toLocaleString(),
                        type: 'Devices',
                        description: selectedProduct.name,
                        status: 'paid',
                        customerName: formData.name,
                        customerPhone: formData.phone
                    }}
                 />

                 <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-200 animate-in zoom-in duration-300">
                     <CheckCircle2 className="w-12 h-12 text-white" />
                 </div>
                 <div>
                     <h2 className="text-3xl font-black text-slate-900 tracking-tight">Order Confirmed!</h2>
                     <p className="text-slate-500 mt-2 text-sm">We have received your payment.</p>
                     <div className="bg-slate-50 p-4 rounded-xl mt-6 border border-slate-100 text-left">
                         <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-green-500"></span>
                             Delivery Pending
                         </p>
                         <p className="text-xs text-slate-500 mt-1 pl-4">Our agent will contact <strong>{formData.phone}</strong> shortly.</p>
                     </div>
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