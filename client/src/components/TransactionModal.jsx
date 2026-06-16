import { useState } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { formatDateForInput } from '../utils/helpers';

export default function TransactionModal({ transaction, accounts, categories, onClose, onSaved }) {
  const isEdit = !!transaction;
  const [form, setForm] = useState({
    transactionType: transaction?.transactionType || 'expense',
    amount: transaction?.amount || '',
    description: transaction?.description || '',
    categoryId: transaction?.categoryId || transaction?.category?.id || '',
    accountId: transaction?.accountId || transaction?.account?.id || accounts[0]?.id || '',
    toAccountId: transaction?.toAccountId || '',
    transactionDate: transaction ? formatDateForInput(transaction.transactionDate) : new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return toast.error('Enter a valid amount');
    if (form.transactionType !== 'transfer' && !form.categoryId) return toast.error('Select a category');
    if (form.transactionType === 'transfer' && !form.toAccountId) return toast.error('Select target account');

    setLoading(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (payload.transactionType === 'transfer') payload.categoryId = null;

      if (isEdit) {
        await api.put(`/transactions/${transaction.id}`, payload);
        toast.success('Transaction updated!');
      } else {
        await api.post('/transactions', payload);
        toast.success('Transaction added!');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  const inputCls = `w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-800 
    focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all`;

  const typeColors = {
    income: 'bg-success-light text-success border-success/20',
    expense: 'bg-danger-light text-danger border-danger/20',
    transfer: 'bg-info-light text-info border-info/20',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="sticky top-0 bg-white rounded-t-2xl px-6 py-4 border-b border-surface-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-surface-900">{isEdit ? 'Edit Transaction' : 'Add Transaction'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400 cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-2">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['income', 'expense', 'transfer'].map(type => (
                <button key={type} type="button" onClick={() => update('transactionType', type)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-all cursor-pointer capitalize
                    ${form.transactionType === type ? typeColors[type] + ' border-current' : 'bg-surface-50 text-surface-500 border-surface-200 hover:bg-surface-100'}`}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1.5">Amount (Rs)</label>
            <input type="number" step="0.01" min="0" value={form.amount} onChange={e => update('amount', e.target.value)}
              className={inputCls + ' text-lg font-semibold'} placeholder="0.00" required />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1.5">Date</label>
            <input type="date" value={form.transactionDate} onChange={e => update('transactionDate', e.target.value)} className={inputCls} required />
          </div>

          {/* Account */}
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1.5">
              {form.transactionType === 'transfer' ? 'From Account' : 'Account'}
            </label>
            <select value={form.accountId} onChange={e => update('accountId', e.target.value)} className={inputCls} required>
              <option value="">Select account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
            </select>
          </div>

          {/* To Account (transfer only) */}
          {form.transactionType === 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1.5">To Account</label>
              <select value={form.toAccountId} onChange={e => update('toAccountId', e.target.value)} className={inputCls} required>
                <option value="">Select target account</option>
                {accounts.filter(a => a.id !== form.accountId).map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
              </select>
            </div>
          )}

          {/* Category (not for transfers) */}
          {form.transactionType !== 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1.5">Category</label>
              <select value={form.categoryId} onChange={e => update('categoryId', e.target.value)} className={inputCls} required>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1.5">Description (optional)</label>
            <input type="text" value={form.description} onChange={e => update('description', e.target.value)} className={inputCls} placeholder="e.g., Fuel, Grocery, Salary" />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-surface-200 text-surface-600 font-medium hover:bg-surface-50 transition-all cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl gradient-primary text-white font-semibold shadow-lg disabled:opacity-50 transition-all cursor-pointer">
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
