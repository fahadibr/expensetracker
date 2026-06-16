const prisma = require('../config/database');

/**
 * Monthly report: income, expenses, savings for a given month.
 */
async function getMonthlyReport(req, res) {
  try {
    const userId = req.user.id;
    const { year, month } = req.query;

    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0);

    const dateFilter = {
      userId,
      transactionDate: { gte: startDate, lte: endDate },
    };

    const [income, expenses] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...dateFilter, transactionType: 'income' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...dateFilter, transactionType: 'expense' },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = parseFloat(income._sum.amount || 0);
    const totalExpenses = parseFloat(expenses._sum.amount || 0);

    res.json({
      report: {
        year: y,
        month: m,
        totalIncome,
        totalExpenses,
        savings: totalIncome - totalExpenses,
      },
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({ error: 'Failed to generate monthly report' });
  }
}

/**
 * Category report: expenses grouped by category for a given period.
 */
async function getCategoryReport(req, res) {
  try {
    const userId = req.user.id;
    const { year, month } = req.query;

    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0);

    const categories = await prisma.category.findMany({
      where: { userId },
    });

    const expenses = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        transactionType: 'expense',
        transactionDate: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: true,
    });

    const categoryReport = categories.map(cat => {
      const exp = expenses.find(e => e.categoryId === cat.id);
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        totalAmount: parseFloat(exp?._sum.amount || 0),
        transactionCount: exp?._count || 0,
      };
    });

    const totalExpenses = categoryReport.reduce((sum, c) => sum + c.totalAmount, 0);

    res.json({
      report: {
        year: y,
        month: m,
        categories: categoryReport,
        totalExpenses,
      },
    });
  } catch (error) {
    console.error('Category report error:', error);
    res.status(500).json({ error: 'Failed to generate category report' });
  }
}

/**
 * Account report: current balances and transaction summaries.
 */
async function getAccountReport(req, res) {
  try {
    const userId = req.user.id;

    const accounts = await prisma.account.findMany({
      where: { userId },
    });

    const accountReport = await Promise.all(
      accounts.map(async (account) => {
        const [income, expenses] = await Promise.all([
          prisma.transaction.aggregate({
            where: { userId, accountId: account.id, transactionType: 'income' },
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: { userId, accountId: account.id, transactionType: 'expense' },
            _sum: { amount: true },
          }),
        ]);

        return {
          accountId: account.id,
          accountName: account.name,
          accountType: account.type,
          balance: parseFloat(account.balance),
          totalIncome: parseFloat(income._sum.amount || 0),
          totalExpenses: parseFloat(expenses._sum.amount || 0),
        };
      })
    );

    res.json({ report: { accounts: accountReport } });
  } catch (error) {
    console.error('Account report error:', error);
    res.status(500).json({ error: 'Failed to generate account report' });
  }
}

/**
 * Monthly trend data for charts (last 6 months).
 */
async function getMonthlyTrend(req, res) {
  try {
    const userId = req.user.id;
    const months = parseInt(req.query.months) || 6;

    const trends = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const [income, expenses] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            userId,
            transactionType: 'income',
            transactionDate: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            userId,
            transactionType: 'expense',
            transactionDate: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        }),
      ]);

      trends.push({
        year: startDate.getFullYear(),
        month: startDate.getMonth() + 1,
        monthName: startDate.toLocaleString('default', { month: 'short' }),
        income: parseFloat(income._sum.amount || 0),
        expenses: parseFloat(expenses._sum.amount || 0),
      });
    }

    res.json({ trends });
  } catch (error) {
    console.error('Monthly trend error:', error);
    res.status(500).json({ error: 'Failed to generate trend data' });
  }
}

module.exports = {
  getMonthlyReport,
  getCategoryReport,
  getAccountReport,
  getMonthlyTrend,
};
