import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Product, PaymentInitResponse } from '../../types';
import { api } from '../../lib/api';
import { formatCurrency, cn } from '../../lib/utils';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Loader2, CheckCircle2, Copy } from 'lucide-react';

export const Store: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [step, setStep] = useState<'details' | 'form' | 'payment' | 'success'>('details');
  const [formData, setFormData] = useState({ name: '', phone: '', state: '' });
  const [paymentDetails, setPaymentDetails] = useState<PaymentInitResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!paymentDetails) return;
    setIsLoading(true);
    try {
        // Simulate waiting for backend verification
        await new Promise(resolve => setTimeout(resolve, 2000));
        await api.verifyTransaction(paymentDetails.tx_ref);
        setStep('success');
    } catch (e) {
        // In reality we would show error, but for demo flow we proceed or stay
        console.error(e);
    } finally {
        setIsLoading(false);
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
            className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col"
            onClick={() => setSelectedProduct(product)}
          >
            <div className="aspect-square bg-slate-50 rounded-xl mb-3 relative overflow-hidden">
                 <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
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
                 <div className="aspect-video bg-slate-50 rounded-2xl overflow-hidden">
                     <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
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
                         <span className="font-medium text-slate-900">34–48 hours</span>
                     </div>
                 </div>
                 <Button onClick={handleBuyNow}>Buy Now</Button>
             </div>
         )}

         {step === 'form' && (
             <div className="space-y-4">
                 <Input label="Full Name" placeholder="Enter your name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                 <Input label="Phone Number" type="tel" placeholder="080..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                 <Input label="State" placeholder="e.g. Lagos" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
                 <Button onClick={handleFormSubmit} isLoading={isLoading} className="mt-4">Proceed to Payment</Button>
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
                     <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
                         <div>
                             <p className="text-xs text-slate-500">Account Name</p>
                             <p className="font-medium">{paymentDetails.account_name}</p>
                         </div>
                     </div>
                 </div>

                 <Button onClick={handleVerifyPayment} isLoading={isLoading} className="w-full bg-green-600 hover:bg-green-700 text-white">
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
                     <h2 className="text-2xl font-bold text-slate-900">Order Placed!</h2>
                     <p className="text-slate-500 mt-2">We have received your payment.</p>
                 </div>
                 <Button variant="outline" onClick={handleClose}>Done</Button>
             </div>
         )}
      </BottomSheet>
    </div>
  );
};