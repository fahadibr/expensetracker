import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import api from '../api/client';
import { formatCurrency, formatDate, getTypeStyles, CATEGORY_COLORS } from '../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard'),
      api.get('/reports/trend?months=6'),
    ]).then(([dash, trend]) => {
      setData(dash.data);
      setTrends(trend.data.trends);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-white rounded-2xl" />
          <div className="h-72 bg-white rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-surface-400">Failed to load dashboard.</p>;

  const { summary, recentTransactions } = data;

  const summaryCards = [
    { label: 'Bank Balance', value: summary.bankBalance, icon: '🏦', color: 'from-blue-500 to-blue-600' },
    { label: 'Cash In Hand', value: summary.cashBalance, icon: '💵', color: 'from-emerald-500 to-emerald-600' },
    { label: 'Monthly Income', value: summary.totalMonthlyIncome, icon: '📈', color: 'from-green-500 to-green-600' },
    { label: 'Monthly Expenses', value: summary.totalMonthlyExpenses, icon: '📉', color: 'from-red-500 to-rose-600' },
    { label: 'Monthly Savings', value: summary.monthlySavings, icon: '🎯', color: 'from-violet-500 to-purple-600' },
    { label: 'Total Balance', value: summary.totalBalance, icon: '💰', color: 'from-amber-500 to-orange-600' },
  ];

  // Line chart data
  const lineData = trends ? {
    labels: trends.map(t => t.monthName),
    datasets: [
      {
        label: 'Income',
        data: trends.map(t => t.income),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.1)',
        fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6,
      },
      {
        label: 'Expenses',
        data: trends.map(t => t.expenses),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.1)',
        fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6,
      },
    ],
  } : null;

  // Doughnut data
  const catExpenses = summary.categoryExpenses || {};
  const catKeys = Object.keys(catExpenses);
  const doughnutData = {
    labels: catKeys,
    datasets: [{
      data: Object.values(catExpenses),
      backgroundColor: catKeys.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length].hex),
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-surface-900">Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-card hover-lift border border-surface-100"
               style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-surface-400">{card.label}</span>
              <span className="text-xl">{card.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${card.value < 0 ? 'text-danger' : 'text-surface-900'}`}>
              Rs {formatCurrency(Math.abs(card.value))}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {lineData && (
          <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
            <h3 className="text-lg font-semibold text-surface-800 mb-4">Monthly Trend</h3>
            <Line data={lineData} options={{
              responsive: true, maintainAspectRatio: true,
              plugins: { legend: { position: 'bottom' } },
              scales: { y: { beginAtZero: true, ticks: { callback: v => `Rs ${(v/1000).toFixed(0)}k` } } },
            }} />
          </div>
        )}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
          <h3 className="text-lg font-semibold text-surface-800 mb-4">Expense Distribution</h3>
          {Object.keys(catExpenses).length > 0 ? (
            <div className="max-w-[260px] mx-auto">
              <Doughnut data={doughnutData} options={{
                responsive: true, cutout: '65%',
                plugins: { legend: { position: 'bottom' } },
              }} />
            </div>
          ) : (
            <p className="text-surface-400 text-center py-8">No expenses this month</p>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-card border border-surface-100">
        <div className="flex items-center justify-between p-6 pb-4">
          <h3 className="text-lg font-semibold text-surface-800">Recent Transactions</h3>
          <Link to="/transactions" className="text-sm text-primary-600 font-medium hover:text-primary-700">View all →</Link>
        </div>
        <div className="px-6 pb-6">
          {recentTransactions?.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map(txn => {
                const style = getTypeStyles(txn.transactionType);
                return (
                  <div key={txn.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-50 transition-colors">
                    <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center text-lg`}>
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-800 truncate">{txn.description || txn.category?.name || 'Transaction'}</p>
                      <p className="text-xs text-surface-400">{formatDate(txn.transactionDate)} · {txn.account?.name}</p>
                    </div>
                    <p className={`text-sm font-semibold ${txn.transactionType === 'income' ? 'text-success' : 'text-danger'}`}>
                      {txn.transactionType === 'income' ? '+' : '-'}Rs {formatCurrency(txn.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-surface-400 text-center py-6">No transactions yet. <Link to="/transactions" className="text-primary-600">Add one!</Link></p>
          )}
        </div>
      </div>
    </div>
  );
}
