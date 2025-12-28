import React, { useState, useRef } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { Transaction } from '../../types';
import { cn, formatCurrency } from '../../lib/utils';
import { Search, Download, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { SharedReceipt } from '../SharedReceipt';
import { toast } from '../../lib/toast';

export const Track: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Receipt Generation State
  const receiptRef = useRef<HTMLDivElement>(null);
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);

  const handleTrack = async () => {
    if (phone.length < 10) return;
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await api.trackTransactions(phone);
      if (res?.transactions) {
        setTransactions(res.transactions);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async (tx_ref: string, id: string) => {
      setRetryingId(id);
      try {
          const res = await api.verifyTransaction(tx_ref);
          await handleTrack();
          
          if (res.status === 'delivered') {
              toast.success("Success! Data delivered.");
          } else if (res.status === 'paid') {
              toast.info("Payment confirmed, delivery pending.");
          } else {
              toast.error("Status: " + res.status);
          }
      } catch (e) {
          toast.error("Retry failed. Check network.");
      } finally {
          setRetryingId(null);
      }
  };

  const handleDownloadReceipt = async (tx: Transaction) => {
      setReceiptTx(tx);
      // Give React time to render the hidden component
      setTimeout(async () => {
          if (receiptRef.current) {
              try {
                  const dataUrl = await toPng(receiptRef.current, { cacheBust: true, pixelRatio: 3 });
                  const link = document.createElement('a');
                  link.download = `SAUKI-RECEIPT-${tx.tx_ref}.png`;
                  link.href = dataUrl;
                  link.click();
                  toast.success("Receipt downloaded");
              } catch (err) {
                  console.error('Receipt error', err);
                  toast.error("Failed to generate receipt");
              }
              setReceiptTx(null);
          }
      }, 500);
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'paid': return 'bg-blue-100 text-blue-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // Helper to get the specific item name for the receipt "Item Details"
  const getTransactionDescription = (tx: Transaction) => {
      if (tx.type === 'data') {
          if (tx.dataPlan) {
              return `${tx.dataPlan.network} ${tx.dataPlan.data} (${tx.dataPlan.validity})`;
          }
          return 'Data Bundle'; // Fallback only if relation missing
      }
      if (tx.type === 'ecommerce') {
          if (tx.product) {
              return tx.product.name;
          }
          return 'Mobile Device'; // Fallback
      }
      return 'Unknown Item';
  };

  return (
    <div className="p-6 pb-32 min-h-screen">
      <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Track Order</h1>
          <p className="text-slate-500 text-sm mt-1">Check the status of your data or product orders.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 mb-8">
        <div className="space-y-4">
            <Input 
                label="Phone Number"
                className="h-12"
                placeholder="Enter phone number used" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
            />
            <Button onClick={handleTrack} isLoading={isLoading} className="h-12 bg-slate-900">
                <Search className="w-4 h-4 mr-2" />
                Track Now
            </Button>
        </div>
      </div>

      {/* Shared Hidden Receipt */}
      {receiptTx && (
        <SharedReceipt 
            ref={receiptRef}
            transaction={{
                tx_ref: receiptTx.tx_ref,
                amount: receiptTx.amount,
                date: new Date(receiptTx.createdAt).toLocaleString(),
                type: receiptTx.type === 'ecommerce' ? 'Devices' : 'Data Bundle',
                description: getTransactionDescription(receiptTx),
                status: receiptTx.status,
                customerPhone: receiptTx.phone,
                customerName: receiptTx.customerName
            }}
        />
      )}

      {hasSearched && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Recent Transactions</h3>
            {transactions.length > 0 ? (
                <div className="space-y-3">
                    {transactions.map((tx) => (
                        <div key={tx.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-sm font-bold text-slate-900 capitalize flex items-center gap-2">
                                        {tx.type === 'ecommerce' ? 'Devices' : 'Data Bundle'}
                                    </div>
                                    <div className="text-xs text-slate-600 font-medium mt-1">{getTransactionDescription(tx)}</div>
                                    <div className="text-xs text-slate-400 mt-0.5">Ref: {tx.tx_ref.slice(0, 18)}...</div>
                                    <div className="text-xs text-slate-500 mt-0.5">{new Date(tx.createdAt).toLocaleString()}</div>
                                </div>
                                <span className={cn("text-[10px] uppercase font-bold px-3 py-1 rounded-full", getStatusColor(tx.status))}>
                                    {tx.status}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                <div className="text-lg font-bold text-slate-900">{formatCurrency(tx.amount)}</div>
                                
                                <div className="flex gap-2">
                                    {(tx.status === 'pending' || tx.status === 'failed' || (tx.type === 'data' && tx.status === 'paid')) && (
                                        <Button 
                                            variant="outline" 
                                            onClick={() => handleRetry(tx.tx_ref, tx.id)}
                                            disabled={retryingId === tx.id}
                                            className="h-9 px-3 text-xs"
                                        >
                                            {retryingId === tx.id ? <Loader2 className="animate-spin w-3 h-3" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                                            {tx.status === 'paid' ? 'Retry Delivery' : 'Check Status'}
                                        </Button>
                                    )}

                                    {tx.type === 'data' && tx.status === 'paid' && (
                                        <div className="hidden sm:flex items-center text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded-lg">
                                            <AlertTriangle className="w-3 h-3 mr-1" /> Network Error
                                        </div>
                                    )}

                                    {(tx.status === 'delivered' || (tx.type === 'ecommerce' && tx.status === 'paid')) && (
                                        <Button 
                                            variant="secondary" 
                                            onClick={() => handleDownloadReceipt(tx)}
                                            className="h-9 px-3 text-xs bg-green-50 text-green-700 hover:bg-green-100"
                                        >
                                            <Download className="w-3 h-3 mr-1" /> Receipt
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                    <p className="text-slate-400 text-sm">No transactions found for this number.</p>
                </div>
            )}
          </div>
      )}
    </div>
  );
};