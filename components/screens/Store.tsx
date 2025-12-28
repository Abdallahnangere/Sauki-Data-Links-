import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Product, PaymentInitResponse } from '../../types';
import { api } from '../../lib/api';
import { formatCurrency, cn } from '../../lib/utils';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Loader2, CheckCircle2, Copy, Download, RefreshCw } from 'lucide-react';
import { toPng } from 'html-to-image';

export const Store: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [step, setStep] = useState<'details' | 'form' | 'payment' | 'verifying' | 'pending' | 'success'>('details');
  const [formData, setFormData] = useState({ name: '', phone: '', state: '' });
  const [paymentDetails, setPaymentDetails] = useState<PaymentInitResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getProducts().then(setProducts);
  }, []);

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
      alert("Error creating order");
    } finally {
      setIsLoading(false);
    }
  };

  // Smart Polling Logic
  const handleVerifyPayment = async () => {
    if (!paymentDetails) return;
    setIsLoading(true);
    setStep('verifying');

    let attempts = 0;
    const maxAttempts = 5; // Check 5 times over ~15 seconds

    const check = async () => {
        try {
            const res = await api.verifyTransaction(paymentDetails.tx_ref);
            
            if (res.status === 'paid' || res.status === 'delivered') {
                setStep('success');
                setIsLoading(false);
                return;
            }

            attempts++;
            if (attempts < maxAttempts) {
                setTimeout(check, 3000); // 3 second delay
            } else {
                setStep('pending');
                setIsLoading(false);
            }
        } catch (e) {
            setStep('pending');
            setIsLoading(false);
        }
    };
    check();
  };

  const downloadReceipt = async () => {
    if (receiptRef.current === null) return;
    try {
        const dataUrl = await toPng(receiptRef.current, { cacheBust: true, pixelRatio: 3 });
        const link = document.createElement('a');
        link.download = `SAUKI-STORE-RECEIPT-${paymentDetails?.tx_ref || 'order'}.png`;
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error('Could not generate receipt', err);
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
      <h1 className="text-2xl font-bold mb-6 text-slate-900">Premium Store</h1>
      
      <div className="grid grid-cols-2 gap-4">
        {products.map((product) => (
          <motion.div
            key={product.id}
            whileTap={{ scale: 0.96 }}
            className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedProduct(product)}
          >
            <div className="aspect-square bg-slate-50 rounded-xl mb-3 relative overflow-hidden flex items-center justify-center">
                 <img src={product.image} alt={product.name} className="object-contain w-full h-full p-2" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">{product.name}</h3>
            <p className="text-xs text-slate-500 mb-2 line-clamp-1">{product.description}</p>
            <div className="mt-auto font-bold text-slate-900">{formatCurrency(product.price)}</div>
          </motion.div>
        ))}
      </div>

      <BottomSheet isOpen={!!selectedProduct} onClose={handleClose} title={step === 'payment' ? 'Complete Payment' : selectedProduct?.name}>
         {step === 'details' && selectedProduct && (
             <div className="space-y-6">
                 <div className="aspect-video bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center">
                     <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-contain" />
                 </div>
                 <div>
                     <h2 className="text-2xl font-bold text-slate-900">{formatCurrency(selectedProduct.price)}</h2>
                     <p className="text-slate-600 mt-2 leading-relaxed">{selectedProduct.description}</p>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                     <div className="flex justify-between text-sm">
                         <span className="text-slate-500">Delivery</span>
                         <span className="font-medium text-green-600">Free</span>
                     </div>
                     <div className="flex justify-between text-sm">
                         <span className="text-slate-500">Estimated Time</span>
                         <span className="font-medium text-slate-900">24–48 hours</span>
                     </div>
                 </div>
                 <Button onClick={handleBuyNow} className="h-14 text-lg">Buy Now</Button>
             </div>
         )}

         {step === 'form' && (
             <div className="space-y-4">
                 <Input label="Full Name" placeholder="Enter your name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                 <Input label="Phone Number" type="tel" placeholder="080..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                 <Input label="Delivery State" placeholder="e.g. Lagos" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
                 <Button onClick={handleFormSubmit} isLoading={isLoading} className="mt-4 h-12">Proceed to Payment</Button>
             </div>
         )}

         {step === 'payment' && paymentDetails && (
             <div className="space-y-6">
                 <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl text-center">
                     <p className="text-sm text-orange-800 mb-2 font-medium">Transfer EXACTLY</p>
                     <p className="text-3xl font-black text-orange-900">{formatCurrency(paymentDetails.amount)}</p>
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
                 </div>

                 <Button onClick={handleVerifyPayment} className="w-full bg-green-600 hover:bg-green-700 text-white h-14 text-lg font-bold shadow-lg shadow-green-200">
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
                     <h2 className="text-xl font-bold text-slate-900">Payment Processing</h2>
                     <p className="text-slate-500 mt-2 text-sm px-6">
                         We are yet to confirm the transfer. This usually takes a few minutes.
                         <br/><br/>
                         Please check the <strong>Track</strong> tab periodically.
                     </p>
                 </div>
                 <Button variant="outline" onClick={handleClose}>Okay, Check Later</Button>
             </div>
         )}

         {step === 'success' && selectedProduct && (
             <div className="text-center space-y-6 py-4">

                 {/* Hidden Receipt for Generation */}
                 <div className="fixed -left-[9999px]">
                    <div ref={receiptRef} className="w-[400px] bg-white p-8 border border-slate-200 flex flex-col items-center text-center font-sans">
                        <img src="/logo.png" className="h-16 w-auto mb-2 object-contain" />
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">SAUKI MART</h1>
                        <p className="text-xs text-slate-500 mb-6 uppercase tracking-widest">Store Receipt</p>
                        
                        <div className="w-full h-px bg-slate-100 mb-6"></div>

                        <div className="space-y-4 w-full mb-8">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Order Ref</span>
                                <span className="font-mono font-medium text-slate-900">{paymentDetails?.tx_ref}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Date</span>
                                <span className="font-medium text-slate-900">{new Date().toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Item</span>
                                <span className="font-bold text-slate-900">{selectedProduct.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Customer</span>
                                <span className="font-medium text-slate-900">{formData.name}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-4 border-t border-slate-100 mt-4">
                                <span className="text-slate-900">Paid</span>
                                <span className="text-green-600">{formatCurrency(selectedProduct.price)}</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400">Authorized by Sauki Data Links</p>
                    </div>
                 </div>

                 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-100 animate-in zoom-in">
                     <CheckCircle2 className="w-10 h-10 text-green-600" />
                 </div>
                 <div>
                     <h2 className="text-2xl font-bold text-slate-900">Order Confirmed!</h2>
                     <p className="text-slate-500 mt-2 text-sm">Payment received successfully.</p>
                     <div className="bg-slate-50 p-4 rounded-xl mt-4 border border-slate-100">
                         <p className="font-semibold text-slate-800 text-sm">Next Steps</p>
                         <p className="text-xs text-slate-500 mt-1">A delivery agent will contact you on <strong>{formData.phone}</strong> shortly to arrange delivery to {formData.state}.</p>
                     </div>
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