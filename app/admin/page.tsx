'use client';

import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<'dashboard' | 'product' | 'plan'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Product Form State
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image: ''
  });

  // Plan Form State
  const [planForm, setPlanForm] = useState({
    network: 'MTN',
    data: '',
    validity: '30 Days',
    price: '',
    planId: ''
  });

  const checkAuth = () => {
      // In production, use real auth. For now, simple gate.
      if (password.length > 3) setIsAuthenticated(true);
  };

  const handleCreateProduct = async () => {
    setLoading(true);
    setMessage('');
    try {
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productForm)
        });
        if (res.ok) {
            setMessage('Product created successfully!');
            setProductForm({ name: '', description: '', price: '', image: '' });
            setTimeout(() => setView('dashboard'), 1500);
        } else {
            setMessage('Failed to create product.');
        }
    } catch (e) {
        setMessage('Error occurred.');
    } finally {
        setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    setLoading(true);
    setMessage('');
    try {
        const res = await fetch('/api/data-plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(planForm)
        });
        if (res.ok) {
            setMessage('Data plan created successfully!');
            setPlanForm({ network: 'MTN', data: '', validity: '30 Days', price: '', planId: '' });
            setTimeout(() => setView('dashboard'), 1500);
        } else {
            setMessage('Failed to create plan.');
        }
    } catch (e) {
        setMessage('Error occurred.');
    } finally {
        setLoading(false);
    }
  };

  if (!isAuthenticated) {
      return (
          <div className="flex h-screen items-center justify-center bg-slate-50 p-6">
              <div className="p-8 bg-white rounded-xl shadow-md space-y-4 w-full max-w-sm">
                  <h1 className="text-xl font-bold text-center">Admin Access</h1>
                  <input 
                    type="password" 
                    className="border p-3 rounded-xl w-full" 
                    placeholder="Enter Admin Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button onClick={checkAuth} className="bg-black text-white px-4 py-3 rounded-xl w-full font-semibold">Login</button>
              </div>
          </div>
      );
  }

  return (
      <div className="min-h-screen bg-slate-50 p-6 pb-24">
          <div className="max-w-3xl mx-auto space-y-8">
              <header className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-900">SAUKI Admin</h1>
                {view !== 'dashboard' && (
                    <button onClick={() => setView('dashboard')} className="text-sm font-medium text-slate-500 hover:text-slate-900">
                        ← Back to Dashboard
                    </button>
                )}
              </header>

              {view === 'dashboard' && (
                  <div className="grid gap-6">
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                          <h2 className="text-xl font-bold mb-4">Catalog Management</h2>
                          <div className="flex flex-col sm:flex-row gap-4">
                              <button 
                                onClick={() => setView('product')}
                                className="bg-slate-900 text-white px-6 py-4 rounded-xl font-medium flex-1 shadow-lg hover:bg-slate-800 transition-colors"
                              >
                                  + Add New Product
                              </button>
                              <button 
                                onClick={() => setView('plan')}
                                className="bg-blue-600 text-white px-6 py-4 rounded-xl font-medium flex-1 shadow-lg hover:bg-blue-700 transition-colors"
                              >
                                  + Add Data Plan
                              </button>
                          </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-lg font-semibold mb-4">System Health</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100">
                                <div className="text-xs font-medium uppercase tracking-wider opacity-70">Database</div>
                                <div className="font-bold text-lg">Connected</div>
                            </div>
                            <div className="p-4 bg-orange-50 text-orange-700 rounded-xl border border-orange-100">
                                <div className="text-xs font-medium uppercase tracking-wider opacity-70">Amigo API</div>
                                <div className="font-bold text-lg">Ready</div>
                            </div>
                        </div>
                      </div>
                  </div>
              )}

              {view === 'product' && (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-lg mx-auto">
                      <h2 className="text-xl font-bold mb-6">Add New Product</h2>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                              <input 
                                className="w-full border border-slate-200 rounded-xl p-3"
                                placeholder="e.g. 5G Router"
                                value={productForm.name}
                                onChange={e => setProductForm({...productForm, name: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                              <textarea 
                                className="w-full border border-slate-200 rounded-xl p-3 h-24"
                                placeholder="Short description..."
                                value={productForm.description}
                                onChange={e => setProductForm({...productForm, description: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Price (₦)</label>
                              <input 
                                type="number"
                                className="w-full border border-slate-200 rounded-xl p-3"
                                placeholder="25000"
                                value={productForm.price}
                                onChange={e => setProductForm({...productForm, price: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                              <input 
                                className="w-full border border-slate-200 rounded-xl p-3"
                                placeholder="https://..."
                                value={productForm.image}
                                onChange={e => setProductForm({...productForm, image: e.target.value})}
                              />
                              <p className="text-xs text-slate-400 mt-1">Paste a direct image link.</p>
                          </div>
                          
                          {message && <p className={cn("text-sm font-medium", message.includes('Success') ? "text-green-600" : "text-red-600")}>{message}</p>}

                          <button 
                            disabled={loading}
                            onClick={handleCreateProduct}
                            className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold mt-4 disabled:opacity-50 flex items-center justify-center"
                          >
                              {loading ? <Loader2 className="animate-spin" /> : 'Create Product'}
                          </button>
                      </div>
                  </div>
              )}

              {view === 'plan' && (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-lg mx-auto">
                      <h2 className="text-xl font-bold mb-6">Add Data Plan</h2>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Network</label>
                              <select 
                                className="w-full border border-slate-200 rounded-xl p-3 bg-white"
                                value={planForm.network}
                                onChange={e => setPlanForm({...planForm, network: e.target.value})}
                              >
                                  <option value="MTN">MTN</option>
                                  <option value="AIRTEL">AIRTEL</option>
                                  <option value="GLO">GLO</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Data Amount</label>
                              <input 
                                className="w-full border border-slate-200 rounded-xl p-3"
                                placeholder="e.g. 1GB"
                                value={planForm.data}
                                onChange={e => setPlanForm({...planForm, data: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Validity</label>
                              <input 
                                className="w-full border border-slate-200 rounded-xl p-3"
                                placeholder="e.g. 30 Days"
                                value={planForm.validity}
                                onChange={e => setPlanForm({...planForm, validity: e.target.value})}
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Price (₦)</label>
                                  <input 
                                    type="number"
                                    className="w-full border border-slate-200 rounded-xl p-3"
                                    placeholder="300"
                                    value={planForm.price}
                                    onChange={e => setPlanForm({...planForm, price: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Amigo Plan ID</label>
                                  <input 
                                    type="number"
                                    className="w-full border border-slate-200 rounded-xl p-3"
                                    placeholder="e.g. 1001"
                                    value={planForm.planId}
                                    onChange={e => setPlanForm({...planForm, planId: e.target.value})}
                                  />
                              </div>
                          </div>
                          <p className="text-xs text-slate-400">Ensure the Plan ID matches the Amigo API catalog exactly.</p>
                          
                          {message && <p className={cn("text-sm font-medium", message.includes('Success') ? "text-green-600" : "text-red-600")}>{message}</p>}

                          <button 
                            disabled={loading}
                            onClick={handleCreatePlan}
                            className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold mt-4 disabled:opacity-50 flex items-center justify-center hover:bg-blue-700"
                          >
                              {loading ? <Loader2 className="animate-spin" /> : 'Create Plan'}
                          </button>
                      </div>
                  </div>
              )}
          </div>
      </div>
  );
}