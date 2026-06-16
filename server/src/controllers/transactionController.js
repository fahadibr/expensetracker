const prisma = require('../config/database');
const { Prisma } = require('@prisma/client');

/**
 * Get all transactions with filters, search, sort, and pagination.
 */
async function getTransactions(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      startDate,
      endDate,
      categoryId,
      accountId,
      transactionType,
      sortBy = 'transactionDate',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build filter
    const where = { userId: req.user.id };

    if (search) {
      where.description = { contains: search, mode: 'insensitive' };
    }

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate);
      if (endDate) where.transactionDate.lte = new Date(endDate);
    }

    if (categoryId) where.categoryId = categoryId;
    if (accountId) where.accountId = accountId;
    if (transactionType) where.transactionType = transactionType;

    // Valid sort fields
    const validSorts = ['transactionDate', 'amount', 'createdAt'];
    const orderField = validSorts.includes(sortBy) ? sortBy : 'transactionDate';
    const orderDir = sortOrder === 'asc' ? 'asc' : 'desc';

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          account: { select: { id: true, name: true, type: true } },
          category: { select: { id: true, name: true } },
        },
        orderBy: { [orderField]: orderDir },
        skip,
        take,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
}

/**
 * Get single transaction.
 */
async function getTransaction(req, res) {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        account: { select: { id: true, name: true, type: true } },
        category: { select: { id: true, name: true } },
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
}

/**
 * Create a new transaction.
 * Handles income, expense, and transfer types with balance updates.
 */
async function createTransaction(req, res) {
  try {
    const { accountId, categoryId, transactionType, amount, description, transactionDate, toAccountId } = req.body;

    const parsedAmount = new Prisma.Decimal(amount);

    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: req.user.id },
    });
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // For transfers, verify target account
    if (transactionType === 'transfer') {
      if (!toAccountId) {
        return res.status(400).json({ error: 'Target account is required for transfers' });
      }
      const toAccount = await prisma.account.findFirst({
        where: { id: toAccountId, userId: req.user.id },
      });
      if (!toAccount) {
        return res.status(404).json({ error: 'Target account not found' });
      }
    }

    // Verify category belongs to user (if provided)
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId: req.user.id },
      });
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
    }

    // Use transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create the transaction record
      const txn = await tx.transaction.create({
        data: {
          userId: req.user.id,
          accountId,
          categoryId: transactionType === 'transfer' ? null : categoryId,
          transactionType,
          amount: parsedAmount,
          description,
          transactionDate: new Date(transactionDate),
          toAccountId: transactionType === 'transfer' ? toAccountId : null,
        },
        include: {
          account: { select: { id: true, name: true, type: true } },
          category: { select: { id: true, name: true } },
        },
      });

      // Update account balances
      if (transactionType === 'income') {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: parsedAmount } },
        });
      } else if (transactionType === 'expense') {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { decrement: parsedAmount } },
        });
      } else if (transactionType === 'transfer') {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { decrement: parsedAmount } },
        });
        await tx.account.update({
          where: { id: toAccountId },
          data: { balance: { increment: parsedAmount } },
        });
      }

      return txn;
    });

    res.status(201).json({ transaction: result });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
}

/**
 * Update an existing transaction.
 * Reverses old balance changes and applies new ones.
 */
async function updateTransaction(req, res) {
  try {
    const { accountId, categoryId, transactionType, amount, description, transactionDate, toAccountId } = req.body;

    // Get existing transaction
    const existing = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const newAmount = new Prisma.Decimal(amount);

    // Verify new account belongs to user
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: req.user.id },
    });
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Reverse old balance changes
      if (existing.transactionType === 'income') {
        await tx.account.update({
          where: { id: existing.accountId },
          data: { balance: { decrement: existing.amount } },
        });
      } else if (existing.transactionType === 'expense') {
        await tx.account.update({
          where: { id: existing.accountId },
          data: { balance: { increment: existing.amount } },
        });
      } else if (existing.transactionType === 'transfer') {
        await tx.account.update({
          where: { id: existing.accountId },
          data: { balance: { increment: existing.amount } },
        });
        if (existing.toAccountId) {
          await tx.account.update({
            where: { id: existing.toAccountId },
            data: { balance: { decrement: existing.amount } },
          });
        }
      }

      // Update the transaction
      const txn = await tx.transaction.update({
        where: { id: req.params.id },
        data: {
          accountId,
          categoryId: transactionType === 'transfer' ? null : categoryId,
          transactionType,
          amount: newAmount,
          description,
          transactionDate: new Date(transactionDate),
          toAccountId: transactionType === 'transfer' ? toAccountId : null,
        },
        include: {
          account: { select: { id: true, name: true, type: true } },
          category: { select: { id: true, name: true } },
        },
      });

      // Apply new balance changes
      if (transactionType === 'income') {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: newAmount } },
        });
      } else if (transactionType === 'expense') {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { decrement: newAmount } },
        });
      } else if (transactionType === 'transfer') {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { decrement: newAmount } },
        });
        await tx.account.update({
          where: { id: toAccountId },
          data: { balance: { increment: newAmount } },
        });
      }

      return txn;
    });

    res.json({ transaction: result });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
}

/**
 * Delete a transaction and reverse its balance changes.
 */
async function deleteTransaction(req, res) {
  try {
    const existing = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await prisma.$transaction(async (tx) => {
      // Reverse balance changes
      if (existing.transactionType === 'income') {
        await tx.account.update({
          where: { id: existing.accountId },
          data: { balance: { decrement: existing.amount } },
        });
      } else if (existing.transactionType === 'expense') {
        await tx.account.update({
          where: { id: existing.accountId },
          data: { balance: { increment: existing.amount } },
        });
      } else if (existing.transactionType === 'transfer') {
        await tx.account.update({
          where: { id: existing.accountId },
          data: { balance: { increment: existing.amount } },
        });
        if (existing.toAccountId) {
          await tx.account.update({
            where: { id: existing.toAccountId },
            data: { balance: { decrement: existing.amount } },
          });
        }
      }

      await tx.transaction.delete({ where: { id: req.params.id } });
    });

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
}

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
