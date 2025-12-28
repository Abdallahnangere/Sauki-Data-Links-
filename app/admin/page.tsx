'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn, formatCurrency } from '../../lib/utils';
import { Loader2, Upload, Lock, Trash2, Edit2, RefreshCw, Send, CheckCircle2, Download, Search } from 'lucide-react';
import { DataPlan, Product, Transaction } from '../../types';
import { toPng } from 'html-to-image';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<'dashboard' | 'product' | 'plan' | 'transactions' | 'manual'>('dashboard');
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Forms
  const [productForm, setProductForm] = useState<Partial<Product>>({ name: '', description: '', price: 0, image: '' });
  const [planForm, setPlanForm] = useState<Partial<DataPlan>>({ network: 'MTN', data: '', validity: '30 Days', price: 0, planId: 0 });
  const [manualForm, setManualForm] = useState({ phone: '', planId: '' });
  
  const [editMode, setEditMode] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
        fetchData();
    }
  }, [isAuthenticated, view]);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [pRes, plRes, txRes] = await Promise.all([
            fetch('/api/products').then(r => r.json()),
            fetch('/api/data-plans').then(r => r.json()),
            fetch('/api/transactions/list').then(r => r.json())
        ]);
        setProducts(pRes);
        setPlans(plRes);
        setTransactions(txRes);
    } finally {
        setLoading(false);
    }
  };

  const checkAuth = async () => {
      setLoading(true);
      try {
          const res = await fetch('/api/admin/auth', {
              method: 'POST',
              body: JSON.stringify({ password })
          });
          if (res.ok) setIsAuthenticated(true);
          else alert("Incorrect Password");
      } catch (e) { alert("Error"); } 
      finally { setLoading(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setProductForm({ ...productForm, image: reader.result as string });
        reader.readAsDataURL(file);
    }
  };

  // --- CRUD Handlers ---

  const saveProduct = async () => {
      setLoading(true);
      const method = editMode ? 'PUT' : 'POST';
      await fetch('/api/products', { method, body: JSON.stringify(productForm) });
      setEditMode(false);
      setProductForm({ name: '', description: '', price: 0, image: '' });
      fetchData();
      setView('dashboard');
  };

  const deleteProduct = async (id: string) => {
      if(!confirm("Delete this product?")) return;
      await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      fetchData();
  };

  const savePlan = async () => {
      setLoading(true);
      const method = editMode ? 'PUT' : 'POST';
      await fetch('/api/data-plans', { method, body: JSON.stringify(planForm) });
      setEditMode(false);
      setPlanForm({ network: 'MTN', data: '', validity: '30 Days', price: 0, planId: 0 });
      fetchData();
      setView('dashboard');
  };

  const deletePlan = async (id: string) => {
      if(!confirm("Delete this plan?")) return;
      await fetch(`/api/data-plans?id=${id}`, { method: 'DELETE' });
      fetchData();
  };

  const handleManualTopup = async () => {
      if (!manualForm.phone || !manualForm.planId) return alert("Fill all fields");
      setLoading(true);
      const res = await fetch('/api/admin/manual-topup', {
          method: 'POST',
          body: JSON.stringify({ ...manualForm, password })
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok) {
          alert("Topup Successful!");
          setManualForm({ phone: '', planId: '' });
          fetchData();
      } else {
          alert("Topup Failed: " + JSON.stringify(data));
      }
  };

  const generateReceipt = async (tx: Transaction) => {
      setReceiptTx(tx);
      // Wait for React to render the hidden receipt
      setTimeout(async () => {
          if (receiptRef.current) {
              try {
                  const dataUrl = await toPng(receiptRef.current, { cacheBust: true, pixelRatio: 3 });
                  const link = document.createElement('a');
                  link.download = `RECEIPT-${tx.tx_ref}.png`;
                  link.href = dataUrl;
                  link.click();
              } catch (e) { console.error(e); }
              setReceiptTx(null);
          }
      }, 500);
  };

  if (!isAuthenticated) {
      return (
          <div className="flex h-screen items-center justify-center bg-slate-50 p-6">
              <div className="p-8 bg-white rounded-2xl shadow-xl space-y-6 w-full max-w-sm text-center">
                  <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto shadow-lg"><Lock className="text-white" /></div>
                  <h1 className="text-xl font-bold">Admin Portal</h1>
                  <input type="password" className="border p-4 rounded-xl w-full text-center" placeholder="Security Key" value={password} onChange={e => setPassword(e.target.value)} />
                  <button onClick={checkAuth} className="bg-slate-900 text-white p-4 rounded-xl w-full font-bold">{loading ? <Loader2 className="animate-spin mx-auto" /> : 'Enter'}</button>
              </div>
          </div>
      );
  }

  return (
      <div className="min-h-screen bg-slate-50 p-4 pb-24">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-black text-slate-900">SAUKI ADMIN</h1>
            {view !== 'dashboard' && <button onClick={() => { setView('dashboard'); setEditMode(false); }} className="bg-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">Back</button>}
          </header>

          {/* Hidden Receipt Generator */}
          {receiptTx && (
            <div className="fixed -left-[9999px]">
                <div ref={receiptRef} className="w-[400px] bg-white p-8 border border-slate-200 flex flex-col items-center text-center font-sans">
                    <img src="/logo.png" className="h-16 w-auto mb-2 object-contain" />
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">SAUKI MART</h1>
                    <p className="text-xs text-slate-500 mb-6 uppercase tracking-widest">Official Receipt</p>
                    <div className="w-full h-px bg-slate-100 mb-6"></div>
                    <div className="space-y-4 w-full mb-8 text-left">
                        <div className="flex justify-between"><span className="text-slate-500">Ref</span><span className="font-mono font-bold">{receiptTx.tx_ref}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Date</span><span>{new Date(receiptTx.createdAt).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Beneficiary</span><span>{receiptTx.phone}</span></div>
                        <div className="flex justify-between text-lg font-bold border-t pt-4"><span className="text-slate-900">Amount</span><span className="text-green-600">{formatCurrency(receiptTx.amount)}</span></div>
                        <div className="text-center text-xs text-slate-400 mt-4 uppercase font-bold">{receiptTx.status}</div>
                    </div>
                    <p className="text-[10px] text-slate-400">Authorized by Sauki Data Links</p>
                </div>
            </div>
          )}

          {view === 'dashboard' && (
              <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setView('product')} className="bg-slate-900 text-white p-6 rounded-2xl text-left shadow-lg">
                          <span className="block text-xs text-slate-400 uppercase">Manage</span>
                          <span className="text-xl font-bold">Products</span>
                      </button>
                      <button onClick={() => setView('plan')} className="bg-blue-600 text-white p-6 rounded-2xl text-left shadow-lg shadow-blue-200">
                          <span className="block text-xs text-blue-200 uppercase">Manage</span>
                          <span className="text-xl font-bold">Data Plans</span>
                      </button>
                  </div>
                  <button onClick={() => setView('transactions')} className="bg-white p-6 rounded-2xl text-left shadow-sm border border-slate-100 flex justify-between items-center">
                      <div>
                          <span className="block text-xs text-slate-400 uppercase">History</span>
                          <span className="text-xl font-bold text-slate-900">All Transactions</span>
                      </div>
                      <div className="bg-slate-100 p-2 rounded-full"><Search className="w-5 h-5 text-slate-600" /></div>
                  </button>
                  <button onClick={() => setView('manual')} className="bg-purple-600 text-white p-6 rounded-2xl text-left shadow-lg shadow-purple-200 flex justify-between items-center">
                      <div>
                          <span className="block text-xs text-purple-200 uppercase">Admin Only</span>
                          <span className="text-xl font-bold">Manual Topup</span>
                      </div>
                      <Send className="w-6 h-6 text-white" />
                  </button>
              </div>
          )}

          {view === 'transactions' && (
              <div className="space-y-4">
                  <h2 className="font-bold text-lg">Last 50 Transactions</h2>
                  {transactions.map(tx => (
                      <div key={tx.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                          <div>
                              <div className="font-bold text-slate-900 flex items-center gap-2">
                                  {tx.phone}
                                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full uppercase", 
                                      tx.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                                      tx.status === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700')}>
                                      {tx.status}
                                  </span>
                              </div>
                              <div className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleString()}</div>
                              <div className="text-xs text-slate-400 font-mono">{tx.tx_ref}</div>
                          </div>
                          <div className="text-right">
                              <div className="font-bold">{formatCurrency(tx.amount)}</div>
                              <button onClick={() => generateReceipt(tx)} className="text-xs text-blue-600 flex items-center justify-end mt-1 gap-1">
                                  <Download className="w-3 h-3" /> Receipt
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          )}

          {view === 'manual' && (
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                  <h2 className="font-bold text-xl mb-4 text-purple-700">Manual Data Topup</h2>
                  <div className="space-y-4">
                      <input className="border p-3 rounded-xl w-full" placeholder="Phone Number" value={manualForm.phone} onChange={e => setManualForm({...manualForm, phone: e.target.value})} />
                      <select className="border p-3 rounded-xl w-full bg-white" value={manualForm.planId} onChange={e => setManualForm({...manualForm, planId: e.target.value})}>
                          <option value="">Select Plan</option>
                          {plans.map(p => <option key={p.id} value={p.id}>{p.network} {p.data} - {p.planId}</option>)}
                      </select>
                      <button onClick={handleManualTopup} disabled={loading} className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2">
                          {loading ? <Loader2 className="animate-spin" /> : <><Send className="w-4 h-4" /> Send Instant Data</>}
                      </button>
                  </div>
              </div>
          )}

          {(view === 'product' || view === 'plan') && (
              <div className="space-y-6">
                  {/* List Existing */}
                  <div className="space-y-2">
                      <h3 className="text-sm font-bold text-slate-500 uppercase">Existing Items</h3>
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                          {(view === 'product' ? products : plans).map((item: any) => (
                              <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                                  <span className="font-medium text-sm">{item.name || `${item.network} ${item.data}`}</span>
                                  <div className="flex gap-2">
                                      <button onClick={() => { 
                                          setEditMode(true); 
                                          view === 'product' ? setProductForm(item) : setPlanForm(item);
                                      }} className="p-2 bg-slate-100 rounded-full text-slate-600"><Edit2 className="w-3 h-3" /></button>
                                      <button onClick={() => view === 'product' ? deleteProduct(item.id) : deletePlan(item.id)} className="p-2 bg-red-100 rounded-full text-red-600"><Trash2 className="w-3 h-3" /></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Add/Edit Form */}
                  <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                      <h2 className="font-bold text-xl mb-4">{editMode ? 'Edit' : 'Add New'} {view === 'product' ? 'Product' : 'Plan'}</h2>
                      
                      {view === 'product' ? (
                          <div className="space-y-4">
                              <div className="border-2 border-dashed p-4 rounded-xl text-center relative">
                                  {productForm.image ? <img src={productForm.image} className="h-20 mx-auto object-contain" /> : <Upload className="mx-auto text-slate-400" />}
                                  <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0" />
                              </div>
                              <input placeholder="Name" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="border p-3 w-full rounded-xl" />
                              <input placeholder="Description" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="border p-3 w-full rounded-xl" />
                              <input type="number" placeholder="Price" value={productForm.price} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} className="border p-3 w-full rounded-xl" />
                              <button onClick={saveProduct} disabled={loading} className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold">{loading ? 'Saving...' : 'Save Product'}</button>
                          </div>
                      ) : (
                          <div className="space-y-4">
                              <select value={planForm.network} onChange={e => setPlanForm({...planForm, network: e.target.value as any})} className="border p-3 w-full rounded-xl bg-white">
                                  <option value="MTN">MTN</option><option value="AIRTEL">AIRTEL</option><option value="GLO">GLO</option>
                              </select>
                              <input placeholder="Data Amount (e.g. 1GB)" value={planForm.data} onChange={e => setPlanForm({...planForm, data: e.target.value})} className="border p-3 w-full rounded-xl" />
                              <input placeholder="Validity" value={planForm.validity} onChange={e => setPlanForm({...planForm, validity: e.target.value})} className="border p-3 w-full rounded-xl" />
                              <input type="number" placeholder="Price" value={planForm.price} onChange={e => setPlanForm({...planForm, price: Number(e.target.value)})} className="border p-3 w-full rounded-xl" />
                              <input type="number" placeholder="Amigo Plan ID" value={planForm.planId} onChange={e => setPlanForm({...planForm, planId: Number(e.target.value)})} className="border p-3 w-full rounded-xl" />
                              <button onClick={savePlan} disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold">{loading ? 'Saving...' : 'Save Plan'}</button>
                          </div>
                      )}
                      
                      {editMode && <button onClick={() => { setEditMode(false); setProductForm({}); setPlanForm({}); }} className="w-full mt-2 text-slate-500 py-2">Cancel Edit</button>}
                  </div>
              </div>
          )}
      </div>
  );
}