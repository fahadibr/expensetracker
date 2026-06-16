import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, formatDateForInput, getTypeStyles, getCategoryColor } from '../utils/helpers';
import TransactionModal from '../components/TransactionModal.jsx';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTxn, setEditTxn] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '', startDate: '', endDate: '', categoryId: '', accountId: '', transactionType: '', page: 1,
  });

  useEffect(() => {
    Promise.all([api.get('/accounts'), api.get('/categories')])
      .then(([a, c]) => { setAccounts(a.data.accounts); setCategories(c.data.categories); });
  }, []);

  useEffect(() => { fetchTransactions(); }, [filters]);

  async function fetchTransactions() {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await api.get('/transactions', { params });
      setTransactions(res.data.transactions);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }

  function openAdd() { setEditTxn(null); setModalOpen(true); }
  function openEdit(txn) { setEditTxn(txn); setModalOpen(true); }

  async function handleDelete(id) {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Transaction deleted');
      fetchTransactions();
    } catch { toast.error('Failed to delete'); }
  }

  function handleSaved() { setModalOpen(false); fetchTransactions(); }

  const updateFilter = (k, v) => setFilters(f => ({ ...f, [k]: v, page: 1 }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-surface-900">Transactions</h2>
        <button onClick={openAdd} className="px-5 py-2.5 rounded-xl gradient-primary text-white font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all cursor-pointer flex items-center gap-2">
          <span className="text-lg">+</span> Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-card border border-surface-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <input type="text" placeholder="Search..." value={filters.search} onChange={e => updateFilter('search', e.target.value)}
            className="px-3 py-2 rounded-lg border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
          <input type="date" value={filters.startDate} onChange={e => updateFilter('startDate', e.target.value)}
            className="px-3 py-2 rounded-lg border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          <input type="date" value={filters.endDate} onChange={e => updateFilter('endDate', e.target.value)}
            className="px-3 py-2 rounded-lg border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          <select value={filters.transactionType} onChange={e => updateFilter('transactionType', e.target.value)}
            className="px-3 py-2 rounded-lg border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20">
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </select>
          <select value={filters.categoryId} onChange={e => updateFilter('categoryId', e.target.value)}
            className="px-3 py-2 rounded-lg border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filters.accountId} onChange={e => updateFilter('accountId', e.target.value)}
            className="px-3 py-2 rounded-lg border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20">
            <option value="">All Accounts</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-2xl shadow-card border border-surface-100 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-surface-100 rounded-xl" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-surface-500 font-medium">No transactions found</p>
            <p className="text-surface-400 text-sm mt-1">Try adjusting your filters or add a new transaction</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider">Description</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider">Category</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider">Account</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider">Type</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider">Amount</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-50">
                  {transactions.map(txn => {
                    const typeStyle = getTypeStyles(txn.transactionType);
                    const catColor = getCategoryColor(txn.category?.name);
                    return (
                      <tr key={txn.id} className="hover:bg-surface-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-surface-600 whitespace-nowrap">{formatDate(txn.transactionDate)}</td>
                        <td className="px-6 py-4 text-sm font-medium text-surface-800">{txn.description || '—'}</td>
                        <td className="px-6 py-4">
                          {txn.category ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${catColor.bg} ${catColor.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${catColor.dot}`} />
                              {txn.category.name}
                            </span>
                          ) : <span className="text-surface-300 text-sm">—</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-surface-600">{txn.account?.name}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}>
                            {typeStyle.icon} {typeStyle.label}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm font-semibold text-right ${txn.transactionType === 'income' ? 'text-success' : 'text-danger'}`}>
                          {txn.transactionType === 'income' ? '+' : '-'}Rs {formatCurrency(txn.amount)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => openEdit(txn)} className="text-surface-400 hover:text-primary-600 p-1 cursor-pointer" title="Edit">✏️</button>
                          <button onClick={() => handleDelete(txn.id)} className="text-surface-400 hover:text-danger p-1 ml-1 cursor-pointer" title="Delete">🗑️</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-surface-100">
              {transactions.map(txn => {
                const typeStyle = getTypeStyles(txn.transactionType);
                return (
                  <div key={txn.id} className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${typeStyle.bg} flex items-center justify-center text-lg shrink-0`}>{typeStyle.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-800 truncate">{txn.description || txn.category?.name || 'Transaction'}</p>
                      <p className="text-xs text-surface-400">{formatDate(txn.transactionDate)} · {txn.account?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${txn.transactionType === 'income' ? 'text-success' : 'text-danger'}`}>
                        {txn.transactionType === 'income' ? '+' : '-'}Rs {formatCurrency(txn.amount)}
                      </p>
                      <div className="flex gap-1 justify-end mt-1">
                        <button onClick={() => openEdit(txn)} className="text-xs text-primary-600 cursor-pointer">Edit</button>
                        <button onClick={() => handleDelete(txn.id)} className="text-xs text-danger cursor-pointer">Del</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-surface-100">
                <p className="text-sm text-surface-400">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</p>
                <div className="flex gap-2">
                  <button disabled={pagination.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                    className="px-3 py-1.5 rounded-lg text-sm border border-surface-200 hover:bg-surface-50 disabled:opacity-30 cursor-pointer">← Prev</button>
                  <button disabled={pagination.page >= pagination.totalPages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                    className="px-3 py-1.5 rounded-lg text-sm border border-surface-200 hover:bg-surface-50 disabled:opacity-30 cursor-pointer">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {modalOpen && (
        <TransactionModal
          transaction={editTxn}
          accounts={accounts}
          categories={categories}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
