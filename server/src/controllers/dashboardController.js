const prisma = require('../config/database');

/**
 * Get dashboard summary data.
 */
async function getDashboard(req, res) {
  try {
    const userId = req.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get accounts with balances
    const accounts = await prisma.account.findMany({
      where: { userId },
      select: { id: true, name: true, type: true, balance: true },
    });

    const bankBalance = accounts
      .filter(a => a.type === 'bank')
      .reduce((sum, a) => sum + parseFloat(a.balance), 0);

    const cashBalance = accounts
      .filter(a => a.type === 'cash')
      .reduce((sum, a) => sum + parseFloat(a.balance), 0);

    // Get categories
    const categories = await prisma.category.findMany({
      where: { userId },
    });

    // Monthly expenses by category
    const monthlyExpenses = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        transactionType: 'expense',
        transactionDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    });

    // Map category names to expenses
    const categoryExpenses = {};
    let totalMonthlyExpenses = 0;

    for (const exp of monthlyExpenses) {
      const category = categories.find(c => c.id === exp.categoryId);
      const amount = parseFloat(exp._sum.amount || 0);
      categoryExpenses[category?.name || 'Uncategorized'] = amount;
      totalMonthlyExpenses += amount;
    }

    // Monthly income
    const monthlyIncomeResult = await prisma.transaction.aggregate({
      where: {
        userId,
        transactionType: 'income',
        transactionDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    });
    const totalMonthlyIncome = parseFloat(monthlyIncomeResult._sum.amount || 0);

    // Recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        account: { select: { name: true, type: true } },
        category: { select: { name: true } },
      },
      orderBy: { transactionDate: 'desc' },
      take: 5,
    });

    res.json({
      summary: {
        bankBalance,
        cashBalance,
        totalBalance: bankBalance + cashBalance,
        totalMonthlyIncome,
        totalMonthlyExpenses,
        monthlySavings: totalMonthlyIncome - totalMonthlyExpenses,
        categoryExpenses,
      },
      accounts,
      recentTransactions,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
}

module.exports = { getDashboard };
