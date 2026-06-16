const prisma = require('../config/database');

/**
 * Get all accounts for authenticated user.
 */
async function getAccounts(req, res) {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ accounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
}

/**
 * Get single account with balance.
 */
async function getAccount(req, res) {
  try {
    const account = await prisma.account.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({ account });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
}

/**
 * Update account name.
 */
async function updateAccount(req, res) {
  try {
    const { name } = req.body;

    const account = await prisma.account.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const updated = await prisma.account.update({
      where: { id: req.params.id },
      data: { name },
    });

    res.json({ account: updated });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
}

module.exports = { getAccounts, getAccount, updateAccount };
