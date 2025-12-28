'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn, formatCurrency } from '../../lib/utils';
import { Loader2, Upload, Lock, Trash2, Edit2, Send, Download, Search, Package, Wifi, LayoutDashboard, LogOut, AlertTriangle } from 'lucide-react';
import { DataPlan, Product, Transaction } from '../../types';
import { SharedReceipt } from '../../components/SharedReceipt';
import { toPng } from 'html-to-image';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<'dashboard' | 'products' | 'plans' | 'orders' | 'transactions' | 'manual'>('dashboard');
  const [loading, setLoading] = useState(false);
  
  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Forms
  const [productForm, setProductForm] = useState<Partial<Product>>({ name: '', description: '', price: 0, image: '' });
  const [planForm, setPlanForm] = useState<Partial<DataPlan>>({ network: 'MTN', data: '', validity: '30 Days', price: 0, planId: 0 });
  const [manualForm, setManualForm] = useState({ phone: '', planId: '' });
  const [editMode, setEditMode] = useState(false);
  
  // Receipt
  const receiptRef = useRef<HTMLDivElement>(null);
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (isAuthenticated) fetchData();
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
          const res = await fetch('/api/admin/auth', { method: 'POST', body: JSON.stringify({ password }) });
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

  // CRUD
  const saveProduct = async () => {
      setLoading(true);
      await fetch('/api/products', { method: editMode ? 'PUT' : 'POST', body: JSON.stringify(productForm) });
      setEditMode(false);
      setProductForm({ name: '', description: '', price: 0, image: '' });
      fetchData();
      setView('products');
  };

  const deleteProduct = async (id: string) => {
      if(!confirm("Delete?")) return;
      await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      fetchData();
  };

  const savePlan = async () => {
      setLoading(true);
      await fetch('/api/data-plans', { method: editMode ? 'PUT' : 'POST', body: JSON.stringify(planForm) });
      setEditMode(false);
      setPlanForm({ network: 'MTN', data: '', validity: '30 Days', price: 0, planId: 0 });
      fetchData();
      setView('plans');
  };

  const deletePlan = async (id: string) => {
      if(!confirm("Delete?")) return;
      await fetch(`/api/data-plans?id=${id}`, { method: 'DELETE' });
      fetchData();
  };

  const handleManualTopup = async () => {
      if (!manualForm.phone || !manualForm.planId) return alert("Fill all fields");
      setLoading(true);
      const res = await fetch('/api/admin/manual-topup', { method: 'POST', body: JSON.stringify({ ...manualForm, password }) });
      const data = await res.json();
      setLoading(false);
      if (res.ok) {
          alert("Topup Successful!");
          setManualForm({ phone: '', planId: '' });
          fetchData();
      } else {
          alert("Failed: " + JSON.stringify(data));
      }
  };

  const handleClearHistory = async () => {
      if (!confirm("⚠️ WARNING: This will permanently delete ALL transaction history. Tracking will be empty. Are you sure?")) return;
      
      const pass = prompt("Confirm Admin Password to Delete:");
      if (!pass) return;

      setLoading(true);
      const res = await fetch('/api/admin/transactions/clear', { 
          method: 'POST', 
          body: JSON.stringify({ password: pass }) 
      });
      
      setLoading(false);
      if (res.ok) {
          alert("History Wiped.");
          fetchData();
      } else {
          alert("Failed to wipe history. Check password.");
      }
  };

  const generateReceipt = async (tx: Transaction) => {
      setReceiptTx(tx);
      setTimeout(async () => {
          if (receiptRef.current) {
              const dataUrl = await toPng(receiptRef.current, { cacheBust: true, pixelRatio: 3 });
              const link = document.createElement('a');
              link.download = `RECEIPT-${tx.tx_ref}.png`;
              link.href = dataUrl;
              link.click();
              setReceiptTx(null);
          }
      }, 500);
  };

  // Safe accessor for receipt description
  const getTransactionDescription = (tx: Transaction) => {
      if (tx.type === 'data') {
          if (tx.dataPlan) {
              return `${tx.dataPlan.network} ${tx.dataPlan.data} (${tx.dataPlan.validity})`;
          }
          return 'Data Bundle';
      }
      if (tx.type === 'ecommerce') {
          if (tx.product) {
              return tx.product.name;
          }
          return 'Mobile Device';
      }
      return 'Item Order';
  };

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center border border-slate-200">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"><Lock className="text-white" /></div>
            <h1 className="text-xl font-black mb-1">Admin Portal</h1>
            <p className="text-slate-400 text-xs mb-6 uppercase tracking-wider">Restricted Access</p>
            <input type="password" className="border p-4 rounded-xl w-full mb-4 bg-slate-50" placeholder="Security Key" value={password} onChange={e => setPassword(e.target.value)} />
            <button onClick={checkAuth} className="bg-slate-900 text-white p-4 rounded-xl w-full font-bold shadow-lg hover:bg-slate-800 transition">{loading ? <Loader2 className="animate-spin mx-auto" /> : 'Access Dashboard'}</button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col fixed h-full z-10">
            <div className="p-8 border-b border-slate-800">
                <h1 className="text-xl font-black tracking-tight">SAUKI ADMIN</h1>
                <p className="text-slate-500 text-xs mt-1">v2.0.0 Pro</p>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {[
                    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
                    { id: 'orders', label: 'Store Orders', icon: Package },
                    { id: 'transactions', label: 'All Transactions', icon: Search },
                    { id: 'products', label: 'Manage Products', icon: Package },
                    { id: 'plans', label: 'Manage Plans', icon: Wifi },
                    { id: 'manual', label: 'Manual Topup', icon: Send },
                ].map(item => (
                    <button key={item.id} onClick={() => setView(item.id as any)} className={cn("flex items-center gap-3 w-full p-3 rounded-lg text-sm font-medium transition-colors", view === item.id ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-800 hover:text-white")}>
                        <item.icon className="w-4 h-4" /> {item.label}
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-slate-800">
                <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-3 text-red-400 hover:text-red-300 w-full p-3"><LogOut className="w-4 h-4" /> Logout</button>
            </div>
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 text-white p-4 z-20 flex justify-between items-center">
            <h1 className="font-bold">SAUKI ADMIN</h1>
            <div className="flex gap-2">
                <button onClick={() => setView('dashboard')} className="p-2 bg-slate-800 rounded">Home</button>
                <button onClick={() => setIsAuthenticated(false)} className="p-2 bg-red-900 rounded">Exit</button>
            </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-8 pt-20 md:pt-8 overflow-y-auto h-screen">
            {receiptTx && <SharedReceipt ref={receiptRef} transaction={{ 
                tx_ref: receiptTx.tx_ref, 
                amount: receiptTx.amount, 
                date: new Date(receiptTx.createdAt).toLocaleString(), 
                type: receiptTx.type === 'ecommerce' ? 'Devices' : 'Data Bundle', 
                description: getTransactionDescription(receiptTx), 
                status: receiptTx.status, 
                customerPhone: receiptTx.phone, 
                customerName: receiptTx.customerName 
            }} />}

            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 capitalize">{view}</h2>
                    <p className="text-slate-500 text-sm">Manage your platform efficiently.</p>
                </div>
            </header>

            {view === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Total Sales</div>
                        <div className="text-3xl font-black text-slate-900">{formatCurrency(transactions.reduce((acc, t) => t.status === 'paid' || t.status === 'delivered' ? acc + t.amount : acc, 0))}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Data Transactions</div>
                        <div className="text-3xl font-black text-slate-900">{transactions.filter(t => t.type === 'data').length}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Pending Orders</div>
                        <div className="text-3xl font-black text-orange-600">{transactions.filter(t => t.type === 'ecommerce' && t.status === 'paid').length}</div>
                    </div>
                </div>
            )}

            {view === 'orders' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-lg">Product Orders</h3>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Item</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transactions.filter(t => t.type === 'ecommerce').map(tx => (
                                <tr key={tx.id} className="hover:bg-slate-50">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-900">{tx.customerName || 'N/A'}</div>
                                        <div className="text-xs text-slate-500">{tx.phone}</div>
                                        <div className="text-xs text-slate-400">{tx.deliveryState}</div>
                                    </td>
                                    <td className="p-4 text-slate-600">{tx.product?.name || tx.productId?.slice(0,8)}</td>
                                    <td className="p-4"><span className={cn("px-2 py-1 rounded-full text-xs font-bold uppercase", tx.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700')}>{tx.status}</span></td>
                                    <td className="p-4 font-bold">{formatCurrency(tx.amount)}</td>
                                    <td className="p-4">
                                        <button onClick={() => generateReceipt(tx)} className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1"><Download className="w-3 h-3" /> Receipt</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {view === 'transactions' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                         <h3 className="font-bold text-lg">All Transactions</h3>
                         <button onClick={handleClearHistory} className="text-xs font-bold bg-red-50 text-red-600 px-3 py-2 rounded-lg border border-red-100 flex items-center gap-1 hover:bg-red-100"><Trash2 className="w-3 h-3" /> Clear History</button>
                    </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="p-4">Ref / Date</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Details</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-slate-50">
                                        <td className="p-4">
                                            <div className="font-mono text-xs font-bold text-slate-700">{tx.tx_ref}</div>
                                            <div className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleString()}</div>
                                        </td>
                                        <td className="p-4 capitalize">{tx.type === 'ecommerce' ? 'Devices' : 'Data Bundle'}</td>
                                        <td className="p-4 text-xs text-slate-600">{getTransactionDescription(tx)}</td>
                                        <td className="p-4"><span className={cn("px-2 py-1 rounded-full text-xs font-bold uppercase", tx.status === 'delivered' ? 'bg-green-100 text-green-700' : tx.status === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500')}>{tx.status}</span></td>
                                        <td className="p-4 font-bold">{formatCurrency(tx.amount)}</td>
                                        <td className="p-4">
                                            <button onClick={() => generateReceipt(tx)} className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1"><Download className="w-3 h-3" /> Receipt</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === 'manual' && (
                <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="font-bold text-2xl text-slate-900 mb-6 flex items-center gap-2"><Send className="w-6 h-6 text-purple-600" /> Manual Topup</h2>
                    <div className="space-y-6">
                         <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Beneficiary Phone</label>
                            <input className="border p-4 rounded-xl w-full bg-slate-50 focus:bg-white transition" placeholder="e.g. 080..." value={manualForm.phone} onChange={e => setManualForm({...manualForm, phone: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Select Plan (Amigo Configured)</label>
                            <select className="border p-4 rounded-xl w-full bg-slate-50" value={manualForm.planId} onChange={e => setManualForm({...manualForm, planId: e.target.value})}>
                                <option value="">-- Choose Data Plan --</option>
                                {plans.map(p => <option key={p.id} value={p.id}>{p.network} {p.data} (Amigo ID: {p.planId})</option>)}
                            </select>
                         </div>
                         <button onClick={handleManualTopup} disabled={loading} className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-purple-700 shadow-lg shadow-purple-200 transition">
                            {loading ? <Loader2 className="animate-spin" /> : 'Send Instant Data'}
                         </button>
                    </div>
                </div>
            )}

            {(view === 'products' || view === 'plans') && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     {/* List */}
                     <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                         <div className="p-6 border-b border-slate-100 flex justify-between">
                            <h3 className="font-bold text-lg">Existing {view}</h3>
                            <button onClick={() => { setEditMode(false); setProductForm({}); setPlanForm({}); }} className="text-blue-600 text-sm font-bold">+ Add New</button>
                         </div>
                         <div className="max-h-[600px] overflow-y-auto p-4 space-y-2">
                            {(view === 'products' ? products : plans).map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        {view === 'products' && <img src={item.image} className="w-10 h-10 object-contain rounded-md bg-white border" />}
                                        <div>
                                            <div className="font-bold text-slate-900">{item.name || `${item.network} ${item.data}`}</div>
                                            <div className="text-xs text-slate-500">{formatCurrency(item.price)}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setEditMode(true); view === 'products' ? setProductForm(item) : setPlanForm(item); }} className="p-2 bg-white border rounded-lg hover:bg-slate-100"><Edit2 className="w-4 h-4 text-slate-600" /></button>
                                        <button onClick={() => view === 'products' ? deleteProduct(item.id) : deletePlan(item.id)} className="p-2 bg-white border rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-600" /></button>
                                    </div>
                                </div>
                            ))}
                         </div>
                     </div>

                     {/* Form */}
                     <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
                         <h3 className="font-bold text-lg mb-6">{editMode ? 'Edit' : 'Create'} {view === 'products' ? 'Product' : 'Plan'}</h3>
                         {view === 'products' ? (
                            <div className="space-y-4">
                                <div className="border-2 border-dashed p-6 rounded-xl text-center relative hover:bg-slate-50 transition cursor-pointer">
                                    {productForm.image ? <img src={productForm.image} className="h-24 mx-auto object-contain" /> : <div className="text-slate-400"><Upload className="mx-auto mb-2" /> <span className="text-xs">Upload Image</span></div>}
                                    <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                                <input className="border p-3 w-full rounded-xl" placeholder="Product Name" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
                                <input className="border p-3 w-full rounded-xl" placeholder="Description" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
                                <input className="border p-3 w-full rounded-xl" type="number" placeholder="Price (NGN)" value={productForm.price || ''} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} />
                                <button onClick={saveProduct} className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold">{loading ? 'Saving...' : 'Save Product'}</button>
                            </div>
                         ) : (
                            <div className="space-y-4">
                                <select className="border p-3 w-full rounded-xl bg-white" value={planForm.network} onChange={e => setPlanForm({...planForm, network: e.target.value as any})}>
                                    <option value="MTN">MTN</option><option value="AIRTEL">AIRTEL</option><option value="GLO">GLO</option>
                                </select>
                                <input className="border p-3 w-full rounded-xl" placeholder="Data (e.g. 1GB)" value={planForm.data} onChange={e => setPlanForm({...planForm, data: e.target.value})} />
                                <input className="border p-3 w-full rounded-xl" placeholder="Validity (e.g. 30 Days)" value={planForm.validity} onChange={e => setPlanForm({...planForm, validity: e.target.value})} />
                                <input className="border p-3 w-full rounded-xl" type="number" placeholder="Price" value={planForm.price || ''} onChange={e => setPlanForm({...planForm, price: Number(e.target.value)})} />
                                <input className="border p-3 w-full rounded-xl" type="number" placeholder="Amigo Plan ID (e.g. 201)" value={planForm.planId || ''} onChange={e => setPlanForm({...planForm, planId: Number(e.target.value)})} />
                                <button onClick={savePlan} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold">{loading ? 'Saving...' : 'Save Data Plan'}</button>
                            </div>
                         )}
                     </div>
                </div>
            )}
        </main>
    </div>
  );
}