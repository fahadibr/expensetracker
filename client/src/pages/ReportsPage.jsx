import { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../api/client';
import { formatCurrency, formatDate, getTypeStyles, CATEGORY_COLORS } from '../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function ReportsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [monthly, setMonthly] = useState(null);
  const [category, setCategory] = useState(null);
  const [accountRpt, setAccountRpt] = useState(null);
  const [monthlyTxns, setMonthlyTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReports(); }, [year, month]);

  async function fetchReports() {
    setLoading(true);
    try {
      const [m, c, a, d] = await Promise.all([
        api.get('/reports/monthly', { params: { year, month } }),
        api.get('/reports/category', { params: { year, month } }),
        api.get('/reports/account'),
        api.get('/reports/monthly-detail', { params: { year, month } }),
      ]);
      setMonthly(m.data.report);
      setCategory(c.data.report);
      setAccountRpt(a.data.report);
      setMonthlyTxns(d.data.transactions);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Build dynamic color map from category data
  const catColors = {};
  if (category) {
    category.categories.forEach((c, i) => {
      catColors[c.categoryName] = CATEGORY_COLORS[i % CATEGORY_COLORS.length].hex;
    });
  }

  const doughnutData = category ? {
    labels: category.categories.map(c => c.categoryName),
    datasets: [{
      data: category.categories.map(c => c.totalAmount),
      backgroundColor: category.categories.map(c => catColors[c.categoryName] || '#94a3b8'),
      borderWidth: 0, hoverOffset: 8,
    }],
  } : null;

  const barData = category ? {
    labels: category.categories.map(c => c.categoryName),
    datasets: [{
      label: 'Expenses',
      data: category.categories.map(c => c.totalAmount),
      backgroundColor: category.categories.map(c => catColors[c.categoryName] || '#94a3b8'),
      borderRadius: 8,
    }],
  } : null;

  // Group transactions by date
  const groupedTxns = {};
  monthlyTxns.forEach(txn => {
    const dateKey = formatDate(txn.transactionDate);
    if (!groupedTxns[dateKey]) groupedTxns[dateKey] = [];
    groupedTxns[dateKey].push(txn);
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-white rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-white rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-surface-900">Reports</h2>
        <div className="flex gap-2">
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
            className="px-3 py-2 rounded-xl border border-surface-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20">
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}
            className="px-3 py-2 rounded-xl border border-surface-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Monthly Summary */}
      {monthly && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-card border border-surface-100 hover-lift">
            <p className="text-sm text-surface-400 mb-1">Total Income</p>
            <p className="text-2xl font-bold text-success">Rs {formatCurrency(monthly.totalIncome)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-card border border-surface-100 hover-lift">
            <p className="text-sm text-surface-400 mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-danger">Rs {formatCurrency(monthly.totalExpenses)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-card border border-surface-100 hover-lift">
            <p className="text-sm text-surface-400 mb-1">Savings</p>
            <p className={`text-2xl font-bold ${monthly.savings >= 0 ? 'text-success' : 'text-danger'}`}>
              {monthly.savings < 0 ? '-' : ''}Rs {formatCurrency(Math.abs(monthly.savings))}
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {barData && (
          <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
            <h3 className="text-lg font-semibold text-surface-800 mb-4">Expenses by Category</h3>
            {category.totalExpenses > 0 ? (
              <Bar data={barData} options={{
                responsive: true, plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { callback: v => `Rs ${(v/1000).toFixed(0)}k` } } },
              }} />
            ) : <p className="text-surface-400 text-center py-8">No expenses this month</p>}
          </div>
        )}
        {doughnutData && (
          <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
            <h3 className="text-lg font-semibold text-surface-800 mb-4">Expense Distribution</h3>
            {category.totalExpenses > 0 ? (
              <div className="max-w-[260px] mx-auto">
                <Doughnut data={doughnutData} options={{ responsive: true, cutout: '65%', plugins: { legend: { position: 'bottom' } } }} />
              </div>
            ) : <p className="text-surface-400 text-center py-8">No expenses this month</p>}
          </div>
        )}
      </div>

      {/* Monthly Transaction Statement */}
      <div className="bg-white rounded-2xl shadow-card border border-surface-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-surface-800">
            📋 Monthly Statement — {months[month - 1]} {year}
          </h3>
          <span className="text-sm text-surface-400">{monthlyTxns.length} transactions</span>
        </div>

        {monthlyTxns.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-surface-500 font-medium">No transactions this month</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {Object.entries(groupedTxns).map(([date, txns]) => (
              <div key={date}>
                <div className="px-6 py-2 bg-surface-50">
                  <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">{date}</p>
                </div>
                <div className="divide-y divide-surface-50">
                  {txns.map(txn => {
                    const style = getTypeStyles(txn.transactionType);
                    return (
                      <div key={txn.id} className="flex items-center gap-4 px-6 py-3 hover:bg-surface-50/50 transition-colors">
                        <div className={`w-9 h-9 rounded-xl ${style.bg} flex items-center justify-center text-base shrink-0`}>
                          {style.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-surface-800 truncate">
                            {txn.description || txn.category?.name || 'Transaction'}
                          </p>
                          <p className="text-xs text-surface-400">
                            {txn.account?.name}
                            {txn.category ? ` · ${txn.category.name}` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${txn.transactionType === 'income' ? 'text-success' : txn.transactionType === 'transfer' ? 'text-info' : 'text-danger'}`}>
                            {txn.transactionType === 'income' ? '+' : '-'}Rs {formatCurrency(txn.amount)}
                          </p>
                          <p className="text-[10px] text-surface-300 uppercase">{style.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Breakdown Table */}
      {category && category.categories.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card border border-surface-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100">
            <h3 className="text-lg font-semibold text-surface-800">Category Breakdown</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-400 uppercase">Category</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-surface-400 uppercase">Transactions</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-surface-400 uppercase">Amount</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-surface-400 uppercase">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {category.categories.map(cat => (
                <tr key={cat.categoryId} className="hover:bg-surface-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: catColors[cat.categoryName] || '#94a3b8' }} />
                      <span className="text-sm font-medium text-surface-800">{cat.categoryName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-surface-600">{cat.transactionCount}</td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-surface-800">Rs {formatCurrency(cat.totalAmount)}</td>
                  <td className="px-6 py-4 text-right text-sm text-surface-500">
                    {category.totalExpenses > 0 ? ((cat.totalAmount / category.totalExpenses) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Account Report */}
      {accountRpt && (
        <div className="bg-white rounded-2xl shadow-card border border-surface-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100">
            <h3 className="text-lg font-semibold text-surface-800">Account Summary</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-surface-100">
            {accountRpt.accounts.map(acc => (
              <div key={acc.accountId} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{acc.accountType === 'bank' ? '🏦' : '💵'}</span>
                  <div>
                    <p className="font-semibold text-surface-800">{acc.accountName}</p>
                    <p className="text-xs text-surface-400 capitalize">{acc.accountType}</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-surface-900 mb-3">Rs {formatCurrency(acc.balance)}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-surface-400">Total Income</span><span className="text-success font-medium">Rs {formatCurrency(acc.totalIncome)}</span></div>
                  <div className="flex justify-between"><span className="text-surface-400">Total Expenses</span><span className="text-danger font-medium">Rs {formatCurrency(acc.totalExpenses)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
